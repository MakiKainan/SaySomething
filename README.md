# SaySomething

## App Description

**SaySomething** is an NLP web application for classifying toxic comments. Built as an academic NLP project, it lets users run live inference across four different model architectures — from a classical TF-IDF baseline to a fine-tuned RoBERTa transformer — and compare how each model behaves on the same input text.

All four models were trained on the [Jigsaw Toxic Comment Classification dataset](https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge) and classify text across six labels: `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, and `identity_hate`.

Predictions come from the real trained models, running **in the visitor's browser**. Nothing typed is sent to a server. On first visit the inference page offers a one-time download of the four models (~240 MB, with a progress bar), stored in the browser's cache until the visitor deletes them from the same page. The browser builds live in the public Hugging Face repo [`phuuun/saysomething-web`](https://huggingface.co/phuuun/saysomething-web).

---

## Main Features

1. **Multi-Model Inference** — Classify any comment using four different models (TF-IDF + Logistic Regression, LSTM, DistilBERT, RoBERTa) and compare their predictions side by side.
2. **Six-Label Toxicity Classification** — Each prediction covers six toxicity categories: toxic, severe toxic, obscene, threat, insult, and identity hate.
3. **Model Behavior Comparison** — See how classical ML, deep learning, and transformer models handle the same input differently, including each model's known weaknesses.
4. **Model Information Pages** — Dedicated pages explaining each model's architecture, metrics and weaknesses.
5. **Interactive & Animated UI** — Smooth, responsive interface with animations built using Motion (Framer Motion).

### Model Overview

| # | Model | Type | Mean ROC-AUC | Macro F1 | Threat F1 |
|---|-------|------|--------------|----------|-----------|
| 01 | TF-IDF + Logistic Regression | Classical ML | 0.945 | 0.49 | 0.08 |
| 02 | LSTM (BiLSTM → BiGRU) | Deep Learning | 0.954 | 0.41 | 0.00 |
| 03 | DistilBERT | Transformer | 0.980 | 0.49 | 0.18 |
| 04 | RoBERTa | Transformer | 0.985 | 0.58 | 0.35 |

ROC-AUC barely separates the four. F1 shows the real gap: `threat` is only 0.29% of the data, the
LSTM never predicts it, and the per-label class weights in the transformer fine-tunes are what
lift it.

---

## Technology Used

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion)
- **Inference:** in the browser with ONNX Runtime Web (transformers and LSTM) and a TypeScript port of the TF-IDF model and every preprocessing step
- **Backend:** none. It's a static site (Vercel).
- **Routing:** React Router v7
- **Model Training:** Python, Jupyter Notebook (scikit-learn, TensorFlow/Keras, Hugging Face Transformers)

---

## How to run app

```bash
npm install
npm run dev
```

Open `http://localhost:3000/inference`, click **Download**, then analyze. To deploy, push to GitHub; Vercel builds it as a static site. No environment variables or server needed.

### Re-exporting the models (only after retraining)

The browser files are built from the original weights (private repos `phuuun/saysomething-{tfidf,lstm,distilbert,roberta}`) by [`space/export_web.py`](space/export_web.py), which reuses the loading code in [`space/app.py`](space/app.py).

1. Python environment (Python **3.12**: scikit-learn 1.6.1 has no 3.14 build):
   ```bash
   uv venv --python 3.12 space/.venv
   VIRTUAL_ENV=space/.venv uv pip install --index-strategy unsafe-best-match \
     --extra-index-url https://download.pytorch.org/whl/cpu -r space/requirements.txt onnx onnxruntime onnxscript
   space/.venv/bin/hf auth login
   ```
2. Export, check that the browser code matches Python, upload:
   ```bash
   space/.venv/bin/python space/export_web.py      # writes space/web/
   npx tsx space/check_web.ts                      # browser code vs Python scores
   space/.venv/bin/hf upload phuuun/saysomething-web space/web . --exclude reference.json
   ```

Visitors who already downloaded the old files keep them until they press **Delete** on the inference page.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Build the static site into `dist/` |
| `npm start` | Preview the production build |
| `npm run lint` | TypeScript type-check |

---

## Project Structure

```
saysomething/
├── src/
│   ├── components/       # UI components (Navbar, animations, dot field)
│   ├── pages/            # Route pages (Home, Inference, Models)
│   ├── utils/            # localModels.ts: download, cache, and run the models
│   └── lib/              # Utilities
├── space/
│   ├── app.py            # Loads the original Python models (reference implementation)
│   ├── export_web.py     # Converts them to browser files (ONNX + JSON)
│   └── check_web.ts      # Checks the browser code against the Python scores
└── my nlp models/        # Jupyter notebooks & training artifacts
```

---

## Team

| Name | Student ID | Role |
|------|-----------|------|
| Fiko Alexie Van Houten | 2802520274 | Model development & debugging |
| Richtjhie Hartawan Agusta | 2802529102 | Documentation & theory |
| Kevin Sukias Kartanegara | 2802526416 | Workflow architecture & project vision |
