---
title: SaySomething API
sdk: gradio
sdk_version: 6.28.0
python_version: "3.12"
app_file: app.py
---

Inference API for the four SaySomething toxicity models.
Needs an `HF_TOKEN` secret (read access to the private `phuuun/saysomething-*` model repos).

Gradio API endpoint `predict(text, model)`, where model is `"TF-IDF + LogReg"`, `"LSTM"`, `"DistilBERT"` or `"RoBERTa"`. Returns the six label scores.
Runs on ZeroGPU hardware, but all four models run on CPU.
