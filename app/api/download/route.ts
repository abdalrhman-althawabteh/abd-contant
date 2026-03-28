import { type NextRequest } from "next/server";
import { Innertube, Platform } from "youtubei.js";
import { extractVideoId } from "@/lib/youtube";
import vm from "node:vm";

// Provide a Node.js vm-based JavaScript evaluator for youtubei.js URL deciphering
Platform.load({
  ...Platform.shim,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eval: async (data: { output: string }, env: Record<string, any>) => {
    // Wrap in IIFE so top-level `return` statements are valid
    return vm.runInNewContext(`(function() { ${data.output} })()`, { ...env });
  },
});

function pickFormat(
  info: Awaited<ReturnType<Innertube["getBasicInfo"]>>,
  code: string
) {
  const streamingData = info.streaming_data;
  if (!streamingData) return null;

  const all = [
    ...(streamingData.formats ?? []),
    ...(streamingData.adaptive_formats ?? []),
  ];

  if (code === "audio") {
    return (
      all.find((f) => f.mime_type?.includes("audio/mp4") && !f.has_video) ??
      all.find((f) => f.mime_type?.includes("audio/") && !f.has_video) ??
      null
    );
  }

  const maxHeight: Record<string, number> = {
    "4k": 2160, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360,
  };
  const targetH = maxHeight[code] ?? 720;

  // Prefer muxed (video+audio) at or below target height
  const muxed = all
    .filter((f) => f.has_video && f.has_audio && (f.height ?? 0) <= targetH)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  if (muxed[0]) return muxed[0];

  return (
    all
      .filter((f) => f.has_video && (f.height ?? 0) <= targetH)
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0] ?? null
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, code } = body;

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const yt = await Innertube.create();
    const info = await yt.getBasicInfo(videoId, { client: "WEB" });

    const format = pickFormat(info, code);
    if (!format) {
      return Response.json({ error: "Requested quality not available" }, { status: 404 });
    }

    const streamUrl = await format.decipher(yt.session.player);
    if (!streamUrl) {
      return Response.json({ error: "Could not get stream URL" }, { status: 500 });
    }

    const audioOnly = code === "audio";
    const ext = audioOnly ? "m4a" : "mp4";
    const rawTitle = info.basic_info.title ?? videoId;
    const filename = rawTitle.replace(/[<>:"/\\|?*]/g, "").trim() + "." + ext;

    return Response.json({ url: streamUrl, filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    console.error("[download]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
