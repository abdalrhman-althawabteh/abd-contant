"use client";

import { useState } from "react";
import { formatTime, type TranscriptSegment } from "@/lib/transcript";

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  videoId: string;
}

export default function TranscriptView({ segments, videoId }: TranscriptViewProps) {
  const [view, setView] = useState<"timed" | "plain">("timed");
  const [copied, setCopied] = useState(false);

  const plainText = segments.map((s) => s.text).join(" ");

  const copy = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "oklch(1 0 0 / 7%)" }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Transcript</h3>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-md"
            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.45 0 0)" }}
          >
            {segments.length} segments
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex rounded-xl overflow-hidden p-0.5"
            style={{ background: "oklch(1 0 0 / 6%)" }}
          >
            {(["timed", "plain"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-150"
                style={{
                  background: view === v ? "oklch(0.97 0 0)" : "transparent",
                  color: view === v ? "oklch(0.09 0 0)" : "oklch(0.5 0 0)",
                }}
              >
                {v === "timed" ? "Timestamped" : "Plain text"}
              </button>
            ))}
          </div>

          {/* Copy */}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-white/8"
            style={{ color: copied ? "oklch(0.72 0.14 185)" : "oklch(0.5 0 0)" }}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto px-5 py-4">
        {view === "timed" ? (
          <div className="space-y-1.5">
            {segments.map((seg, i) => (
              <div key={i} className="flex gap-3 group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/4 -mx-2">
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seg.offset / 1000)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-mono w-9 pt-0.5 transition-colors hover:text-white"
                  style={{ color: "oklch(0.35 0 0)" }}
                >
                  {formatTime(seg.offset)}
                </a>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.78 0 0)" }}>
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "oklch(0.75 0 0)" }}>
            {plainText}
          </p>
        )}
      </div>
    </div>
  );
}
