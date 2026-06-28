import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GenNews — AI-Powered Prediction Market",
  description:
    "The first prediction market that auto-settles using AI reading real news on-chain. Powered by GenLayer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* ── Navigation ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030014]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🗞️</span>
              <span className="text-xl font-bold gradient-text group-hover:opacity-80 transition-opacity">
                GenNews
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:inline-flex px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Markets
              </Link>
              <Link
                href="/create"
                className="btn-primary text-sm !py-2 !px-4"
              >
                + Create Bet
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="min-h-screen pt-16">{children}</main>

        {/* ── Footer ── */}
        <footer className="border-t border-white/5 bg-[#030014]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗞️</span>
                <span className="text-sm font-semibold gradient-text">GenNews</span>
                <span className="text-xs text-gray-500">
                  — AI Prediction Market
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Powered by</span>
                <a
                  href="https://genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  GenLayer
                </a>
                <span>⚡</span>
                <span>AI Validators</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
