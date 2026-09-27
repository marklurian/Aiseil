"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  BookHeart,
  Heart,
  Camera,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TimeVault from "@/components/TimeVault";
import MemoriesGallery from "@/components/MemoriesGallery";
import BucketList from "@/components/BucketList";
import SakuraPetals from "@/components/SakuraPetals";

/* ─── Story Sequence Data ─────────────────────────────────────── */
interface StoryStep {
  text: string;
  image: string;
}

const STORY_STEPS: StoryStep[] = [
  { text: "Hello babi...", image: "" },
  { text: "Happy 25th Birthday sayo.", image: "/memory1.jpg" },
  { text: "Narealize ko ang dami na natin memories...", image: "/memory2.jpg" },
  { text: "Mga kulitan, labing labing, syempre pati mga away HAHA.", image: "/memory3.jpg" },
  { text: " and syempre mas dadami pa so ginawa ko tong website for us...", image: "/memory4.jpg" },
  { text: "Para meron tayong special place to store them and make one dahil may photobooth dito HAHA", image: "/memory5.jpg" },
  { text: "This is a place just for us. For everything we are, and everything we are going to be.", image: "/memory6.jpg" },
  { text: "Muwah~~.", image: "/memory7.jpg" },
];

/* ─── Framer Motion variants ──────────────────────────────────── */
const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroTitle = {
  hidden: { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: CUBIC } },
};
const heroSub = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.22, duration: 0.65, ease: "easeOut" as const },
  },
};
const heroCta = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.42, duration: 0.55, ease: "easeOut" as const },
  },
};

/* ── Decorative divider ──────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 my-12"
    >
      <div
        className="h-px flex-1"
        style={{
          background: "linear-gradient(90deg, transparent, var(--border-glass))",
        }}
      />
      <div className="flex items-center gap-2">
        <Heart
          size={10}
          fill="currentColor"
          strokeWidth={0}
          style={{ color: "var(--text-label)" }}
        />
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: "var(--text-faint)" }}
        >
          {label}
        </span>
        <Heart
          size={10}
          fill="currentColor"
          strokeWidth={0}
          style={{ color: "var(--text-label)" }}
        />
      </div>
      <div
        className="h-px flex-1"
        style={{
          background: "linear-gradient(90deg, var(--border-glass), transparent)",
        }}
      />
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Home() {
  /* ── Storybook State ── */
  const [storyActive, setStoryActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showOpenButton, setShowOpenButton] = useState(false);

  /* Preload images in background */
  useEffect(() => {
    STORY_STEPS.forEach((step) => {
      if (step.image) {
        const img = new Image();
        img.src = step.image;
      }
    });
  }, []);

  /* Typewriter Effect logic */
  useEffect(() => {
    if (!storyActive) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    const targetText = STORY_STEPS[currentStep].text;

    setDisplayedText("");
    setIsTyping(true);
    setShowOpenButton(false);

    let charIdx = 0;
    intervalId = setInterval(() => {
      charIdx++;
      setDisplayedText(targetText.slice(0, charIdx));
      if (charIdx >= targetText.length) {
        clearInterval(intervalId);
        setIsTyping(false);

        // On Step 7: Wait exactly 2 seconds after text completes, then fade in the button
        if (currentStep === STORY_STEPS.length - 1) {
          timeoutId = setTimeout(() => {
            setShowOpenButton(true);
          }, 2000);
        }
      }
    }, 42); // 42ms per character for natural poetic typing

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [currentStep, storyActive]);

  /* Screen Tap Handler */
  const handleScreenTap = () => {
    // On Step 7, disable the screen tap to advance per instructions
    if (currentStep >= STORY_STEPS.length - 1) {
      return;
    }

    if (isTyping) {
      // If tapped while still typing, immediately complete the line
      setDisplayedText(STORY_STEPS[currentStep].text);
      setIsTyping(false);
    } else {
      // Advance to next step
      setCurrentStep((prev) => prev + 1);
    }
  };

  /* Replay Story Handler */
  const handleReplayStory = () => {
    setCurrentStep(0);
    setDisplayedText("");
    setShowOpenButton(false);
    setStoryActive(true);
  };

  const currentStepData = STORY_STEPS[currentStep];

  return (
    <>
      {/* ── CINEMATIC STORYBOOK INTRO OVERLAY ─────────────────── */}
      <AnimatePresence>
        {storyActive && (
          <motion.div
            key="storybook-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.85, ease: CUBIC }}
            onClick={handleScreenTap}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden"
          >
            {/* Background Images Crossfade */}
            <AnimatePresence mode="sync">
              {currentStepData.image ? (
                <motion.div
                  key={currentStepData.image}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${currentStepData.image})` }}
                />
              ) : (
                <motion.div
                  key="gradient-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 40%, #fed7aa 75%, #fbcfe8 100%)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Dark Romantic Overlay (for photo steps) or Soft Overlay (for gradient) */}
            <div
              className={`absolute inset-0 transition-colors duration-700 ${
                currentStepData.image
                  ? "bg-black/60 backdrop-blur-[1px]"
                  : "bg-white/30 backdrop-blur-[0.5px]"
              }`}
            />

            {/* Subtle Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: currentStepData.image
                  ? "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)"
                  : "radial-gradient(ellipse at center, transparent 50%, rgba(244,114,182,0.15) 100%)",
              }}
            />

            {/* Floating sakura petals on intro */}
            <SakuraPetals />

            {/* Top Step Progress Indicator */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {STORY_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? "w-7 bg-pink-400 shadow-sm shadow-pink-300"
                      : idx < currentStep
                      ? currentStepData.image
                        ? "w-2.5 bg-white/70"
                        : "w-2.5 bg-pink-600/60"
                      : currentStepData.image
                      ? "w-2 bg-white/20"
                      : "w-2 bg-pink-900/15"
                  }`}
                />
              ))}
            </div>

            {/* Story Text Box */}
            <div className="relative z-10 max-w-2xl text-center px-4 flex flex-col items-center">
              <h2
                className={`text-2xl sm:text-4xl md:text-5xl font-bold leading-relaxed tracking-tight ${
                  currentStepData.image
                    ? "text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
                    : "text-[#881337]"
                }`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span>{displayedText}</span>
                {isTyping && (
                  <span
                    className={`inline-block w-0.5 h-6 sm:h-9 ml-1.5 align-middle animate-pulse ${
                      currentStepData.image ? "bg-pink-300" : "bg-[#ec4899]"
                    }`}
                  />
                )}
              </h2>

              {/* Reveal Button on Step 7 (after 2 seconds) */}
              <AnimatePresence>
                {currentStep === 7 && showOpenButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.6, ease: CUBIC }}
                    className="mt-8"
                  >
                    <motion.button
                      type="button"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 12px 42px rgba(236,72,153,0.5)",
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoryActive(false);
                      }}
                      className="px-8 py-3.5 rounded-2xl font-semibold text-white flex items-center gap-2.5 transition-all cursor-pointer"
                      style={{
                        background: "rgba(255, 255, 255, 0.22)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.4)",
                        boxShadow: "0 10px 36px rgba(236,72,153,0.35)",
                      }}
                      aria-label="Open Our Scrapbook"
                    >
                      <BookHeart size={18} />
                      <span className="text-sm tracking-wide">
                        Open Our Scrapbook
                      </span>
                      <Sparkles size={16} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Tap Hint (Disabled on Step 7) */}
            {currentStep < 7 && (
              <motion.div
                animate={{ opacity: [0.35, 0.85, 0.35], y: [0, 2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-[10.5px] font-semibold tracking-widest uppercase flex items-center gap-1.5 pointer-events-none z-20 ${
                  currentStepData.image ? "text-white/70" : "text-pink-900/60"
                }`}
              >
                <span>Tap anywhere to continue</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background radial blobs ───────────────────────────── */}
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

      {/* Floating sakura petals on main page */}
      <SakuraPetals />

      <Navbar />

      <main className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6">
        {/* ── HERO SECTION ──────────────────────────────────────── */}
        <section
          className="flex flex-col items-center justify-center text-center pt-36 pb-12"
          aria-labelledby="hero-heading"
        >
          {/* Eyebrow tag & Replay Story Button */}
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest"
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

            <button
              type="button"
              onClick={handleReplayStory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-semibold text-pink-600 dark:text-pink-300 bg-pink-100/60 dark:bg-pink-950/40 border border-pink-200/60 hover:scale-104 transition-all"
              title="Replay the birthday intro story"
            >
              <RotateCcw size={10} />
              Replay Intro
            </button>
          </div>

          {/* H1 */}
          <motion.h1
            id="hero-heading"
            variants={heroTitle}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold leading-[1.08] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--text-heading-hero)",
            }}
          >
            Every moment
            <br />
            <span
              className="italic"
              style={{
                background:
                  "linear-gradient(135deg, #f472b6 0%, #ec4899 45%, #fb7185 100%)",
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
            A private scrapbook to hold all the tiny, beautiful things — our
            dates, adventures, and sweetest memories together.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={heroCta}
            initial="hidden"
            animate="visible"
            className="mt-8 flex items-center gap-3 flex-wrap justify-center"
          >
            <a
              href="#memories"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:scale-104 shadow-lg hover:shadow-pink-400/40"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
                boxShadow: "0 4px 20px rgba(236,72,153,0.32)",
              }}
              aria-label="Explore our memories"
            >
              <BookHeart size={15} strokeWidth={2} />
              Explore Our Memories
            </a>

            <Link
              href="/photobooth"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-104"
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-body)",
              }}
              aria-label="Open photobooth studio"
            >
              <Camera size={15} strokeWidth={2} />
              Open Photobooth
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Time Together counter */}
          <TimeVault />
        </section>

        {/* ── SECTION DIVIDER: MEMORIES ─────────────────────────── */}
        <SectionDivider label="Our Scrapbook Gallery" />

        {/* ── MEMORIES GALLERY (MASONRY GRID) ──────────────────── */}
        <MemoriesGallery />

        {/* ── SECTION DIVIDER: BUCKET LIST ──────────────────────── */}
        <SectionDivider label="Adventures & Dreams" />

        {/* ── BUCKET LIST (SCRAPBOOK BOARD) ────────────────────── */}
        <BucketList />

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="mt-auto pb-10 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center gap-2"
          >
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Made with</span>
              <Heart
                size={12}
                fill="currentColor"
                strokeWidth={0}
                className="text-pink-500 animate-pulse"
              />
              <span>for Aiseil · Mark &amp; Aiseil {new Date().getFullYear()}</span>
            </div>
            <p className="text-[10.5px] text-pink-400/80 font-serif italic">
              &ldquo;Forever and always, one memory at a time.&rdquo;
            </p>
          </motion.div>
        </footer>
      </main>
    </>
  );
}
