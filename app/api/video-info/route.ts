import { type NextRequest } from 'next/server'
import { extractVideoId, getVideoInfo } from '@/lib/youtube'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return Response.json({ error: 'الرجاء إدخال رابط YouTube' }, { status: 400 })
  }

  const videoId = extractVideoId(url)
  if (!videoId) {
    return Response.json({ error: 'رابط YouTube غير صالح' }, { status: 400 })
  }

  try {
    const info = await getVideoInfo(videoId)
    return Response.json(info)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return Response.json({ error: message }, { status: 500 })
  }
}
