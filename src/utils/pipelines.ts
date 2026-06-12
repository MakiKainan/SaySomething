// Pipeline walkthrough content for the "Enlighten Me" modal on the Models page.
// Config-driven so the modal stays generic. Keyed by the model `id` used in
// pages/ModelsPage.tsx ("01".."04"). Step content is sourced from
// nlp_cooking_recipes.md (technical, with light culinary flavor).
//
// Each step's `media` points at a bespoke animated visual rendered by
// `components/StepMedia.tsx`. The `"component"` type looks up `key` in the
// `pipelineVisuals` registry (components/pipeline-visuals/). Raster formats
// (gif/video) and the placeholder fallback are still supported for flexibility.

export type StepMedia = {
  type: "gif" | "video" | "lottie" | "component" | "placeholder";
  src?: string;
  alt?: string;
  /** Registry key in components/pipeline-visuals when type === "component". */
  key?: string;
};

export type PipelineStep = {
  title: string;
  body: string;
  media: StepMedia;
};

export type ModelPipeline = {
  steps: PipelineStep[];
};

const visual = (key: string): StepMedia => ({ type: "component", key });

export const modelPipelines: Record<string, ModelPipeline> = {
  // ─── 01 · TF-IDF + Logistic Regression ──────────────────────────────────
  "01": {
    steps: [
      {
        title: "Chop the text (Tokenization)",
        body: "The raw comment is sliced into pieces. Word n-grams capture short phrases like \"you\" and \"you idiot\", while character n-grams catch fragments like \"idi\" and \"dio\". The model never sees a sentence — only a bag of these chopped tokens.",
        media: visual("tfidf-tokenize"),
      },
      {
        title: "Weigh the dressing (TF-IDF)",
        body: "Each token gets a weight by how rare and distinctive it is. Filler words that appear everywhere — \"the\", \"is\", \"a\" — are watered down toward zero. Rare, sharp tokens like \"f*ck\" carry heavy weight, while a bland fragment like \"ing\" stays dim.",
        media: visual("tfidf-weight"),
      },
      {
        title: "Six tasters (Logistic Regression)",
        body: "The weighted token vector is handed to six independent classifiers — one per label (toxic, severe_toxic, obscene, threat, insult, identity_hate). Each taster counts the bad ingredients it cares about and outputs a probability from 0 to 1.",
        media: visual("tfidf-classify"),
      },
      {
        title: "The blind spot (Context-blind)",
        body: "Because the salad was tossed, word order is gone. \"not bad at all\" and \"bad, not at all\" look identical, so negation and sarcasm slip right past. Fast and explainable — but it reacts to keywords, not meaning.",
        media: visual("tfidf-blindspot"),
      },
    ],
  },

  // ─── 02 · Stacked BiLSTM + BiGRU ────────────────────────────────────────
  "02": {
    steps: [
      {
        title: "Trim & prep (Clean + Lemmatize)",
        body: "Text is cleaned and contractions expanded (\"don't\" → \"do not\"), then words are reduced to their dictionary root (\"running\", \"ran\" → \"run\"). Crucially, stopwords like \"no\" and \"not\" are kept — they flip the meaning of a sequence.",
        media: visual("lstm-lemmatize"),
      },
      {
        title: "Fixed-size pot (Padding)",
        body: "Words are mapped to integers and every comment is forced to exactly 200 tokens. Shorter comments are padded with zeros (empty water); longer ones are truncated. A uniform sequence the network can stir consistently.",
        media: visual("lstm-padding"),
      },
      {
        title: "Stir both ways (BiLSTM → BiGRU → Pooling)",
        body: "An embedding layer turns each word ID into a 128-dim flavor vector. A Bidirectional LSTM reads the text forward and backward to capture context, a BiGRU refines it, then global Max + Average pooling grabs both the sharpest spike and the overall tone before the 6-label sigmoid.",
        media: visual("lstm-stir"),
      },
      {
        title: "Risotto disaster (Class imbalance)",
        body: "Threats are only ~0.29% of the data, so the network got lazy and learned to output 0.00 for \"threat\" and \"identity_hate\" every single time — an F1 of 0.00 on those minority classes, even for blatant threats.",
        media: visual("lstm-imbalance"),
      },
    ],
  },

  // ─── 03 · Fine-tuned DistilBERT ─────────────────────────────────────────
  "03": {
    steps: [
      {
        title: "Minimal handling (WordPiece)",
        body: "Transformers expect natural language, so we skip stopword removal and lemmatization. URLs and spacing are cleaned, then the DistilBERT WordPiece tokenizer splits text while preserving sentence structure.",
        media: visual("bert-wordpiece"),
      },
      {
        title: "Many critics at once (Self-Attention)",
        body: "Multi-head self-attention acts like 12 specialized critics tasting different word pairs simultaneously — instantly linking a toxic word at the start of a sentence to a pronoun at the very end. Context, negation, and sarcasm are understood.",
        media: visual("bert-attention"),
      },
      {
        title: "Differential heat (Learning rates)",
        body: "To avoid scorching the pretrained broth, the DistilBERT backbone simmers at a low learning rate (2e-5) while the fresh classification head is seared hot (2e-4) so it adapts quickly to toxic-comment patterns.",
        media: visual("bert-heat"),
      },
      {
        title: "Extra salt for rare dishes (Weighted loss)",
        body: "A weighted loss penalizes missing a rare contaminant like \"threat\" or \"identity_hate\" up to 368× more than a common one. This rescues the minority classes the LSTM dropped — threat F1 recovers from 0.00 to 0.18.",
        media: visual("bert-weightedloss"),
      },
    ],
  },

  // ─── 04 · Fine-tuned RoBERTa ────────────────────────────────────────────
  "04": {
    steps: [
      {
        title: "Large pantry (160GB pretraining)",
        body: "RoBERTa is pretrained on a massive 160GB corpus — 10× more than BERT's 16GB. Before any fine-tuning, it already carries a far richer vocabulary and deeper semantic intuition.",
        media: visual("roberta-pantry"),
      },
      {
        title: "Dynamic prep (Dynamic masking)",
        body: "Unlike BERT, which masks the same words every epoch, RoBERTa changes its masking pattern dynamically across training steps. It can't memorize fixed patterns, so it's forced to learn genuine context.",
        media: visual("roberta-masking"),
      },
      {
        title: "No NSP strainer",
        body: "RoBERTa drops BERT's Next-Sentence-Prediction task entirely and focuses purely on sequence classification — a cleaner pretraining signal and no need for token_type_ids, simplifying the input.",
        media: visual("roberta-nonsp"),
      },
      {
        title: "Heavy simmer (Fine-tuning → SOTA)",
        body: "With 125M parameters, it's cooked in smaller batches of 16 with differential learning rates (backbone 2e-5, head 2e-4). The result is the pipeline's state-of-the-art: 0.9848 Mean ROC-AUC and the best minority-class recall (threat F1 up to 0.3529).",
        media: visual("roberta-simmer"),
      },
    ],
  },
};
