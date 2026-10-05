// Parity check: the browser code (src/utils/localModels.ts) vs the Python
// models, on the files in space/web/. Run after export_web.py:
//   npx tsx space/check_web.ts
import { readFile } from "fs/promises";
import { createRequire } from "module";
const { env } = await import("onnxruntime-web/wasm"); // same instance localModels.ts loads
import { runInference } from "../src/utils/localModels";
import { LABELS } from "../src/utils/models";

// The browser build fetch()es its wasm, which Node can't do from disk; hand it over.
env.wasm.numThreads = 1;
env.wasm.wasmBinary = await readFile(createRequire(import.meta.url).resolve("onnxruntime-web/ort-wasm-simd-threaded.wasm"));

const dir = new URL("./web/", import.meta.url);
const get = async (f: string) => new Response(await readFile(new URL(f, dir)));
const reference: Record<string, Record<string, number[]>> = JSON.parse(await readFile(new URL("reference.json", dir), "utf8"));
// Weight quantization moves the transformers a little; the rest should match exactly.
const TOLERANCE: Record<string, number> = { "TF-IDF + LogReg": 1e-4, LSTM: 1e-4, DistilBERT: 0.03, RoBERTa: 0.03 };

let failed = 0;
const worst: Record<string, number> = {};
for (const [text, models] of Object.entries(reference)) {
  for (const [model, want] of Object.entries(models)) {
    const got = await runInference(text, model, get);
    const diff = Math.max(...LABELS.map((l, i) => Math.abs(got[l] - want[i])));
    worst[model] = Math.max(worst[model] ?? 0, diff);
    if (!(diff <= TOLERANCE[model])) {
      failed++;
      console.log(`FAIL ${model} diff=${diff.toFixed(4)} on ${JSON.stringify(text.slice(0, 60))}`);
    }
  }
}
console.log("worst diff per model:", worst);
console.log(failed ? `${failed} mismatches` : "all models match Python");
process.exit(failed ? 1 : 0);
