export interface TranscriptSegment {
  text: string
  offset: number  // ms
  duration: number  // ms
}

const ANDROID_CLIENT_VERSION = "20.10.38";

async function getCaptionUrl(videoId: string): Promise<string> {
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
        captionTracks?: { baseUrl: string; languageCode: string; kind?: string }[]
      }
    }
  };

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (tracks.length === 0) throw new Error("No transcript available");

  // Prefer English track; fallback to first
  const track = tracks.find((t) => t.languageCode === "en") ?? tracks[0];
  return track.baseUrl;
}

function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  // Parse <p t="..." d="..."> ... </p> elements (timedtext format 3)
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(xml)) !== null) {
    const offset = parseInt(match[1], 10);
    const duration = parseInt(match[2], 10);
    const inner = match[3];

    // Extract text from <s> tags or raw text
    let text = "";
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sm: RegExpExecArray | null;
    while ((sm = sRegex.exec(inner)) !== null) text += sm[1];
    if (!text) text = inner.replace(/<[^>]+>/g, "");

    text = decodeEntities(text).trim();
    if (text) segments.push({ text, offset, duration });
  }

  // Fallback: old timedtext format with <text start="..." dur="...">
  if (segments.length === 0) {
    const oldRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    while ((match = oldRegex.exec(xml)) !== null) {
      const text = decodeEntities(match[3]).trim();
      if (text) segments.push({
        text,
        offset: Math.round(parseFloat(match[1]) * 1000),
        duration: Math.round(parseFloat(match[2]) * 1000),
      });
    }
  }

  return segments;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const captionUrl = await getCaptionUrl(videoId);

  const res = await fetch(captionUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch transcript");

  const xml = await res.text();
  const segments = parseTranscriptXml(xml);
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
