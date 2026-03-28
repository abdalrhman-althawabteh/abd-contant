import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Abd Content",
  description: "YouTube video analyzer — transcripts, thumbnails, downloads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${dmMono.variable}`}>
      <body className="h-full flex bg-background text-foreground antialiased">
        <Sidebar />
        <main className="flex-1 min-h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-10">{children}</div>
        </main>
      </body>
    </html>
  );
}
