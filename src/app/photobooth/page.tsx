"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Photobooth from "@/components/Photobooth";
import SakuraPetals from "@/components/SakuraPetals";

const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function PhotoboothPage() {
  return (
    <>
      {/* Background radial blobs */}
      <div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: `radial-gradient(circle, var(--blob-1) 0%, transparent 70%)`,
            transition: "background 0.4s ease",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, var(--blob-2) 0%, transparent 70%)`,
            transition: "background 0.4s ease",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(ellipse, var(--blob-3) 0%, transparent 70%)`,
            transition: "background 0.4s ease",
          }}
        />
      </div>

      {/* Floating sakura petals */}
      <SakuraPetals />

      <Navbar />

      <main className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 pt-28 pb-16">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back button & Eyebrow tag */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-body)",
              }}
            >
              <ArrowLeft size={13} />
              Back to Our Scrapbook
            </Link>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-wider"
              style={{
                background: "var(--bg-tag)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-label)",
              }}
            >
              <Sparkles size={11} />
              Studio Booth
            </motion.div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: CUBIC }}
            className="text-center mb-8"
          >
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading)" }}
            >
              Date Night Photobooth
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-light max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
              Take 4 sweet candid shots together, pick your vintage filter, choose your custom paper color, and save high-res postcards &amp; film strips.
            </p>
          </motion.div>

          {/* Photobooth Widget */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: CUBIC }}
          >
            <Photobooth />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-16 pb-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
            <span>Made with love</span>
            <Heart size={10} fill="currentColor" strokeWidth={0} className="text-pink-500" />
            <span>· Mark &amp; Aiseil</span>
          </div>
        </footer>
      </main>
    </>
  );
}
