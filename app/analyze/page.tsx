"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import TranscriptView from "@/components/TranscriptView";
import DownloadPanel from "@/components/DownloadPanel";
import { saveToHistory } from "@/lib/storage";
import type { VideoInfo } from "@/lib/youtube";
import type { TranscriptSegment } from "@/lib/transcript";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[] | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");

  useEffect(() => {
    const u = searchParams.get("url");
    if (u) { setUrl(u); runAnalyze(u); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalyze(input?: string) {
    const target = input ?? url;
    if (!target.trim()) return;
    setLoading(true);
    setError("");
    setVideoInfo(null);
    setTranscript(null);
    setTranscriptError("");

    try {
      const res = await fetch(`/api/video-info?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoInfo(data);
      saveToHistory(data);
      router.replace(`/analyze?url=${encodeURIComponent(target)}`, { scroll: false });
      loadTranscript(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadTranscript(target: string) {
    setTranscriptLoading(true);
    try {
      const res = await fetch(`/api/transcript?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscript(data.segments);
    } catch (e) {
      setTranscriptError(e instanceof Error ? e.message : "Failed to load transcript");
    } finally {
      setTranscriptLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(0.45 0 0)" }}>
          YouTube Analyzer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Analyze Video</h1>
      </div>

      {/* Input */}
      <div
        className="flex gap-3 p-2 rounded-2xl border"
        style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)" }}
      >
        <div className="flex-1 flex items-center gap-3 px-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.4 0 0)", flexShrink: 0 }}>
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
            <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
          </svg>
          <input
            type="text"
            placeholder="Paste a YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAnalyze()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[oklch(0.35_0_0)] font-mono"
            dir="ltr"
          />
        </div>
        <button
          onClick={() => runAnalyze()}
          disabled={loading || !url.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 hover:opacity-85"
          style={{ background: "oklch(0.97 0 0)", color: "oklch(0.09 0 0)" }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Analyzing
            </span>
          ) : "Analyze"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: "oklch(0.63 0.22 25 / 10%)", color: "oklch(0.75 0.15 25)" }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {videoInfo && (
        <div className="space-y-4">
          <VideoCard videoInfo={videoInfo} />

          {/* Transcript */}
          {transcriptLoading && (
            <div
              className="px-5 py-6 rounded-2xl border flex items-center gap-3 text-sm"
              style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)", color: "oklch(0.45 0 0)" }}
            >
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
              Fetching transcript...
            </div>
          )}

          {transcriptError && !transcriptLoading && (
            <div
              className="px-5 py-4 rounded-2xl border text-sm"
              style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)", color: "oklch(0.45 0 0)" }}
            >
              <span className="font-medium" style={{ color: "oklch(0.6 0 0)" }}>No transcript available</span>
              <span className="mx-2" style={{ color: "oklch(0.3 0 0)" }}>·</span>
              {transcriptError}
            </div>
          )}

          {transcript && !transcriptLoading && (
            <TranscriptView segments={transcript} videoId={videoInfo.id} />
          )}

          {/* Download */}
          <DownloadPanel videoUrl={`https://www.youtube.com/watch?v=${videoInfo.id}`} videoId={videoInfo.id} />
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeContent />
    </Suspense>
  );
}
