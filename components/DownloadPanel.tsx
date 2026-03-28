"use client";

import { useEffect, useState } from "react";

interface Preset {
  label: string;
  code: string;
}

interface DownloadPanelProps {
  videoUrl: string;
  videoId: string;
}

export default function DownloadPanel({ videoUrl, videoId }: DownloadPanelProps) {
  const [formats, setFormats] = useState<Preset[]>([]);
  const [selected, setSelected] = useState<Preset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/formats?url=${encodeURIComponent(videoUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFormats(data.formats);
        setSelected(data.formats[1] ?? data.formats[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [videoUrl]);

  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);
    try {
        const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, code: selected.code }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const blob = await res.blob();
      const ext = selected.code === "audio" ? "m4a" : "mp4";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `abd-${videoId}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: "oklch(1 0 0 / 7%)" }}
      >
        <div className="chip-orange w-7 h-7 rounded-xl flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold">Download</h3>
      </div>

      <div className="px-5 py-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.45 0 0)" }}>
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Fetching available formats...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl p-3 text-xs" style={{ background: "oklch(0.63 0.22 25 / 12%)", color: "oklch(0.75 0.15 25)" }}>
            {error}
          </div>
        )}

        {!loading && !error && formats.length > 0 && (
          <div className="space-y-3">
            {/* Format picker */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {formats.map((f) => (
                <button
                  key={f.code}
                  onClick={() => setSelected(f)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150"
                  style={{
                    background: selected?.code === f.code ? "oklch(0.97 0 0)" : "oklch(1 0 0 / 5%)",
                    color: selected?.code === f.code ? "oklch(0.09 0 0)" : "oklch(0.6 0 0)",
                    border: `1px solid ${selected?.code === f.code ? "transparent" : "oklch(1 0 0 / 8%)"}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading || !selected}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-50"
              style={{ background: "oklch(0.72 0.18 42)", color: "oklch(0.98 0 0)" }}
            >
              {downloading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  Download {selected?.label}
                </>
              )}
            </button>

            <p className="text-[11px] text-center" style={{ color: "oklch(0.32 0 0)" }}>
              For personal use only · yt-dlp powered
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
