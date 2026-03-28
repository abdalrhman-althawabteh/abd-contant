import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptSegment {
  text: string
  offset: number  // ms
  duration: number  // ms
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  if (!raw || raw.length === 0) throw new Error("No transcript available");
  return raw.map((s) => ({
    text: s.text,
    offset: s.offset,
    duration: s.duration,
  }));
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
