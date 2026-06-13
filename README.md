# SaySomething

A sleek, interactive NLP web app for classifying toxic comments. Built as an academic NLP project, it lets you run live inference across four different models — from a classical TF-IDF baseline all the way to a fine-tuned RoBERTa transformer — and see how each one behaves differently on the same input text.

The inference is powered by the Google Gemini API, which faithfully simulates each model's known quirks (e.g., the LSTM's class-imbalance bug, the TF-IDF's context-blindness).

---

## Models

| # | Model | Type | Accuracy | Latency |
|---|-------|------|----------|---------|
| 01 | TF-IDF + Logistic Regression | Classical ML | 86.4% | ~2ms |
| 02 | LSTM Network | Deep Learning | 91.2% | ~15ms |
| 03 | DistilBERT | Transformer | 94.8% | ~32ms |
| 04 | RoBERTa | SOTA Transformer | 97.1% | ~65ms |

All models are trained on the [Jigsaw Toxic Comment Classification dataset](https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge) and classify across six labels: `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, `identity_hate`.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion)
- **Backend:** Express, Node.js
- **AI / Inference:** Google Gemini 2.5 Flash (`@google/genai`)
- **Routing:** React Router v7

---

## Getting Started

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

---

## Scripts

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
