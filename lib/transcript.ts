import { fetchTranscript } from 'youtube-transcript'

export interface TranscriptSegment {
  text: string
  offset: number
  duration: number
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const segments = await fetchTranscript(videoId)
  return segments.map((s) => ({
    text: s.text,
    offset: s.offset,
    duration: s.duration,
  }))
}

export function formatTranscriptAsText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(' ')
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
