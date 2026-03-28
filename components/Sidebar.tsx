"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "History",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    href: "/analyze",
    label: "Analyze",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 shrink-0 h-full sticky top-0 flex flex-col border-r"
      style={{ borderColor: "oklch(1 0 0 / 7%)", background: "oklch(0.1 0 0)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-8">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "oklch(0.97 0 0)", color: "oklch(0.09 0 0)" }}
          >
            AC
          </div>
          <span className="font-semibold text-sm tracking-tight">Abd Content</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p
          className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.4 0 0)" }}
        >
          Menu
        </p>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "oklch(1 0 0 / 8%)" : "transparent",
                color: active ? "oklch(0.97 0 0)" : "oklch(0.5 0 0)",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5 border-t" style={{ borderColor: "oklch(1 0 0 / 7%)" }}>
        <p className="text-[11px]" style={{ color: "oklch(0.35 0 0)" }}>
          v1.0 · Abd Content
        </p>
      </div>
    </aside>
  );
}
