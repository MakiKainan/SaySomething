import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDepth } from "../lib/depth";
import { deleteModels, download, getManifest, isDownloaded, isDownloading, totalBytes, type Manifest } from "../utils/localModels";

type Status = "checking" | "missing" | "downloading" | "ready" | "error";
const mb = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

export function useLocalModels() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [bytes, setBytes] = useState(0);
  const [error, setError] = useState("");

  const fail = (e: unknown) => {
    setError(typeof caches === "undefined" ? "This browser can't store the models here (the site needs HTTPS)." : (e as Error)?.message || "Download failed");
    setStatus("error");
  };

  useEffect(() => {
    getManifest()
      .then(async (m) => {
        setManifest(m);
        if (isDownloading()) start(m);
        else setStatus((await isDownloaded(m)) ? "ready" : "missing");
      })
      .catch(fail);
  }, []);

  const start = async (known = manifest) => {
    setStatus("downloading");
    setBytes(0);
    setError("");
    try {
      const m = known ?? (await getManifest());
      setManifest(m);
      navigator.storage?.persist?.(); // ask the browser not to evict them
      await download(m, setBytes);
      setStatus("ready");
    } catch (e) {
      fail(e);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete the downloaded models (${manifest ? mb(totalBytes(manifest)) : "about 240 MB"})? You'd have to download them again to analyze.`)) return;
    await deleteModels();
    setBytes(0);
    setStatus("missing");
  };

  return { status, manifest, bytes, error, start, remove };
}

export function ModelDownload({ models }: { models: ReturnType<typeof useLocalModels> }) {
  const { t } = useDepth();
  const { status, manifest, bytes, error, start, remove } = models;
  const total = manifest ? totalBytes(manifest) : 0;
  const size = total ? mb(total) : "about 240 MB";

  if (status === "checking") return null;

  if (status === "ready")
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55 mb-6">
        <span className="text-green-300">✓</span>
        <span>Models stored on this device · {size}</span>
        <button type="button" onClick={remove} className="underline underline-offset-4 hover:text-white cursor-pointer">
          Delete
        </button>
      </div>
    );

  const pct = total ? Math.min(100, (bytes / total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 border border-white/15 bg-[#0A0A0A]/90 backdrop-blur-sm rounded-2xl p-6"
    >
      <div className="text-white font-medium mb-2">
        {status === "downloading" ? "Downloading the models…" : `Heads up: this downloads ${size}`}
      </div>
      <p className="text-white/65 text-sm leading-relaxed mb-5 max-w-2xl">
        {t(
          `The four models run right here in your browser, so nothing you type ever leaves your device. They're ${size}, downloaded once and kept until you delete them. On mobile data? Wait for Wi-Fi.`,
          `Inference runs client-side (ONNX Runtime Web + a JS port of the preprocessing). The weights (${size}, 8-bit transformers) are fetched once into the Cache API and reused offline.`,
        )}
      </p>

      {status === "downloading" ? (
        <div>
          <div
            role="progressbar"
            aria-label="Model download"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"
          >
            <div className="h-full bg-white rounded-full transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/55 tabular-nums">
            <span>
              {mb(bytes)} of {size}
            </span>
            <span>{Math.floor(pct)}%</span>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-red-300 text-sm mb-4">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => start()}
            className="bg-white text-black rounded-full px-6 py-2.5 text-sm font-medium hover:bg-white/90 transition-all cursor-pointer"
          >
            {error ? "Try again" : `Download ${size}`}
          </button>
        </>
      )}
    </motion.div>
  );
}
