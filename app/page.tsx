import Link from "next/link";
import HistoryList from "@/components/HistoryList";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(0.45 0 0)" }}>
            Your Library
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        </div>
        <Link
          href="/analyze"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80"
          style={{ background: "oklch(0.97 0 0)", color: "oklch(0.09 0 0)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
          Analyze Video
        </Link>
      </div>

      <HistoryList />
    </div>
  );
}
