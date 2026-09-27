"use client";

import { motion } from "framer-motion";

/* ── Custom sakura petal SVG ──────────────────────────────────── */
function SakuraPetal({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {/* 5 petals */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="24"
          rx="13"
          ry="22"
          fill="var(--petal-color)"
          opacity="0.88"
          style={{
            transformOrigin: "50px 50px",
            transform: `rotate(${angle}deg)`,
          }}
        />
      ))}
      {/* Stamen center */}
      <circle cx="50" cy="50" r="9" fill="var(--petal-center)" opacity="0.75" />
      <circle cx="50" cy="50" r="4" fill="white" opacity="0.55" />
    </svg>
  );
}

/* ── Petal config ─────────────────────────────────────────────── */
const PETALS = [
  { left: "4%",  delay: 0,    duration: 8,   size: 30 },
  { left: "12%", delay: 1.8,  duration: 7,   size: 38 },
  { left: "22%", delay: 3.5,  duration: 9,   size: 26 },
  { left: "33%", delay: 0.7,  duration: 7.5, size: 34 },
  { left: "44%", delay: 5.2,  duration: 8.5, size: 40 },
  { left: "55%", delay: 2.3,  duration: 6.5, size: 28 },
  { left: "64%", delay: 4.1,  duration: 8,   size: 36 },
  { left: "74%", delay: 1.1,  duration: 7,   size: 44 },
  { left: "84%", delay: 3.0,  duration: 9.5, size: 32 },
  { left: "93%", delay: 6.0,  duration: 7.5, size: 38 },
];

export default function SakuraPetals() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {PETALS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: p.left }}
          animate={{
            y: [0, -180, -360],
            x: [0, 14, -8, 10, 0],
            opacity: [0, 0.7, 0.6, 0.55, 0],
            rotate: [0, 90, 200, 310, 400],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: p.delay * 0.6 + 1.5,
            ease: "easeInOut",
          }}
        >
          <SakuraPetal size={p.size} />
        </motion.div>
      ))}
    </div>
  );
}
