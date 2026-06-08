// server.ts
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/inference", async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text || !model) {
      return res.status(400).json({ error: "Text and model parameters are required" });
    }
    let systemInstruction = "";
    if (model === "TF-IDF + LogReg") {
      systemInstruction = `
You are simulating the predictions of a "TF-IDF + Logistic Regression" text classification model trained on the Jigsaw Toxic Comment dataset.
This model is a classical bag-of-words model, which means it is COMPLETELY CONTEXT-BLIND.
- It operates by counting the frequency of individual words or character n-grams.
- It is completely blind to sentence structure, negations, context, and sarcasm.
- If a toxic keyword (e.g., "bad", "stupid", "idiot", "hate", "kill", "obscene", "threat") exists in the text, it MUST classify the comment as toxic, even if the text negates it or uses it in a harmless context.
- For example, if the user input is "this is not bad at all" or "you are not an idiot", this model WILL output high toxicity and insult scores (e.g., 0.6 - 0.9) because it sees the words "bad" or "idiot" and cannot process the negation "not".
- Sarcasm is completely undetected.

Your task: Given the input text, simulate how a context-blind TF-IDF bag-of-words model would score it. Return values between 0.0 and 1.0 for each of the six Jigsaw toxicity labels.
`;
    } else if (model === "LSTM") {
      systemInstruction = `
You are simulating the predictions of a "Stacked BiLSTM + BiGRU" neural network trained on the Jigsaw Toxic Comment dataset.
This model is a recurrent neural network. It processes sequences, meaning it CAN understand negations and simple context (e.g., it knows "not bad" is clean, unlike the TF-IDF model).
However, due to a severe CLASS IMBALANCE in its training dataset (very few examples of "threat" and "identity_hate"), this model suffered a major bug:
- The network got lazy and learned to output exactly 0.0 for "threat" and "identity_hate" EVERY SINGLE TIME, regardless of the input.
- Even if the input text contains a blatant, direct threat (e.g., "I am going to kill you tomorrow"), the scores for "threat" and "identity_hate" MUST be exactly 0.0.
- For other categories ("toxic", "severe_toxic", "obscene", "insult"), it will return normal, moderately accurate sequential predictions.

Your task: Given the input text, simulate how this class-imbalanced LSTM model would score it.
CRITICAL: You MUST output exactly 0.0 for the "threat" and "identity_hate" categories, even for extreme threats. Predict other categories with moderate sequential accuracy.
`;
    } else if (model === "DistilBERT") {
      systemInstruction = `
You are simulating the predictions of a "Fine-tuned DistilBERT" transformer model trained on the Jigsaw Toxic Comment dataset.
This is a modern transformer model with multi-head self-attention.
- It has high accuracy (95.8% Mean ROC-AUC).
- It understands context, negations, sarcasm, and sentence structure very well.
- It uses a weighted loss function to handle class imbalance, meaning it CAN successfully detect minority classes like "threat" and "identity_hate", though it might still have occasional minor false negatives/positives.
- It outputs highly accurate, realistic probability scores between 0.0 and 1.0 for all six categories.

Your task: Evaluate the input text and return the probability scores for the six toxicity categories. Be accurate and context-aware.
`;
    } else if (model === "RoBERTa") {
      systemInstruction = `
You are simulating the predictions of a "Fine-tuned RoBERTa" transformer model trained on the Jigsaw Toxic Comment dataset.
This is the State-of-the-Art (SOTA) model in our pipeline (97.1% accuracy).
- It is trained on 10x more data with dynamic masking, making it extremely robust.
- It is exceptionally good at handling complex, nested, adversarial, or highly sarcastic comments.
- It yields the most precise, confident, and reliable predictions of all models.
- It has the highest F1-score for minority classes like "threat" and "identity_hate".

Your task: Evaluate the input text and return the probability scores for the six toxicity categories. Be extremely precise, context-aware, and robust.
`;
    } else {
      systemInstruction = `Evaluate the input text and classify its toxicity across six Jigsaw categories.`;
    }
    const responseSchema = {
      type: "object",
      properties: {
        toxic: { type: "number" },
        severe_toxic: { type: "number" },
        obscene: { type: "number" },
        threat: { type: "number" },
        insult: { type: "number" },
        identity_hate: { type: "number" }
      },
      required: ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
    };
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following comment: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1
      }
    });
    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }
    const scores = JSON.parse(resultText);
    res.json(scores);
  } catch (err) {
    console.error("Inference error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
var isProd = process.env.NODE_ENV === "production" || __dirname.includes("dist");
if (isProd) {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(viteServer.middlewares);
}
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
