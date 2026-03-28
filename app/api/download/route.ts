import { type NextRequest } from "next/server";
import { Innertube, Platform } from "youtubei.js";
import { extractVideoId } from "@/lib/youtube";
import vm from "node:vm";

// Provide a Node.js vm evaluator for youtubei.js URL deciphering
Platform.load({
  ...Platform.shim,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eval: async (data: { output: string }, env: Record<string, any>) => {
    return vm.runInNewContext(`(function() { ${data.output} })()`, { ...env });
  },
});

const HEIGHT_MAP: Record<string, number> = {
  "4k": 2160, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360,
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, code } = body;

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const yt = await Innertube.create();
    // ANDROID client returns direct URLs without cipher — most reliable from server IPs
    const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });

    const sd = info.streaming_data;
    if (!sd) return Response.json({ error: "No streaming data available" }, { status: 404 });

    const all = [...(sd.formats ?? []), ...(sd.adaptive_formats ?? [])];

    let format;
    if (code === "audio") {
      format =
        all.find((f) => f.mime_type?.includes("audio/mp4") && !f.has_video) ??
        all.find((f) => f.mime_type?.includes("audio/") && !f.has_video);
    } else {
      const targetH = HEIGHT_MAP[code] ?? 720;
      // Muxed (video+audio) at or below target
      const muxed = all
        .filter((f) => f.has_video && f.has_audio && (f.height ?? 0) <= targetH)
        .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
      format =
        muxed[0] ??
        all
          .filter((f) => f.has_video && (f.height ?? 0) <= targetH)
          .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
    }

    if (!format) {
      return Response.json(
        { error: `No format found for '${code}' (${all.length} total formats available)` },
        { status: 404 }
      );
    }

    const streamUrl = await format.decipher(yt.session.player);
    if (!streamUrl) {
      return Response.json({ error: "Could not decipher stream URL" }, { status: 500 });
    }

    const audioOnly = code === "audio";
    const ext = audioOnly ? "m4a" : "mp4";
    const rawTitle = info.basic_info.title ?? videoId;
    const filename = rawTitle.replace(/[<>:"/\\|?*]/g, "").trim() + "." + ext;

    return Response.json({ url: streamUrl, filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    console.error("[download]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
