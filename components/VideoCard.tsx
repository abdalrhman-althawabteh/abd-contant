"use client";

import Image from "next/image";
import { useState } from "react";
import { getThumbnailUrlFallback } from "@/lib/youtube";
import type { VideoInfo } from "@/lib/youtube";

interface StatChipProps {
  label: string;
  value: string;
  colorClass: string;
  icon: React.ReactNode;
}

function StatChip({ label, value, colorClass, icon }: StatChipProps) {
  return (
    <div className={`${colorClass} rounded-2xl p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest opacity-60">{label}</span>
        <span className="opacity-50">{icon}</span>
      </div>
      <span className="text-2xl font-semibold tracking-tight leading-none">{value}</span>
    </div>
  );
}

interface VideoCardProps {
  videoInfo: VideoInfo;
}

export default function VideoCard({ videoInfo }: VideoCardProps) {
  const [imgSrc, setImgSrc] = useState(videoInfo.thumbnailUrl);

  const publishedYear = new Date(videoInfo.publishedAt).getFullYear();

  return (
    <div className="space-y-3">
      {/* Main card */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(1 0 0 / 7%)" }}
      >
        {/* Thumbnail */}
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <Image
            src={imgSrc}
            alt={videoInfo.title}
            fill
            className="object-cover"
            onError={() => setImgSrc(getThumbnailUrlFallback(videoInfo.id))}
            unoptimized
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.12 0 0) 0%, transparent 50%)" }} />
        </div>

        {/* Info */}
        <div className="px-5 pb-5 -mt-2">
          <h2 className="text-lg font-semibold leading-snug tracking-tight mb-1 text-balance">{videoInfo.title}</h2>
          <p className="text-sm" style={{ color: "oklch(0.5 0 0)" }}>{videoInfo.channelTitle}</p>
        </div>
      </div>

      {/* Stat chips — reference image style */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip
          label="Duration"
          value={videoInfo.duration}
          colorClass="chip-yellow"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatChip
          label="Views"
          value={videoInfo.viewCount}
          colorClass="chip-violet"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <StatChip
          label="Year"
          value={String(publishedYear)}
          colorClass="chip-teal"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
