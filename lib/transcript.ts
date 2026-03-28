export interface TranscriptSegment {
  text: string
  offset: number  // ms
  duration: number  // ms
}

const ANDROID_CLIENT_VERSION = "20.10.38";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

async function getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `com.google.android.youtube/${ANDROID_CLIENT_VERSION} (Linux; U; Android 14)`,
    },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: ANDROID_CLIENT_VERSION } },
      videoId,
    }),
  });

  if (!res.ok) throw new Error(`Player API failed: ${res.status}`);

  const data = await res.json() as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: CaptionTrack[]
      }
    }
  };

  return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack {
  // Prefer manual (non-asr) tracks first, then auto-generated
  const manual = tracks.filter((t) => t.kind !== "asr");
  const auto = tracks.filter((t) => t.kind === "asr");
  const pool = manual.length > 0 ? manual : auto;

  // Within pool: prefer English, then Arabic, then first available
  return (
    pool.find((t) => t.languageCode === "en") ??
    pool.find((t) => t.languageCode === "ar") ??
    pool[0]
  );
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}

function parseJson3(json: { events?: Json3Event[] }): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  for (const ev of json.events ?? []) {
    if (!ev.segs || ev.tStartMs == null) continue;
    const text = ev.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (text) segments.push({ text, offset: ev.tStartMs, duration: ev.dDurationMs ?? 0 });
  }
  return segments;
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const tracks = await getCaptionTracks(videoId);
  if (tracks.length === 0) throw new Error("No transcript available for this video");

  const track = pickTrack(tracks);

  // Request JSON3 format — much more reliable than XML
  const url = track.baseUrl.replace(/&fmt=[^&]+/, "") + "&fmt=json3";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch transcript");

  const json = await res.json() as { events?: Json3Event[] };
  const segments = parseJson3(json);
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
