"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Plus,
  Sparkles,
  Trash2,
  Check,
  Compass,
  Smile,
} from "lucide-react";

interface ScrapbookCard {
  id: number;
  text: string;
  done: boolean;
  color: string;
  darkColor: string;
  tapeType: "tape-peach" | "tape-pink" | "tape-yellow" | "tape-mint" | "pin-red" | "pin-gold";
  rotation: string;
  dateCompleted?: string;
}

const INITIAL_SCRAPBOOK_ITEMS: ScrapbookCard[] = [
  {
    id: 1,
    text: "Watch the northern lights together in a cozy glass igloo",
    done: false,
    color: "#fffbeb", // yellow note
    darkColor: "#292518",
    tapeType: "tape-peach",
    rotation: "-rotate-2",
  },
  {
    id: 2,
    text: "Cook a romantic 3-course dinner from scratch with candlelight",
    done: true,
    color: "#fff1f2", // rose note
    darkColor: "#2c181d",
    tapeType: "pin-red",
    rotation: "rotate-2",
    dateCompleted: "Dec 2023",
  },
  {
    id: 3,
    text: "Visit a coastal city neither of us has ever explored before",
    done: false,
    color: "#f0fdf4", // mint note
    darkColor: "#17271e",
    tapeType: "tape-mint",
    rotation: "-rotate-1",
  },
  {
    id: 4,
    text: "Take an impromptu midnight road trip just to watch the sunrise",
    done: true,
    color: "#fff7ed", // peach note
    darkColor: "#2b1e16",
    tapeType: "tape-yellow",
    rotation: "rotate-3",
    dateCompleted: "Jun 2024",
  },
  {
    id: 5,
    text: "Learn a slow living-room dance in our pajamas to our song",
    done: true,
    color: "#faf5ff", // lavender note
    darkColor: "#24192d",
    tapeType: "pin-gold",
    rotation: "-rotate-3",
    dateCompleted: "Feb 2024",
  },
  {
    id: 6,
    text: "Stargaze on a big blanket outside until the morning birds sing",
    done: false,
    color: "#f0f9ff", // sky note
    darkColor: "#17242d",
    tapeType: "tape-pink",
    rotation: "rotate-1",
  },
  {
    id: 7,
    text: "Build a cozy blanket fort and have an all-night movie marathon",
    done: true,
    color: "#fff1f2", // rose note
    darkColor: "#2c181d",
    tapeType: "tape-peach",
    rotation: "-rotate-2",
    dateCompleted: "May 2024",
  },
  {
    id: 8,
    text: "Lock a love padlock on a famous bridge and toss the key forever",
    done: false,
    color: "#fffbeb", // yellow note
    darkColor: "#292518",
    tapeType: "pin-red",
    rotation: "rotate-2",
  },
];

const COLOR_OPTIONS = [
  { name: "Yellow", bg: "#fffbeb", darkBg: "#292518" },
  { name: "Rose", bg: "#fff1f2", darkBg: "#2c181d" },
  { name: "Mint", bg: "#f0fdf4", darkBg: "#17271e" },
  { name: "Peach", bg: "#fff7ed", darkBg: "#2b1e16" },
  { name: "Lavender", bg: "#faf5ff", darkBg: "#24192d" },
];

function CardAttachment({ type }: { type: ScrapbookCard["tapeType"] }) {
  if (type.startsWith("pin")) {
    const isGold = type === "pin-gold";
    return (
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center"
        aria-hidden="true"
      >
        <div
          className={`w-4 h-4 rounded-full shadow-md border-2 border-white flex items-center justify-center ${
            isGold ? "bg-amber-400" : "bg-rose-500"
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
        </div>
      </div>
    );
  }

  // Washi Tape
  const tapeColors: Record<string, string> = {
    "tape-peach": "rgba(254, 215, 170, 0.78)",
    "tape-pink": "rgba(251, 207, 232, 0.78)",
    "tape-yellow": "rgba(254, 240, 138, 0.78)",
    "tape-mint": "rgba(187, 247, 208, 0.78)",
  };

  return (
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 rounded-xs pointer-events-none z-10"
      style={{
        background: tapeColors[type] || tapeColors["tape-pink"],
        borderLeft: "2px dashed rgba(0,0,0,0.12)",
        borderRight: "2px dashed rgba(0,0,0,0.12)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        transform: "translateX(-50%) rotate(-1deg)",
      }}
      aria-hidden="true"
    />
  );
}

export default function BucketList() {
  const [items, setItems] = useState<ScrapbookCard[]>(INITIAL_SCRAPBOOK_ITEMS);
  const [newText, setNewText] = useState("");
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
              dateCompleted: !item.done ? "Just Now!" : undefined,
            }
          : item
      )
    );
  };

  const removeItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    const chosenColor = COLOR_OPTIONS[selectedColorIdx];
    const rotations = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-1", "-rotate-3", "rotate-3"];
    const tapes: ScrapbookCard["tapeType"][] = [
      "tape-peach",
      "tape-pink",
      "tape-yellow",
      "tape-mint",
      "pin-red",
      "pin-gold",
    ];

    const newCard: ScrapbookCard = {
      id: Date.now(),
      text,
      done: false,
      color: chosenColor.bg,
      darkColor: chosenColor.darkBg,
      tapeType: tapes[Math.floor(Math.random() * tapes.length)],
      rotation: rotations[Math.floor(Math.random() * rotations.length)],
    };

    setItems((prev) => [...prev, newCard]);
    setNewText("");
    setIsAdding(false);
  };

  const completedCount = items.filter((i) => i.done).length;
  const pct = Math.round((completedCount / (items.length || 1)) * 100);

  return (
    <section
      id="bucket-list"
      className="mx-auto w-full max-w-5xl py-12 px-2"
      aria-label="Our Scrapbook Bucket List"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col items-center text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{
            background: "var(--bg-tag)",
            border: "1px solid var(--border-glass)",
            color: "var(--text-label)",
          }}
        >
          <Compass size={12} />
          Our Bucket List
          <Sparkles size={11} />
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "var(--text-heading)",
          }}
        >
          Scrapbook of Dreams
        </h2>
        <p
          className="mt-2 text-xs sm:text-sm font-light max-w-md"
          style={{ color: "var(--text-muted)" }}
        >
          Pinned sticky notes and polaroid memories of adventures we are chasing hand in hand.
        </p>

        {/* Progress Stamp Badge */}
        <div className="mt-5 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-pink-200/50 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-300">
            <Heart size={14} className="fill-pink-500 text-pink-500" />
            <span>
              {completedCount} of {items.length} Adventures Stamped
            </span>
          </div>
          <div className="w-24 h-2 bg-pink-100 dark:bg-pink-950/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-bold text-neutral-500 tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      {/* ── Scrapbook Corkboard / Pinned Grid ── */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative"
        style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--card-shadow)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
          <AnimatePresence>
            {items.map((item, index) => {
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.3 }}
                  className="flex"
                >
                  <div
                    onClick={() => toggleDone(item.id)}
                    className={`relative w-full rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 transform ${item.rotation} hover:rotate-0 hover:scale-104 hover:z-20 hover:shadow-xl group`}
                    style={{
                      backgroundColor: item.color,
                      minHeight: "170px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={item.done}
                    aria-label={`Toggle bucket list item: ${item.text}`}
                  >
                    {/* Tape / Pin Attachment */}
                    <CardAttachment type={item.tapeType} />

                    {/* Note Content */}
                    <div className="pt-2 pr-4">
                      <p
                        className={`text-[1.05rem] font-medium leading-relaxed transition-all duration-200 ${
                          item.done
                            ? "text-neutral-400 dark:text-neutral-500 line-through decoration-rose-400 decoration-2"
                            : "text-neutral-800"
                        }`}
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {item.text}
                      </p>
                    </div>

                    {/* Bottom row: Completed Stamp & Actions */}
                    <div className="mt-4 pt-2 border-t border-black/5 flex items-center justify-between">
                      {/* Completed Rubber Stamp */}
                      {item.done ? (
                        <motion.div
                          initial={{ scale: 1.8, opacity: 0, rotate: -25 }}
                          animate={{ scale: 1, opacity: 1, rotate: -12 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border-2 border-dashed border-rose-600/80 text-rose-700 font-bold text-[11px] uppercase tracking-wider bg-rose-50/70 shadow-xs"
                        >
                          <Heart size={11} className="fill-rose-600 text-rose-600" />
                          <span>COMPLETED</span>
                        </motion.div>
                      ) : (
                        <span className="text-[10.5px] font-medium text-neutral-400 flex items-center gap-1 group-hover:text-pink-600 transition-colors">
                          <Check size={11} /> Click to stamp
                        </span>
                      )}

                      {/* Delete icon */}
                      <button
                        type="button"
                        onClick={(e) => removeItem(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-black/5"
                        title="Remove note"
                        aria-label="Remove bucket list note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Add New Sticky Note Card ── */}
          <div className="flex">
            {!isAdding ? (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full rounded-2xl p-6 min-h-[170px] border-2 border-dashed border-pink-300/70 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60 transition-all flex flex-col items-center justify-center gap-2 group text-pink-700 dark:text-pink-300"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Plus size={20} className="text-pink-600 dark:text-pink-300" />
                </div>
                <span className="text-xs font-semibold tracking-wide">
                  Pin a New Dream
                </span>
              </button>
            ) : (
              <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={addItem}
                className="w-full rounded-2xl p-4 min-h-[170px] bg-amber-50 shadow-md border border-amber-200/80 flex flex-col justify-between"
                style={{ backgroundColor: COLOR_OPTIONS[selectedColorIdx].bg }}
              >
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write an adventure to add to our scrapbook…"
                  className="w-full bg-transparent resize-none border-0 outline-hidden text-sm text-neutral-800 placeholder:text-neutral-400 h-20"
                  autoFocus
                  required
                />

                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  {/* Color selector */}
                  <div className="flex items-center gap-1">
                    {COLOR_OPTIONS.map((col, idx) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setSelectedColorIdx(idx)}
                        className={`w-4 h-4 rounded-full border border-black/20 transition-transform ${
                          selectedColorIdx === idx ? "scale-125 ring-2 ring-pink-500 ring-offset-1" : ""
                        }`}
                        style={{ backgroundColor: col.bg }}
                        title={col.name}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewText("");
                      }}
                      className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Pin Card
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
