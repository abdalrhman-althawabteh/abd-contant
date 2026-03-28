import { type NextRequest } from "next/server";
import { extractVideoId } from "@/lib/youtube";

const ANDROID_CLIENT_VERSION = "20.10.38";
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface YtFormat {
  itag: number;
  url?: string;
  mimeType?: string;
  quality?: string;
  qualityLabel?: string;
  height?: number;
  contentLength?: string;
  audioQuality?: string;
}

interface PlayerResponse {
  streamingData?: {
    formats?: YtFormat[];
    adaptiveFormats?: YtFormat[];
  };
  videoDetails?: {
    title?: string;
  };
}

async function getPlayerData(videoId: string): Promise<PlayerResponse> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `com.google.android.youtube/${ANDROID_CLIENT_VERSION} (Linux; U; Android 14)`,
    },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: ANDROID_CLIENT_VERSION } },
      videoId,
    }),
  });
  if (!res.ok) throw new Error(`YouTube player API failed: ${res.status}`);
  return res.json();
}

function pickFormat(formats: YtFormat[], code: string): YtFormat | undefined {
  const allFmts = formats.filter((f) => f.url);

  if (code === "audio") {
    // Best audio-only m4a
    return allFmts
      .filter((f) => f.mimeType?.includes("audio/mp4"))
      .sort((a, b) => parseInt(b.contentLength ?? "0") - parseInt(a.contentLength ?? "0"))[0]
      ?? allFmts.find((f) => f.mimeType?.includes("audio/"));
  }

  const maxHeight: Record<string, number> = {
    "4k": 2160, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360,
  };
  const targetH = maxHeight[code] ?? 720;

  // Prefer muxed (video+audio) formats first
  const muxed = allFmts
    .filter((f) => f.height && f.height <= targetH && f.mimeType?.includes("video/mp4"))
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (muxed[0]) return muxed[0];

  // Fallback to any video format at or below target
  return allFmts
    .filter((f) => f.height && f.height <= targetH)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
}

async function streamToBuffer(url: string, totalBytes?: number): Promise<Uint8Array> {
  // Always use range requests — YouTube CDN returns 403 for full-file fetches
  const chunks: Uint8Array[] = [];

  if (totalBytes) {
    let offset = 0;
    while (offset < totalBytes) {
      const end = Math.min(offset + CHUNK_SIZE - 1, totalBytes - 1);
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Range": `bytes=${offset}-${end}` },
      });
      if (!res.ok) throw new Error(`Download failed at chunk ${offset}: ${res.status}`);
      chunks.push(new Uint8Array(await res.arrayBuffer()));
      offset = end + 1;
    }
    const total = new Uint8Array(totalBytes);
    let pos = 0;
    for (const c of chunks) { total.set(c, pos); pos += c.byteLength; }
    return total;
  }

  // Unknown size — fetch chunks until done
  let offset = 0;
  while (true) {
    const end = offset + CHUNK_SIZE - 1;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Range": `bytes=${offset}-${end}` },
    });
    if (res.status === 416) break; // range not satisfiable = done
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    chunks.push(buf);
    if (buf.byteLength < CHUNK_SIZE) break; // last chunk
    offset = end + 1;
  }

  const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
  const total = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) { total.set(c, pos); pos += c.byteLength; }
  return total;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, code } = body;

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const player = await getPlayerData(videoId);
    const allFormats = [
      ...(player.streamingData?.formats ?? []),
      ...(player.streamingData?.adaptiveFormats ?? []),
    ];

    const fmt = pickFormat(allFormats, code);
    if (!fmt?.url) {
      return Response.json({ error: "Requested quality not available" }, { status: 404 });
    }

    const audioOnly = code === "audio";
    const ext = audioOnly ? "m4a" : "mp4";
    const totalBytes = fmt.contentLength ? parseInt(fmt.contentLength) : undefined;

    const buffer = await streamToBuffer(fmt.url, totalBytes);

    const rawTitle = player.videoDetails?.title ?? videoId;
    const title = rawTitle.replace(/[<>:"/\\|?*]/g, "").trim();

    return new Response(buffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": audioOnly ? "audio/mp4" : "video/mp4",
        "Content-Disposition": `attachment; filename="${title}.${ext}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    console.error("[download]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
