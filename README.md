# SaySomething

## App Description

**SaySomething** is an NLP web application for classifying toxic comments. Built as an academic NLP project, it lets users run live inference across four different model architectures — from a classical TF-IDF baseline to a fine-tuned RoBERTa transformer — and compare how each model behaves on the same input text.

All four models were trained on the [Jigsaw Toxic Comment Classification dataset](https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge) and classify text across six labels: `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, and `identity_hate`.

Predictions come from the real trained models, running locally. The weights live in private Hugging Face repos (`phuuun/saysomething-{tfidf,lstm,distilbert,roberta}`); a small Python model server ([`space/app.py`](space/app.py)) downloads them once, loads all four, and the Express backend forwards each request to it.

---

## Main Features

1. **Multi-Model Inference** — Classify any comment using four different models (TF-IDF + Logistic Regression, LSTM, DistilBERT, RoBERTa) and compare their predictions side by side.
2. **Six-Label Toxicity Classification** — Each prediction covers six toxicity categories: toxic, severe toxic, obscene, threat, insult, and identity hate.
3. **Model Behavior Comparison** — See how classical ML, deep learning, and transformer models handle the same input differently, including each model's known weaknesses.
4. **Model Information Pages** — Dedicated pages explaining each model's architecture, accuracy, and latency characteristics.
5. **Interactive & Animated UI** — Smooth, responsive interface with animations built using Motion (Framer Motion).

### Model Overview

| # | Model | Type | Accuracy | Latency |
|---|-------|------|----------|---------|
| 01 | TF-IDF + Logistic Regression | Classical ML | 86.4% | ~2ms |
| 02 | LSTM Network | Deep Learning | 91.2% | ~15ms |
| 03 | DistilBERT | Transformer | 94.8% | ~32ms |
| 04 | RoBERTa | SOTA Transformer | 97.1% | ~65ms |

---

## Technology Used

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion)
- **Backend:** Express, Node.js
- **Inference:** Python model server with Gradio (PyTorch, TensorFlow/Keras, scikit-learn)
- **Routing:** React Router v7
- **Model Training:** Python, Jupyter Notebook (scikit-learn, TensorFlow/Keras, Hugging Face Transformers)

---

## How to run app

The app is two processes: the **model server** (Python, port 7860) and the **web app** (Node, port 3000). Both must be running.

### Every time (already set up)

Open two terminals in the project folder.

**Terminal 1 — model server** (wait ~15s until it prints `Running on local URL: http://127.0.0.1:7860`):
```bash
HF_HUB_OFFLINE=1 space/.venv/bin/python space/app.py
```

**Terminal 2 — web app:**
```bash
npm run dev
```

Open `http://localhost:3000`. Type something on the inference page and check that all four models return scores.

No internet is needed once set up: `HF_HUB_OFFLINE=1` loads the weights from the local cache.

**Something broke?** Ctrl+C both terminals and run the two commands again.

**Booth mode:** after 60s with no input the app returns to the home page and loops `public/idle.mp4` full-screen; any touch, key or mouse move dismisses it. Change the delay with `IDLE_MS` in `src/App.tsx`. Keep the laptop plugged in with sleep and screen lock turned off.

### First-time setup (new machine)

**Prerequisites:** Node.js 18+, and [uv](https://docs.astral.sh/uv/) (or Python 3.12 — **not** 3.14: the TF-IDF model needs scikit-learn 1.6.1, which has no 3.14 build).

1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Create the Python environment (CPU-only torch keeps the download small):
   ```bash
   uv venv --python 3.12 space/.venv
   VIRTUAL_ENV=space/.venv uv pip install --index-strategy unsafe-best-match \
     --extra-index-url https://download.pytorch.org/whl/cpu -r space/requirements.txt
   ```
3. Create `.env` from the template and fill in a Hugging Face read token with access to the `phuuun/saysomething-*` repos:
   ```bash
   cp .env.example .env
   ```
4. Download the weights (~800 MB, one time only). This starts the model server online with the token; stop it with Ctrl+C once it prints `Running on local URL`:
   ```bash
   set -a; . ./.env; set +a; space/.venv/bin/python space/app.py
   ```

From then on, use the **Every time** steps above.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the full-stack dev server (Vite + Express) |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | TypeScript type-check |

---

## Project Structure

```
saysomething/
├── src/
│   ├── components/       # UI components (Navbar, animations, dot field)
│   ├── pages/            # Route pages (Home, Inference, Models)
│   ├── utils/            # Inference client logic
│   └── lib/              # Utilities
├── server.ts             # Express backend, forwards inference to the model server
├── space/app.py          # Python model server (all four models)
├── public/idle.mp4       # Booth-mode idle video
├── my nlp models/        # Jupyter notebooks & training artifacts
└── .env.example          # Environment variable template
```

---

## Team

| Name | Student ID | Role |
|------|-----------|------|
| Fiko Alexie Van Houten | 2802520274 | Model development & debugging |
| Richtjhie Hartawan Agusta | 2802529102 | Documentation & theory |
| Kevin Sukias Kartanegara | 2802526416 | Workflow architecture & project vision |
