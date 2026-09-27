"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, Sun, Moon, BookHeart } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function Navbar() {
  const { isDark, toggle } = useTheme();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-5xl px-5 py-4">
        <div
          className="rounded-2xl px-5 py-3 flex items-center justify-between"
          style={{
            background: "var(--nav-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--nav-border)",
            boxShadow: "0 4px 24px rgba(244,114,182,0.08)",
          }}
        >
          {/* ── Brand ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Aiseil home"
          >
            <span className="heart-pulse" aria-hidden="true">
              <Heart
                size={18}
                className="text-rose-400"
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
            <span
              className="text-[1.1rem] font-bold tracking-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "var(--text-heading)",
              }}
            >
              Aiseil
            </span>
          </Link>

          {/* ── Nav links ── */}
          <div className="hidden sm:flex items-center gap-0.5">
            {[
              { label: "Memories", href: "/#memories" },
              { label: "Bucket List", href: "/#bucket-list" },
              { label: "Photobooth", href: "/photobooth" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-200"
                style={{ color: "var(--text-nav-link)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--nav-link-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggle}
              id="theme-toggle-btn"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background: "var(--bg-pill-inactive)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-body)",
              }}
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </motion.button>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(236,72,153,0.38)" }}
              whileTap={{ scale: 0.96 }}
              id="nav-add-memory-btn"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
                boxShadow: "0 4px 14px rgba(236,72,153,0.3)",
              }}
              aria-label="Add a new memory"
            >
              <BookHeart size={14} strokeWidth={2} />
              Add Memory
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
