export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function getThumbnailUrlFallback(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export interface VideoInfo {
  id: string
  title: string
  channelTitle: string
  duration: string
  viewCount: string
  publishedAt: string
  thumbnailUrl: string
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('YOUTUBE_API_KEY غير مضبوط في .env.local')
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('فشل في جلب معلومات الفيديو من YouTube API')

  const data = await res.json()
  if (!data.items || data.items.length === 0) {
    throw new Error('الفيديو غير موجود أو خاص')
  }

  const item = data.items[0]
  const snippet = item.snippet
  const stats = item.statistics
  const duration = formatDuration(item.contentDetails.duration)

  return {
    id: videoId,
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    duration,
    viewCount: formatNumber(stats.viewCount),
    publishedAt: snippet.publishedAt,
    thumbnailUrl: getThumbnailUrl(videoId),
  }
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatNumber(n: string): string {
  const num = parseInt(n || '0')
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}
