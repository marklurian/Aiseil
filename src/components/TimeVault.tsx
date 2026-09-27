"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Heart } from "lucide-react";

/* ─── Hardcoded anniversary ───────────────────────────────────── */
// new Date(year, monthIndex, day, hours, minutes, seconds) → LOCAL time
// monthIndex is 0-based: 1 = February
const START_DATE = new Date(2020, 1, 7, 17, 0, 0);

/* ─── Types ───────────────────────────────────────────────────── */
interface RawUnit {
  value: number;
  label: string;
  accent?: boolean;
}

/* ─── Calendar-accurate elapsed time ─────────────────────────── */
function calculateElapsed(): RawUnit[] {
  const now = new Date();

  // Component-wise difference
  let years   = now.getFullYear() - START_DATE.getFullYear();
  let months  = now.getMonth()    - START_DATE.getMonth();
  let days    = now.getDate()     - START_DATE.getDate();
  let hours   = now.getHours()    - START_DATE.getHours();
  let minutes = now.getMinutes()  - START_DATE.getMinutes();
  let seconds = now.getSeconds()  - START_DATE.getSeconds();

  // Borrow upward — smallest unit first
  if (seconds < 0) { seconds += 60; minutes -= 1; }
  if (minutes < 0) { minutes += 60; hours   -= 1; }
  if (hours   < 0) { hours   += 24; days    -= 1; }
  if (days    < 0) {
    // Number of days in the previous calendar month
    const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days   += daysInPrevMonth;
    months -= 1;
  }
  if (months  < 0) { months += 12; years -= 1; }

  return [
    { value: years,   label: "Years"   },
    { value: months,  label: "Months"  },
    { value: days,    label: "Days"    },
    { value: hours,   label: "Hours"   },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds", accent: true },
  ];
}

/* ─── Single animated digit ───────────────────────────────────── */
function FlipDigit({ digit, accent, mounted }: { digit: string; accent?: boolean; mounted?: boolean }) {
  if (!mounted) {
    return (
      <span
        suppressHydrationWarning
        style={{
          display: "block",
          lineHeight: 1,
          height: "1em",
          minWidth: "0.6em",
          textAlign: "center",
        }}
      >
        {digit}
      </span>
    );
  }

  return (
    <div
      style={{
        overflow: "hidden",
        lineHeight: 1,
        height: "1em",
        minWidth: "0.6em",
        textAlign: "center",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: "105%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%",   opacity: 1, filter: "blur(0px)" }}
          exit={{    y: "-105%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
          style={{ display: "block" }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Time tile (glassmorphic card) ───────────────────────────── */
const tileVariants = {
  hidden:  { opacity: 0, y: 22, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.82 + i * 0.09, duration: 0.5, ease: CUBIC },
  }),
};

function TimeTile({
  value,
  label,
  accent,
  index,
  mounted,
}: RawUnit & { index: number; mounted?: boolean }) {
  const padded = String(value).padStart(2, "0");
  const [d1, d2] = padded.split("");

  return (
    <motion.div
      custom={index}
      variants={tileVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Card */}
      <div
        className="relative rounded-2xl flex flex-col overflow-hidden"
        style={{
          width: "68px",
          background: "var(--bg-glass)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: `1px solid ${accent ? "rgba(236,72,153,0.35)" : "var(--border-glass)"}`,
          boxShadow: accent
            ? "var(--card-shadow), 0 0 22px rgba(236,72,153,0.14)"
            : "var(--card-shadow)",
        }}
      >
        {/* Number area */}
        <div
          className="flex items-center justify-center py-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.9rem",
            fontWeight: 700,
            color: accent ? "#ec4899" : "var(--text-heading)",
            letterSpacing: "-0.02em",
          }}
          aria-label={`${value} ${label}`}
        >
          <FlipDigit digit={d1} accent={accent} mounted={mounted} />
          <FlipDigit digit={d2} accent={accent} mounted={mounted} />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border-divider)" }} />

        {/* Label strip */}
        <div
          className="flex items-center justify-center py-1.5"
          style={{
            background: accent
              ? "linear-gradient(135deg, rgba(249,168,212,0.18), rgba(236,72,153,0.12))"
              : "var(--bg-slot)",
          }}
        >
          <span
            className="text-[8px] uppercase tracking-[0.16em] font-bold"
            style={{ color: accent ? "#ec4899" : "var(--text-faint)" }}
          >
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Pulsing colon / dot separator ──────────────────────────── */
function Separator({ variant = "colon" }: { variant?: "colon" | "dot" }) {
  if (variant === "dot") {
    return (
      <motion.div
        className="flex-shrink-0 w-1 h-1 rounded-full mb-8"
        style={{ background: "var(--border-glass)" }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
    );
  }

  // Colon (pulsing, for H:M:S group)
  return (
    <div
      className="flex-shrink-0 flex flex-col gap-1.5 mb-8"
      aria-hidden="true"
    >
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: "var(--text-label)" }}
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{
            duration: 1,
            delay: i * 0.08,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function TimeVault() {
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<RawUnit[]>(calculateElapsed);

  useEffect(() => {
    setMounted(true);
    setUnits(calculateElapsed());

    // Align the first tick to the top of the next wall-clock second
    // so the display stays in sync with the system clock.
    const msUntilNextSecond = 1000 - (Date.now() % 1000);
    let id: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      setUnits(calculateElapsed());
      id = setInterval(() => setUnits(calculateElapsed()), 1000);
    }, msUntilNextSecond);

    return () => {
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, []);

  const [years, months, days, hours, minutes, seconds] = units;

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7, ease: CUBIC }}
      className="mt-10 flex flex-col items-center gap-5"
      aria-label="Time we have been together"
    >
      {/* Section label */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-px w-8"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--text-faint))",
          }}
        />
        <Timer
          size={12}
          strokeWidth={2}
          style={{ color: "var(--text-label)" }}
          aria-hidden="true"
        />
        <span
          className="text-[10px] uppercase tracking-[0.24em] font-bold"
          style={{ color: "var(--text-label)" }}
        >
          Time Together
        </span>
        <Timer
          size={12}
          strokeWidth={2}
          style={{ color: "var(--text-label)" }}
          aria-hidden="true"
        />
        <div
          className="h-px w-8"
          style={{
            background:
              "linear-gradient(90deg, var(--text-faint), transparent)",
          }}
        />
      </div>

      {/* ── Tile groups ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">
        {/* Y · M · D */}
        <div className="flex items-end gap-1.5" role="group" aria-label="Years, months, days">
          <TimeTile {...years}   index={0} mounted={mounted} />
          <Separator variant="dot" />
          <TimeTile {...months}  index={1} mounted={mounted} />
          <Separator variant="dot" />
          <TimeTile {...days}    index={2} mounted={mounted} />
        </div>

        {/* Group divider — visible on sm+ */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="hidden sm:block w-5 h-px"
          style={{ background: "var(--border-glass)" }}
          aria-hidden="true"
        />

        {/* H : M : S */}
        <div className="flex items-end gap-1.5" role="group" aria-label="Hours, minutes, seconds">
          <TimeTile {...hours}   index={3} mounted={mounted} />
          <Separator variant="colon" />
          <TimeTile {...minutes} index={4} mounted={mounted} />
          <Separator variant="colon" />
          <TimeTile {...seconds} index={5} mounted={mounted} />
        </div>
      </div>

      {/* Since date footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.45, duration: 0.5 }}
        className="flex items-center gap-1.5"
      >
        <Heart
          size={9}
          fill="currentColor"
          strokeWidth={0}
          style={{ color: "#ec4899" }}
          aria-hidden="true"
        />
        <p
          className="text-[11px] font-light tracking-wide"
          style={{ color: "var(--text-faint)" }}
        >
          Since February 7, 2020 at 5:00 PM
        </p>
        <Heart
          size={9}
          fill="currentColor"
          strokeWidth={0}
          style={{ color: "#ec4899" }}
          aria-hidden="true"
        />
      </motion.div>
    </motion.section>
  );
}
