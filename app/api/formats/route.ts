import { type NextRequest } from "next/server";
import { Innertube } from "youtubei.js";
import { extractVideoId } from "@/lib/youtube";

export interface Preset {
  label: string;
  code: string;
  height: number | null;
  audioOnly: boolean;
}

const PRESETS: Preset[] = [
  { label: "Best (4K)",  code: "4k",    height: 2160, audioOnly: false },
  { label: "1080p HD",   code: "1080p", height: 1080, audioOnly: false },
  { label: "720p",       code: "720p",  height: 720,  audioOnly: false },
  { label: "480p",       code: "480p",  height: 480,  audioOnly: false },
  { label: "360p",       code: "360p",  height: 360,  audioOnly: false },
  { label: "Audio (MP4)",code: "audio", height: null, audioOnly: true  },
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const yt = await Innertube.create({ retrieve_player: false });
    const info = await yt.getBasicInfo(videoId);

    const streamingData = info.streaming_data;
    const availableHeights = new Set<number>();

    if (streamingData) {
      for (const f of [...(streamingData.formats ?? []), ...(streamingData.adaptive_formats ?? [])]) {
        if (f.height) availableHeights.add(f.height);
      }
    }

    const available = PRESETS.filter((p) => {
      if (p.audioOnly) return true;
      if (availableHeights.size === 0) return p.height && p.height <= 1080;
      return p.height !== null && Array.from(availableHeights).some((h) => h >= p.height!);
    });

    return Response.json({ formats: available, title: info.basic_info.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch formats";
    return Response.json({ error: message }, { status: 500 });
  }
}
