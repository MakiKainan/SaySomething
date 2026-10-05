# Converts the four models into browser-friendly files (ONNX + JSON) in
# space/web/, which get uploaded to the public HF repo phuuun/saysomething-web.
# The website (src/utils/localModels.ts) downloads them from there.
# Run: HF_HUB_OFFLINE=1 space/.venv/bin/python space/export_web.py
import json
import os
import shutil

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
import numpy as np
import torch
import onnx
from onnx import TensorProto, helper, numpy_helper
from onnxruntime.quantization.matmul_nbits_quantizer import MatMulNBitsQuantizer

import app  # loads all four models exactly as the server does

OUT = os.path.join(os.path.dirname(__file__), "web")
os.makedirs(OUT, exist_ok=True)
out = lambda f: os.path.join(OUT, f)


# ── TF-IDF: vocab + per-feature [idf, 6 coefs] as float32 ─────────────────
def export_tfidf():
    feats = []
    for vec in (app.word_vec, app.char_vec):
        terms = sorted(vec.vocabulary_, key=vec.vocabulary_.get)
        feats.append((terms, vec.idf_))
    coefs = np.stack([app.logregs[l].coef_[0] for l in app.LABELS], 1)  # (n_feats, 6)
    n_word = len(feats[0][0])
    table = np.column_stack([np.concatenate([feats[0][1], feats[1][1]]), coefs]).astype("<f4")
    table.tofile(out("tfidf.bin"))
    json.dump({
        "word": feats[0][0], "char": feats[1][0], "n_word": n_word,
        "intercepts": [float(app.logregs[l].intercept_[0]) for l in app.LABELS],
    }, open(out("tfidf.json"), "w"), ensure_ascii=False)


# ── LSTM: rebuild in torch with the Keras weights, export ONNX ────────────
class TorchLSTM(torch.nn.Module):
    def __init__(self, km):
        super().__init__()
        L = lambda n: km.get_layer(n)
        emb = L("random_embedding").get_weights()[0]
        self.emb = torch.nn.Embedding.from_pretrained(torch.tensor(emb))
        self.lstm = torch.nn.LSTM(emb.shape[1], L("bilstm").forward_layer.units, batch_first=True, bidirectional=True)
        self.gru = torch.nn.GRU(2 * self.lstm.hidden_size, L("bigru").forward_layer.units, batch_first=True, bidirectional=True)
        # Keras LSTM gates i,f,c,o == torch i,f,g,o. Keras GRU z,r,h → torch r,z,n.
        for rnn, layer, reorder in ((self.lstm, L("bilstm"), None), (self.gru, L("bigru"), [1, 0, 2])):
            for sfx, sub in (("", layer.forward_layer), ("_reverse", layer.backward_layer)):
                kernel, rec, bias = sub.get_weights()
                def fix(w):
                    if reorder is None:
                        return w
                    return np.concatenate([np.split(w, 3, axis=-1)[i] for i in reorder], axis=-1)
                getattr(rnn, f"weight_ih_l0{sfx}").data = torch.tensor(fix(kernel).T.copy())
                getattr(rnn, f"weight_hh_l0{sfx}").data = torch.tensor(fix(rec).T.copy())
                if bias.ndim == 2:  # GRU reset_after: [input bias, recurrent bias]
                    b_ih, b_hh = fix(bias[0]), fix(bias[1])
                else:  # LSTM: one bias, put it all on the input side
                    b_ih, b_hh = bias, np.zeros_like(bias)
                getattr(rnn, f"bias_ih_l0{sfx}").data = torch.tensor(b_ih.copy())
                getattr(rnn, f"bias_hh_l0{sfx}").data = torch.tensor(b_hh.copy())
        self.dense, self.output = [torch.nn.Linear(*L(n).get_weights()[0].shape) for n in ("dense_1", "output")]
        for lin, n in ((self.dense, "dense_1"), (self.output, "output")):
            w, b = L(n).get_weights()
            lin.weight.data, lin.bias.data = torch.tensor(w.T.copy()), torch.tensor(b)

    def forward(self, ids):
        h, _ = self.gru(self.lstm(self.emb(ids))[0])
        x = torch.cat([h.mean(1), h.amax(1)], 1)
        return torch.sigmoid(self.output(torch.relu(self.dense(x))))


def export_lstm():
    km = app.lstm_model
    for n in ("bilstm", "bigru"):
        f = km.get_layer(n).forward_layer
        assert f.activation.__name__ == "tanh" and f.recurrent_activation.__name__ == "sigmoid", n
    assert km.get_layer("dense_1").activation.__name__ == "relu"
    assert not km.get_layer("random_embedding").mask_zero
    tm = TorchLSTM(km).eval()
    ids = np.random.randint(0, 41018, (3, 200))
    want = km.predict_on_batch(ids)
    got = tm(torch.tensor(ids)).detach().numpy()
    print("lstm torch vs keras max diff:", np.abs(want - got).max())
    torch.onnx.export(tm, (torch.tensor(ids[:1]),), out("lstm.onnx"), input_names=["ids"], output_names=["probs"],
                      dynamic_axes={"ids": {0: "b"}}, dynamo=False)
    tok = app.lstm_tok
    json.dump({
        "word_index": {w: i for w, i in tok.word_index.items() if i < tok.num_words},
        "num_words": tok.num_words, "oov": tok.word_index[tok.oov_token], "filters": tok.filters,
        "max_len": app.lstm_cfg["MAX_LEN"],
    }, open(out("lstm.json"), "w"), ensure_ascii=False)
    # WordNet noun lemmas + noun exceptions, for the nltk lemmatizer port.
    from nltk.corpus import wordnet as wn
    wn.ensure_loaded()
    json.dump({
        "nouns": sorted(f for f, p in wn._lemma_pos_offset_map.items() if "n" in p),
        "exc": wn._exception_map["n"],
    }, open(out("wordnet.json"), "w"), ensure_ascii=False)


# ── Transformers: ONNX, 8-bit weights, tokenizer files copied ────────────
# Plain quantize_dynamic also quantizes activations and drifted up to 0.42 on
# DistilBERT. Weight-only 8-bit MatMuls + per-row int8 embeddings stay within
# ~0.016 of PyTorch at about a quarter of the size.
def int8_embeddings(m):
    inits = {i.name: i for i in m.graph.initializer}
    for node in list(m.graph.node):
        t = inits.get(node.input[0]) if node.input else None
        if node.op_type != "Gather" or t is None or t.data_type != TensorProto.FLOAT:
            continue
        arr = numpy_helper.to_array(t)
        if arr.size < 1_000_000:  # only the big vocab tables
            continue
        scale = np.abs(arr).max(1, keepdims=True) / 127
        t.CopyFrom(numpy_helper.from_array(np.round(arr / scale).astype(np.int8), t.name))
        m.graph.initializer.append(numpy_helper.from_array(scale.astype(np.float32), t.name + "_scale"))
        out_name, i = node.output[0], list(m.graph.node).index(node)
        node.output[0] = out_name + "_q"
        m.graph.node.insert(i + 1, helper.make_node("Gather", [t.name + "_scale", node.input[1]], [out_name + "_s"]))
        m.graph.node.insert(i + 2, helper.make_node("Cast", [out_name + "_q"], [out_name + "_f"], to=TensorProto.FLOAT))
        m.graph.node.insert(i + 3, helper.make_node("Mul", [out_name + "_f", out_name + "_s"], [out_name]))
    return m


def export_transformer(name, tok, model):

    class Wrap(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.m = model

        def forward(self, input_ids, attention_mask):
            return torch.sigmoid(self.m(input_ids=input_ids, attention_mask=attention_mask).logits)

    enc = tok("export me", return_tensors="pt")
    fp32 = out(f"{name}.fp32.onnx")
    torch.onnx.export(Wrap().eval(), (enc["input_ids"], enc["attention_mask"]), fp32,
                      input_names=["input_ids", "attention_mask"], output_names=["probs"],
                      dynamic_axes={k: {0: "b", 1: "t"} for k in ("input_ids", "attention_mask")},
                      opset_version=17, dynamo=False)
    q = MatMulNBitsQuantizer(onnx.load(fp32), bits=8, block_size=128, is_symmetric=True, accuracy_level=0)
    q.process()
    onnx.save(int8_embeddings(q.model.model), out(f"{name}.onnx"))
    os.remove(fp32)
    tok.save_pretrained(out(f"{name}_tok"))
    for f in ("tokenizer.json", "tokenizer_config.json"):
        shutil.copy(out(f"{name}_tok/{f}"), out(f"{name}.{f}"))
    shutil.rmtree(out(f"{name}_tok"))


# Python scores for tricky inputs; check_web.ts compares the browser code to these.
REFERENCE_TEXTS = [
    "This is not bad at all, and you're definitely not an idiot.",
    "I know where you live and I am going to hurt you.",
    "Wow, what a genius idea. Truly the smartest person alive.",
    "Thanks for the thoughtful edit, this reads much better now!",
    "You are a stupid f***ing moron, go die in a fire!!!",
    "Check https://example.com/page?x=1 — it's the women's churches' wolves; café naïve 123 items_x",
    "I HATE all those people, they should be wiped out.",
    "wikipedia_article boxes   foxes geese ... ??? !!!",
    "a",
    "Ünïcödé ﬁne ½ résumé — “quotes” ’apostrophes’ won't can't I'd",
    "the " * 300 + "idiot",
]


if __name__ == "__main__":
    export_tfidf()
    export_lstm()
    export_transformer("distilbert", *app.DISTILBERT)
    export_transformer("roberta", *app.ROBERTA)
    files = {f: os.path.getsize(out(f)) for f in sorted(os.listdir(OUT)) if f not in ("manifest.json", "reference.json")}
    json.dump({"files": files}, open(out("manifest.json"), "w"), indent=1)
    json.dump({t: {m: [float(x) for x in f(t)] for m, f in app.MODELS.items()} for t in REFERENCE_TEXTS},
              open(out("reference.json"), "w"), indent=1, ensure_ascii=False)
    for f, n in files.items():
        print(f"{n / 1e6:8.1f} MB  {f}")
    print(f"{sum(files.values()) / 1e6:8.1f} MB  total")
