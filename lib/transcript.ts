import { Innertube, Platform } from "youtubei.js";
import vm from "node:vm";

// Provide a Node.js vm evaluator for youtubei.js (needed on Vercel)
Platform.load({
  ...Platform.shim,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eval: async (data: { output: string }, env: Record<string, any>) => {
    return vm.runInNewContext(`(function() { ${data.output} })()`, { ...env });
  },
});

export interface TranscriptSegment {
  text: string
  offset: number  // ms
  duration: number  // ms
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const yt = await Innertube.create();
  // ANDROID client returns caption URLs that work from any server IP
  const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });

  const tracks = info.captions?.caption_tracks ?? [];
  if (tracks.length === 0) throw new Error("No transcript available for this video");

  // Prefer English, then Arabic, then first available
  const track =
    tracks.find((t) => t.language_code === "en") ??
    tracks.find((t) => t.language_code === "ar") ??
    tracks[0];

  const url = track.base_url.replace(/&fmt=[^&]+/, "") + "&fmt=json3";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch transcript");

  const json = await res.json() as { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] };
  const segments: TranscriptSegment[] = [];

  for (const ev of json.events ?? []) {
    if (!ev.segs || ev.tStartMs == null) continue;
    const text = ev.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (text) segments.push({ text, offset: ev.tStartMs, duration: ev.dDurationMs ?? 0 });
  }

  if (segments.length === 0) throw new Error("No transcript available");
  return segments;
}

export function formatTranscriptAsText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
