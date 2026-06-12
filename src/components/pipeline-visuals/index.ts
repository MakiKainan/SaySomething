import type { ComponentType } from "react";
import { TfidfBlindspot, TfidfClassify, TfidfTokenize, TfidfWeight } from "./Model01";
import { LstmImbalance, LstmLemmatize, LstmPadding, LstmStir } from "./Model02";
import { BertAttention, BertHeat, BertWeightedLoss, BertWordpiece } from "./Model03";
import { RobertaMasking, RobertaNoNsp, RobertaPantry, RobertaSimmer } from "./Model04";

/**
 * Registry of animated pipeline-step visuals, keyed by the string referenced in
 * `utils/pipelines.ts` (`media: { type: "component", key }`). Keeping the lookup
 * here means `pipelines.ts` stays pure data with no React imports.
 */
export const pipelineVisuals: Record<string, ComponentType> = {
  // 01 · TF-IDF + Logistic Regression
  "tfidf-tokenize": TfidfTokenize,
  "tfidf-weight": TfidfWeight,
  "tfidf-classify": TfidfClassify,
  "tfidf-blindspot": TfidfBlindspot,
  // 02 · Stacked BiLSTM + BiGRU
  "lstm-lemmatize": LstmLemmatize,
  "lstm-padding": LstmPadding,
  "lstm-stir": LstmStir,
  "lstm-imbalance": LstmImbalance,
  // 03 · Fine-tuned DistilBERT
  "bert-wordpiece": BertWordpiece,
  "bert-attention": BertAttention,
  "bert-heat": BertHeat,
  "bert-weightedloss": BertWeightedLoss,
  // 04 · Fine-tuned RoBERTa
  "roberta-pantry": RobertaPantry,
  "roberta-masking": RobertaMasking,
  "roberta-nonsp": RobertaNoNsp,
  "roberta-simmer": RobertaSimmer,
};
