# SaySomething

## App Description

**SaySomething** is an NLP web application for classifying toxic comments. Built as an academic NLP project, it lets users run live inference across four different model architectures — from a classical TF-IDF baseline to a fine-tuned RoBERTa transformer — and compare how each model behaves on the same input text.

All four models were trained on the [Jigsaw Toxic Comment Classification dataset](https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge) and classify text across six labels: `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, and `identity_hate`.

In this repository, the inference layer is powered by the **Google Gemini API**, which acts as a simulation layer that reproduces each trained model's real-world behavior and known characteristics (e.g., the LSTM's class-imbalance tendency, TF-IDF's context-blindness) based on the evaluation results from our training notebooks. This allows the app to be deployed and demoed without hosting four separate model servers.

> **Note:** A separate version of this project runs local/real model inference. This repository is the lightweight Gemini-powered demo build.

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
- **AI / Inference:** Google Gemini 2.5 Flash (`@google/genai`)
- **Routing:** React Router v7
- **Model Training:** Python, Jupyter Notebook (scikit-learn, TensorFlow/Keras, Hugging Face Transformers)

---

## How to run app

**Prerequisites:** Node.js 18+

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/saysomething.git
   cd saysomething
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

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
├── server.ts             # Express backend + Gemini inference API
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
