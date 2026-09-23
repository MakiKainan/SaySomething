# Real inference for all four SaySomething models. Preprocessing mirrors the
# training notebooks in "my nlp models/" — change one, change the other.
import spaces  # must be imported before torch on ZeroGPU

import json
import os
import re

import gradio as gr
import joblib
import keras
import nltk
import torch
from huggingface_hub import hf_hub_download, snapshot_download
from nltk.stem import WordNetLemmatizer
from scipy.sparse import hstack
from transformers import AutoConfig, AutoModelForSequenceClassification, AutoTokenizer

LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
TOKEN = os.environ.get("HF_TOKEN")


def get(repo, filename):
    return hf_hub_download(f"phuuun/saysomething-{repo}", filename, token=TOKEN)


# ── TF-IDF + LogReg ───────────────────────────────────────────────────────
word_vec = joblib.load(get("tfidf", "tfidf_word_vectorizer.joblib"))
char_vec = joblib.load(get("tfidf", "tfidf_char_vectorizer.joblib"))
logregs = joblib.load(get("tfidf", "tfidf_logreg_models.joblib"))  # {label: LogisticRegression}


def tfidf(text):
    t = str(text).lower()
    t = re.sub(r"https?://\S+|www\.\S+", " url ", t)
    t = re.sub(r"[^\w\s!?]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    x = hstack([word_vec.transform([t]), char_vec.transform([t])]).tocsr()
    return [logregs[l].predict_proba(x)[0, 1] for l in LABELS]


# ── BiLSTM + BiGRU ────────────────────────────────────────────────────────
lstm_cfg = json.load(open(get("lstm", "lstm_config.json")))
lstm_model = keras.models.load_model(get("lstm", "lstm_model.h5"), compile=False)
lstm_tok = joblib.load(get("lstm", "lstm_tokenizer.joblib"))
nltk.download("wordnet", quiet=True)
lemmatizer = WordNetLemmatizer()
CONTRACTIONS = {
    "won't": "will not", "can't": "cannot", "n't": " not",
    "'re": " are", "'s": " is", "'d": " would",
    "'ll": " will", "'ve": " have", "'m": " am",
}


def lstm(text):
    t = str(text).lower()
    for pattern, replacement in CONTRACTIONS.items():
        t = t.replace(pattern, replacement)
    t = re.sub(r"https?://\S+|www\.\S+", " url ", t)
    t = re.sub(r"\d+", " num ", t)
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = " ".join(lemmatizer.lemmatize(w) for w in t.split())
    seq = lstm_tok.texts_to_sequences([t])
    x = keras.utils.pad_sequences(seq, maxlen=lstm_cfg["MAX_LEN"], padding="post", truncating="post")
    return lstm_model.predict_on_batch(x)[0].tolist()  # compiled graph: ~30ms vs ~2.7s eager


# ── DistilBERT / RoBERTa ──────────────────────────────────────────────────
def load_transformer(repo, base, weights):
    # snapshot_download returns the local cache dir, so this also works with HF_HUB_OFFLINE=1
    local = snapshot_download(f"phuuun/saysomething-{repo}", token=TOKEN, allow_patterns=f"{repo}_tokenizer/*")
    tok = AutoTokenizer.from_pretrained(f"{local}/{repo}_tokenizer")
    cfg = AutoConfig.from_pretrained(base, num_labels=len(LABELS), problem_type="multi_label_classification")
    model = AutoModelForSequenceClassification.from_config(cfg)
    model.load_state_dict(torch.load(get(repo, weights), map_location="cpu"))
    return tok, model.eval()


def transformer(tok, model):
    def run(text):
        t = re.sub(r"https?://\S+|www\.\S+", "[URL]", str(text))
        t = re.sub(r"\s+", " ", t).strip()
        enc = tok(t, truncation=True, max_length=128, return_tensors="pt")
        with torch.inference_mode():
            return torch.sigmoid(model(**enc).logits)[0].tolist()
    return run


MODELS = {
    "TF-IDF + LogReg": tfidf,
    "LSTM": lstm,
    "DistilBERT": transformer(*load_transformer("distilbert", "distilbert-base-uncased", "best_distilbert.pt")),
    "RoBERTa": transformer(*load_transformer("roberta", "roberta-base", "roberta_weights.pt")),
}



def predict(text, model):
    if model not in MODELS:
        raise gr.Error(f"Unknown model: {model}")
    if not text.strip() or len(text) > 2000:
        raise gr.Error("Text must be 1-2000 characters")
    return {l: float(s) for l, s in zip(LABELS, MODELS[model](text))}


# ponytail: every model runs on CPU so requests never burn the ZeroGPU daily
# quota. ZeroGPU refuses to start without a @spaces.GPU function, so this one
# exists only to pass that check. Move a model onto it if CPU gets too slow.
@spaces.GPU(duration=10)
def _gpu_stub():
    pass


gr.Interface(
    predict,
    [gr.Textbox(label="Comment"), gr.Radio(list(MODELS), value="RoBERTa", label="Model")],
    gr.JSON(label="Scores"),
    title="SaySomething",
    api_name="predict",
).launch()
