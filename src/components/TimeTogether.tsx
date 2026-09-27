"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const START_DATE = new Date("2020-02-07T17:00:00");

interface TimeUnit {
  value: number;
  label: string;
}

function getTimeTogether(): TimeUnit[] {
  const now = new Date();
  const diff = Math.max(0, now.getTime() - START_DATE.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalDays    = Math.floor(totalHours   / 24);
  const years   = Math.floor(totalDays / 365);
  const months  = Math.floor((totalDays % 365) / 30);
  const days    = totalDays % 30;
  const hours   = totalHours   % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  return [
    { value: years,   label: "Years"   },
    { value: months,  label: "Months"  },
    { value: days,    label: "Days"    },
    { value: hours,   label: "Hours"   },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];
}

const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const tileVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.85 + i * 0.13, duration: 0.5, ease: CUBIC },
  }),
};

export default function TimeTogether() {
  const [units, setUnits] = useState<TimeUnit[]>(getTimeTogether());

  useEffect(() => {
    const id = setInterval(() => setUnits(getTimeTogether()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
      className="mt-10 flex flex-col items-center gap-4"
      aria-label="Time we have spent together"
    >
      {/* Label row */}
      <div className="flex items-center gap-2">
        <Clock size={13} style={{ color: "var(--text-label)" }} strokeWidth={2} />
        <p
          className="text-[11px] uppercase tracking-[0.22em] font-semibold"
          style={{ color: "var(--text-label)" }}
        >
          Time Together
        </p>
        <Clock size={13} style={{ color: "var(--text-label)" }} strokeWidth={2} />
      </div>

      {/* Tiles */}
      <div className="flex items-end gap-2 sm:gap-3 flex-wrap justify-center" role="timer">
        {units.map((unit, i) => (
          <motion.div
            key={unit.label}
            custom={i}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="glass-card rounded-2xl w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] flex items-center justify-center"
              style={{ border: "1px solid var(--border-glass)" }}
            >
              <span
                className="shimmer-text text-2xl sm:text-3xl font-bold tabular-nums leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
                aria-label={`${unit.value} ${unit.label}`}
              >
                {String(unit.value).padStart(2, "0")}
              </span>
            </div>
            <span
              className="text-[9px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: "var(--text-faint)" }}
              aria-hidden="true"
            >
              {unit.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Since date */}
      <p
        className="text-[11px] font-light"
        style={{ color: "var(--text-faint)" }}
      >
        Since February 7, 2020 at 5:00 PM
      </p>
    </motion.div>
  );
}
