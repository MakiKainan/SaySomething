// Single source of truth for model + dataset facts shown across the site.
// Metrics come from the training notebooks (see my nlp models/nlp_cooking_recipes.md).

export type ModelInfo = {
  id: string;
  /** Name the /api/inference endpoint expects. */
  key: string;
  name: string;
  type: string;
  rocAuc: number;
  f1: number;
  threatF1: number;
  latency: string;
  simple: string;
  tech: string;
};

export const MODELS: ModelInfo[] = [
  {
    id: "01",
    key: "TF-IDF + LogReg",
    name: "TF-IDF + Logistic Regression",
    type: "Classical ML",
    rocAuc: 0.9449,
    f1: 0.4877,
    threatF1: 0.0806,
    latency: "~2ms",
    simple:
      "Counts which words show up, like a spam filter. Super fast and easy to explain, but it doesn't understand word order, so \"not bad\" looks just like \"bad\".",
    tech:
      "Word 1–2-grams + char_wb 2–6-grams (100k TF-IDF features each, tf·log N/df) into six class-balanced logistic regressions. Linear and interpretable via its coefficients, but bag-of-words: blind to order, negation and sarcasm.",
  },
  {
    id: "02",
    key: "LSTM",
    name: "BiLSTM + BiGRU",
    type: "Deep Learning",
    rocAuc: 0.9538,
    f1: 0.4097,
    threatF1: 0,
    latency: "~15ms",
    simple:
      "Reads the sentence word by word, forwards and backwards, remembering what came before. It gets negation, but it saw so few threats in training that it never learned to spot them.",
    tech:
      "128-d embeddings → BiLSTM → BiGRU → max+avg pooling → 6 sigmoids, BCE on 200-token sequences with one global class weight shared by all labels. Learns order and negation, but that weight is far too small for threat (0.29%), so it collapses to 0 (threat F1 = 0.00).",
  },
  {
    id: "03",
    key: "DistilBERT",
    name: "DistilBERT",
    type: "Transformer",
    rocAuc: 0.9796,
    f1: 0.4896,
    threatF1: 0.1818,
    latency: "~32ms",
    simple:
      "A smaller, faster copy of Google's BERT that already read a huge amount of English. It looks at every word in relation to every other word at the same time, so it understands context.",
    tech:
      "6-layer distilled BERT (66M params), WordPiece tokens, multi-head self-attention. Fine-tuned with differential LRs (2e-5 backbone, 2e-4 head) and pos_weight-weighted BCE, which recovers the minority classes.",
  },
  {
    id: "04",
    key: "RoBERTa",
    name: "RoBERTa",
    type: "Transformer",
    rocAuc: 0.9848,
    f1: 0.5818,
    threatF1: 0.3529,
    latency: "~65ms",
    simple:
      "BERT's big sibling, trained on ten times more text. The slowest of the four but the best at tricky comments, and the best at catching rare ones like threats.",
    tech:
      "125M-param BERT variant pretrained on 160GB with dynamic masking and no NSP objective, byte-level BPE. Same weighted-BCE fine-tune as DistilBERT; best mean ROC-AUC (0.9848) and threat F1 (0.35).",
  },
];

export const LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"] as const;
export type Label = (typeof LABELS)[number];
export type Scores = Record<string, number>;

export const pretty = (l: string) => l.replace(/_/g, " ");

// Share of the 16,000-comment training set carrying each label (train.csv).
export const LABEL_INFO: Record<Label, { simple: string; tech: string; rate: number; count: number }> = {
  toxic: { rate: 9.58, count: 1533, simple: "Rude, disrespectful or unreasonable.", tech: "Umbrella label; most other labels co-occur with it." },
  severe_toxic: { rate: 0.99, count: 159, simple: "Extremely hateful or aggressive.", tech: "Near-subset of toxic; ~100:1 negatives per positive." },
  obscene: { rate: 5.29, count: 847, simple: "Swearing and vulgar language.", tech: "Strongly lexical, so even TF-IDF does well here." },
  threat: { rate: 0.29, count: 46, simple: "Wants to hurt someone.", tech: "Rarest label: 46 positives, pos_weight ≈ 347." },
  insult: { rate: 4.93, count: 789, simple: "Name-calling or personal attacks.", tech: "Highly correlated with obscene (shared vocabulary)." },
  identity_hate: { rate: 0.89, count: 142, simple: "Attacks a group: race, religion, gender…", tech: "Rare and context-heavy; identity terms alone aren't hate." },
};

// A real random sample of 1,000 comments from train.csv, stored sparsely as
// "position:bitmask" for the 102 that carry at least one label. Bit order = LABELS.
const HITS =
  "40:1,47:7,62:5,84:21,90:17,91:1,92:1,101:21,107:7,115:3,139:53,141:21,148:17,154:1,158:1,164:1,169:21,177:21,186:21,216:1,236:5,248:21,252:1,276:1,296:20,314:53,323:1,343:1,347:1,357:55,366:17,378:21,382:21,389:21,390:5,391:1,414:53,426:8,428:1,431:21,437:5,447:21,448:1,453:5,482:1,485:23,517:1,523:1,526:1,547:17,553:21,565:21,574:7,576:17,581:29,594:17,601:21,614:1,628:1,633:53,637:23,643:1,653:23,654:21,665:1,678:16,680:31,686:1,689:5,702:1,711:1,712:1,722:1,737:21,740:1,757:1,769:23,787:1,806:1,815:21,837:5,843:1,854:21,856:23,859:1,865:4,867:53,878:20,885:33,898:21,901:1,903:33,909:5,911:21,918:1,922:20,924:21,943:5,949:16,956:21,965:1,967:53";

export const SAMPLE: number[] = (() => {
  const masks = new Array(1000).fill(0);
  for (const pair of HITS.split(",")) {
    const [pos, mask] = pair.split(":").map(Number);
    masks[pos] = mask;
  }
  return masks;
})();

/** Verdict = the strongest of the six labels. */
export function peak(scores: Scores): [string, number] {
  return LABELS.map((l) => [l, scores[l] ?? 0] as [string, number]).reduce((a, b) => (b[1] > a[1] ? b : a));
}
