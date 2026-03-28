import { type NextRequest } from "next/server";
import { extractVideoId } from "@/lib/youtube";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const HOME = process.env.HOME ?? "/Users/admin";
const YTDLP_PATH = `${HOME}/yt-dlp`;
const NODE_PATH = "/usr/local/bin/node";
const FFMPEG_PATH = `${HOME}/ffmpeg`;

const qualityMap: Record<string, string> = {
  "4k":    "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]",
  "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]",
  "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
  "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]",
  "360p":  "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]",
  "audio": "bestaudio[ext=m4a]/bestaudio",
};

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP_PATH, args, {
      env: {
        ...process.env,
        PATH: `${HOME}:/usr/local/bin:${process.env.PATH}`,
        YTDLP_FFMPEG_PATH: FFMPEG_PATH,
      },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.slice(-2000) || stdout || `yt-dlp exited ${code}`));
    });
    proc.on("error", reject);
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, code } = body;

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const audioOnly = code === "audio";
  const format = qualityMap[code] ?? qualityMap["720p"];
  const ext = audioOnly ? "m4a" : "mp4";

  const tmpDir = await mkdtemp(join(tmpdir(), "abd-"));

  try {
    const outTemplate = join(tmpDir, `out.%(ext)s`);

    const args = [
      "--cookies-from-browser", "chrome",
      "--js-runtimes", `node:${NODE_PATH}`,
      "--ffmpeg-location", FFMPEG_PATH,
      "-f", format,
      "--no-playlist",
      "-o", outTemplate,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    // For video, merge into mp4; for audio, keep as-is
    if (!audioOnly) {
      args.splice(args.indexOf("-o"), 0, "--merge-output-format", "mp4");
    }

    await runYtDlp(args);

    // Find the output file (yt-dlp may produce a differently named file)
    const files = await readdir(tmpDir);
    const outFile = files.find((f) => f.endsWith(`.${ext}`) || f.endsWith(".mp4") || f.endsWith(".m4a") || f.endsWith(".webm"));
    if (!outFile) throw new Error(`No output file found. Files: ${files.join(", ")}`);

    const buffer = await readFile(join(tmpDir, outFile));

    // Get video title for filename
    let title = videoId;
    try {
      const titleOut = await runYtDlp([
        "--print", "title",
        "--no-playlist",
        "--cookies-from-browser", "chrome",
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);
      title = titleOut.trim().replace(/[<>:"/\\|?*]/g, "").trim() || videoId;
    } catch { /* use videoId as fallback */ }

    const finalExt = outFile.split(".").pop() ?? ext;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": audioOnly ? "audio/mp4" : "video/mp4",
        "Content-Disposition": `attachment; filename="${title}.${finalExt}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    console.error("[download]", err);
    return Response.json({ error: message }, { status: 500 });
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
