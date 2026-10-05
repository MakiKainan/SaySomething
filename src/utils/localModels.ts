// All four models run in the visitor's browser. Files come from the public HF
// repo below (built by space/export_web.py), are kept in the Cache API, and
// every preprocessing step here mirrors space/app.py — change one, change both.
import { Tokenizer } from "@huggingface/tokenizers";
import { LABELS, type Scores } from "./models";

const BASE = "https://huggingface.co/phuuun/saysomething-web/resolve/main/";
const CACHE = "saysomething-models";
const MAX_TEXT = 2000;

type Get = (file: string) => Promise<Response>;
type Model = (text: string) => Promise<number[]>;

// ── Download / cache / delete ─────────────────────────────────────────────
export type Manifest = { files: Record<string, number> };
export const totalBytes = (m: Manifest) => Object.values(m.files).reduce((a, b) => a + b, 0);

export async function getManifest(): Promise<Manifest> {
  const cached = await (await caches.open(CACHE)).match(BASE + "manifest.json");
  return (cached ?? (await fetch(BASE + "manifest.json"))).json();
}

export async function isDownloaded(m: Manifest) {
  const cache = await caches.open(CACHE);
  const hits = await Promise.all(Object.keys(m.files).map((f) => cache.match(BASE + f)));
  return hits.every(Boolean);
}

// One download at a time, shared module-wide, so it keeps going (and a remounted
// page can re-attach to it) when the visitor navigates away mid-download.
let inFlight: Promise<void> | null = null;
let done = 0;
const watchers = new Set<(bytes: number) => void>();
export const isDownloading = () => inFlight !== null;

export function download(m: Manifest, onProgress: (bytes: number) => void) {
  watchers.add(onProgress);
  onProgress(done);
  inFlight ??= fetchAll(m).finally(() => {
    inFlight = null;
    done = 0;
    watchers.clear();
  });
  return inFlight;
}

async function fetchAll(m: Manifest) {
  const cache = await caches.open(CACHE);
  // Bytes per file (not a running sum), so nothing can be counted twice.
  const got: Record<string, number> = {};
  const progress = (f: string, bytes: number) => {
    got[f] = bytes;
    done = Object.values(got).reduce((a, b) => a + b, 0);
    watchers.forEach((w) => w(done));
  };
  const abort = new AbortController(); // one file fails → stop the rest, so a retry starts clean
  try {
    await Promise.all(
      Object.keys(m.files).map(async (f) => {
        if (await cache.match(BASE + f)) return progress(f, m.files[f]);
        const res = await fetch(BASE + f, { signal: abort.signal });
        if (!res.ok || !res.body) throw new Error(`Download failed for ${f} (${res.status})`);
        const chunks: Uint8Array[] = [];
        let n = 0;
        const reader = res.body.getReader();
        for (let r; !(r = await reader.read()).done; ) {
          chunks.push(r.value);
          progress(f, (n += r.value.length));
        }
        // Never cache a cut-off file: it would look downloaded but fail to load.
        if (n !== m.files[f]) throw new Error(`${f} arrived incomplete (${n} of ${m.files[f]} bytes). Try again.`);
        await cache.put(BASE + f, new Response(new Blob(chunks)));
      }),
    );
  } catch (e) {
    abort.abort();
    throw e;
  }
  // Written last, so a half-finished download never looks complete.
  await cache.put(BASE + "manifest.json", new Response(JSON.stringify(m)));
}

export async function deleteModels() {
  loaded.clear();
  await caches.delete(CACHE);
}

const fromCache: Get = async (f) => {
  const res = await (await caches.open(CACHE)).match(BASE + f);
  if (!res) throw new Error("Models aren't downloaded yet");
  return res;
};

// ── Shared helpers ────────────────────────────────────────────────────────
const URL_RE = /https?:\/\/\S+|www\.\S+/g;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
// The ONNX runtime (~1 MB JS + ~12 MB wasm) loads only once a model is used.
async function session(get: Get, f: string) {
  const ort = await import("onnxruntime-web/wasm");
  const s = await ort.InferenceSession.create(new Uint8Array(await (await get(f)).arrayBuffer()));
  return async (feeds: Record<string, number[]>) => {
    const tensors = Object.fromEntries(
      Object.entries(feeds).map(([k, ids]) => [k, new ort.Tensor("int64", BigInt64Array.from(ids, BigInt), [1, ids.length])]),
    );
    return Array.from((await s.run(tensors)).probs.data as Float32Array);
  };
}

// ── TF-IDF + LogReg ───────────────────────────────────────────────────────
// sklearn TfidfVectorizer: word 1-2 grams + char_wb 2-6 grams, sublinear tf, l2 per vectorizer.
const stripAccents = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "");

function wordNgrams(doc: string) {
  const toks = doc.match(/[\p{L}\p{N}_]+/gu) ?? [];
  return [...toks, ...toks.slice(1).map((t, i) => `${toks[i]} ${t}`)];
}

function charWbNgrams(doc: string) {
  const out: string[] = [];
  for (const word of doc.split(/\s+/).filter(Boolean)) {
    const w = Array.from(` ${word} `);
    for (let n = 2; n <= 6; n++) {
      let off = 0;
      out.push(w.slice(0, n).join(""));
      while (off + n < w.length) out.push(w.slice(++off, off + n).join(""));
      if (off === 0) break; // a word shorter than n is counted once
    }
  }
  return out;
}

async function loadTfidf(get: Get): Promise<Model> {
  const meta = await (await get("tfidf.json")).json();
  const table = new Float32Array(await (await get("tfidf.bin")).arrayBuffer()); // rows of [idf, 6 coefs]
  const index = (terms: string[], offset: number) => new Map(terms.map((t, i) => [t, i + offset]));
  const vocabs = [
    { idx: index(meta.word, 0), grams: wordNgrams },
    { idx: index(meta.char, meta.n_word), grams: charWbNgrams },
  ];
  return async (text) => {
    let t = text.toLowerCase().replace(URL_RE, " url ");
    t = t.replace(/[^\p{L}\p{N}_\s!?]/gu, " ").replace(/\s+/g, " ").trim();
    const doc = stripAccents(t.toLowerCase());
    const logits = [...meta.intercepts] as number[];
    for (const { idx, grams } of vocabs) {
      const counts = new Map<number, number>();
      for (const g of grams(doc)) {
        const i = idx.get(g);
        if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1);
      }
      const w = [...counts].map(([i, c]) => [i, (1 + Math.log(c)) * table[i * 7]] as const);
      const norm = Math.sqrt(w.reduce((sum, [, v]) => sum + v * v, 0)) || 1;
      for (const [i, v] of w) for (let l = 0; l < 6; l++) logits[l] += (v / norm) * table[i * 7 + 1 + l];
    }
    return logits.map(sigmoid);
  };
}

// ── BiLSTM + BiGRU ────────────────────────────────────────────────────────
const CONTRACTIONS: [string, string][] = [
  ["won't", "will not"], ["can't", "cannot"], ["n't", " not"],
  ["'re", " are"], ["'s", " is"], ["'d", " would"],
  ["'ll", " will"], ["'ve", " have"], ["'m", " am"],
];
const NOUN_RULES: [string, string][] = [
  ["s", ""], ["ses", "s"], ["ves", "f"], ["xes", "x"], ["zes", "z"],
  ["ches", "ch"], ["shes", "sh"], ["men", "man"], ["ies", "y"],
];
const len = (s: string) => Array.from(s).length;

async function loadLstm(get: Get): Promise<Model> {
  const [cfg, wn, run] = await Promise.all([get("lstm.json").then((r) => r.json()), get("wordnet.json").then((r) => r.json()), session(get, "lstm.onnx")]);
  const nouns = new Set<string>(wn.nouns);
  const exc: Record<string, string[]> = wn.exc;
  const wordIndex = new Map<string, number>(Object.entries(cfg.word_index));
  const filters = new Set<string>(cfg.filters);
  // nltk WordNetLemmatizer().lemmatize(w): shortest WordNet noun among w and its candidate forms.
  const lemmatize = (w: string) => {
    const forms = [w, ...(Object.hasOwn(exc, w) ? exc[w] : NOUN_RULES.filter(([o]) => w.endsWith(o)).map(([o, n]) => w.slice(0, -o.length) + n))];
    const found = [...new Set(forms.filter((f) => nouns.has(f)))];
    return found.length ? found.reduce((a, b) => (len(b) < len(a) ? b : a)) : w;
  };
  return async (text) => {
    let t = text.toLowerCase();
    for (const [p, r] of CONTRACTIONS) t = t.replaceAll(p, r);
    t = t.replace(URL_RE, " url ").replace(/\p{Nd}+/gu, " num ").replace(/[^\p{L}\p{N}_\s]/gu, " ");
    t = t.replace(/\s+/g, " ").trim();
    t = t.split(" ").map(lemmatize).join(" ");
    // Keras Tokenizer.texts_to_sequences, then pad/truncate "post" to MAX_LEN.
    const words = Array.from(t.toLowerCase(), (c) => (filters.has(c) ? " " : c)).join("").split(" ").filter(Boolean);
    const ids = words.map((w) => wordIndex.get(w) ?? cfg.oov).slice(0, cfg.max_len);
    const padded = [...ids, ...Array(cfg.max_len - ids.length).fill(0)];
    return run({ ids: padded });
  };
}

// ── DistilBERT / RoBERTa ──────────────────────────────────────────────────
async function loadTransformer(get: Get, name: string): Promise<Model> {
  const [json, config, run] = await Promise.all([
    get(`${name}.tokenizer.json`).then((r) => r.json()),
    get(`${name}.tokenizer_config.json`).then((r) => r.json()),
    session(get, `${name}.onnx`),
  ]);
  const tok = new Tokenizer(json, config);
  const [cls, sep] = tok.encode("").ids; // the special tokens wrapped around every input
  return async (text) => {
    const t = text.replace(URL_RE, "[URL]").replace(/\s+/g, " ").trim();
    const ids = [cls, ...tok.encode(t, { add_special_tokens: false }).ids.slice(0, 126), sep]; // max_len 128
    return run({ input_ids: ids, attention_mask: ids.map(() => 1) });
  };
}

// ── Entry point ───────────────────────────────────────────────────────────
const LOADERS: Record<string, (get: Get) => Promise<Model>> = {
  "TF-IDF + LogReg": loadTfidf,
  LSTM: loadLstm,
  DistilBERT: (get) => loadTransformer(get, "distilbert"),
  RoBERTa: (get) => loadTransformer(get, "roberta"),
};
const loaded = new Map<string, Promise<Model>>();
let queue: Promise<unknown> = Promise.resolve(); // one model at a time: the wasm runtime is shared

export function runInference(text: string, model: string, get: Get = fromCache): Promise<Scores> {
  if (!LOADERS[model]) return Promise.reject(new Error(`Unknown model: ${model}`));
  if (!text.trim() || text.length > MAX_TEXT) return Promise.reject(new Error(`Text must be 1-${MAX_TEXT} characters`));
  const job = queue.then(async () => {
    if (!loaded.has(model))
      loaded.set(model, LOADERS[model](get).catch((e) => {
        loaded.delete(model);
        throw new Error(`Couldn't load ${model} (${(e as Error)?.message ?? e}). If it keeps failing, press Delete above and download again.`);
      }));
    const scores = await (await loaded.get(model)!)(text);
    return Object.fromEntries(LABELS.map((l, i) => [l, scores[i]])) as Scores;
  });
  queue = job.catch(() => {});
  return job;
}
