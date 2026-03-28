"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHistory, removeFromHistory, type HistoryItem } from "@/lib/storage";
import { getThumbnailUrlFallback } from "@/lib/youtube";

export default function HistoryList() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (history.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 rounded-2xl border"
        style={{ borderColor: "oklch(1 0 0 / 7%)", background: "oklch(0.11 0 0)" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "oklch(1 0 0 / 6%)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.45 0 0)" }}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: "oklch(0.5 0 0)" }}>No history yet</p>
        <p className="text-xs mb-5" style={{ color: "oklch(0.35 0 0)" }}>Analyze your first YouTube video to get started</p>
        <Link
          href="/analyze"
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: "oklch(0.97 0 0)", color: "oklch(0.09 0 0)" }}
        >
          Analyze a Video
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {history.map((item) => (
        <div
          key={item.videoInfo.id}
          className="group flex gap-4 p-4 rounded-2xl border transition-all duration-150 hover:border-white/10"
          style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 6%)" }}
        >
          <Link
            href={`/analyze?url=https://www.youtube.com/watch?v=${item.videoInfo.id}`}
            className="shrink-0"
          >
            <div className="relative w-36 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <Image
                src={item.videoInfo.thumbnailUrl}
                alt={item.videoInfo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getThumbnailUrlFallback(item.videoInfo.id);
                }}
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="oklch(0.09 0 0)">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="flex-1 min-w-0 py-0.5">
            <Link href={`/analyze?url=https://www.youtube.com/watch?v=${item.videoInfo.id}`}>
              <h3
                className="font-medium text-sm leading-snug line-clamp-2 mb-1.5 transition-colors group-hover:text-white"
                style={{ color: "oklch(0.88 0 0)" }}
              >
                {item.videoInfo.title}
              </h3>
            </Link>
            <p className="text-xs mb-3" style={{ color: "oklch(0.45 0 0)" }}>
              {item.videoInfo.channelTitle}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium font-mono"
                style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.55 0 0)" }}
              >
                {item.videoInfo.duration}
              </span>
              <span className="text-[11px]" style={{ color: "oklch(0.35 0 0)" }}>
                {new Date(item.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          <button
            onClick={() => { removeFromHistory(item.videoInfo.id); setHistory(getHistory()); }}
            className="shrink-0 self-start mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-white/8"
            title="Remove"
            style={{ color: "oklch(0.4 0 0)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
