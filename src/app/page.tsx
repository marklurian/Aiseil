"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookHeart, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import TimeVault from "@/components/TimeVault";
import Photobooth from "@/components/Photobooth";
import BucketList from "@/components/BucketList";
import SakuraPetals from "@/components/SakuraPetals";

/* ── Framer Motion variants ──────────────────────────────────── */
const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroTitle = {
  hidden:  { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: CUBIC } },
};
const heroSub = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.22, duration: 0.65, ease: "easeOut" as const } },
};
const heroCta = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.42, duration: 0.55, ease: "easeOut" as const } },
};
const widgetVariants = {
  hidden:  { opacity: 0, y: 38, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 1.1 + i * 0.18, duration: 0.6, ease: CUBIC },
  }),
};

/* ── Decorative divider ──────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="flex items-center gap-3 mb-6"
    >
      <div
        className="h-px flex-1"
        style={{ background: "linear-gradient(90deg, transparent, var(--border-glass))" }}
      />
      <div className="flex items-center gap-2">
        <Heart size={10} fill="currentColor" strokeWidth={0} style={{ color: "var(--text-label)" }} />
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: "var(--text-faint)" }}
        >
          {label}
        </span>
        <Heart size={10} fill="currentColor" strokeWidth={0} style={{ color: "var(--text-label)" }} />
      </div>
      <div
        className="h-px flex-1"
        style={{ background: "linear-gradient(90deg, var(--border-glass), transparent)" }}
      />
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Home() {
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

      <main className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section
          className="flex flex-col items-center justify-center text-center pt-36 pb-12"
          aria-labelledby="hero-heading"
        >
          {/* Eyebrow tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest"
            style={{
              background: "var(--bg-tag)",
              border: "1px solid var(--border-glass)",
              boxShadow: "0 2px 14px rgba(249,168,212,0.12)",
              color: "var(--text-body)",
            }}
          >
            <Sparkles size={11} strokeWidth={2} />
            Our Little World
            <Sparkles size={11} strokeWidth={2} />
          </motion.div>

          {/* H1 */}
          <motion.h1
            id="hero-heading"
            variants={heroTitle}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold leading-[1.08] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading-hero)" }}
          >
            Every moment
            <br />
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 45%, #fb7185 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              with you
            </span>
          </motion.h1>

          {/* Decorative serif quote */}
          <motion.p
            variants={heroSub}
            initial="hidden"
            animate="visible"
            className="mt-5 max-w-md text-base sm:text-[1.05rem] font-light leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            A private scrapbook to hold all the tiny, beautiful things —&nbsp;
            our dates, adventures, and favourite memories.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={heroCta}
            initial="hidden"
            animate="visible"
            className="mt-8 flex items-center gap-3 flex-wrap justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 10px 30px rgba(236,72,153,0.4)" }}
              whileTap={{ scale: 0.97 }}
              id="hero-start-scrapbook-btn"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
                boxShadow: "0 4px 20px rgba(236,72,153,0.32)",
              }}
              aria-label="Start our scrapbook"
            >
              <BookHeart size={15} strokeWidth={2} />
              Start Our Scrapbook
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              id="hero-browse-memories-btn"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-body)",
              }}
              aria-label="Browse memories"
            >
              Browse Memories
              <ArrowRight size={14} strokeWidth={2} />
            </motion.button>
          </motion.div>

          {/* Time Together counter */}
          <TimeVault />
        </section>

        {/* ── WIDGET GRID ──────────────────────────────────────── */}
        <section
          className="mx-auto w-full max-w-5xl pb-24"
          aria-label="Interactive widgets"
        >
          <SectionDivider label="Our Space" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {([<Photobooth key="photobooth" />, <BucketList key="bucket" />] as React.ReactNode[]).map(
              (widget, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={widgetVariants}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                  id={i === 0 ? "widget-photobooth" : "widget-bucket-list"}
                >
                  {widget}
                </motion.div>
              )
            )}
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="mt-auto pb-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            className="flex items-center justify-center gap-1.5"
          >
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Made with
            </span>
            <Heart
              size={11}
              fill="currentColor"
              strokeWidth={0}
              style={{ color: "#ec4899" }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              · Aiseil {new Date().getFullYear()}
            </span>
          </motion.div>
        </footer>
      </main>
    </>
  );
}
