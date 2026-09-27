"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Plane,
  Car,
  Music,
  Star,
  UtensilsCrossed,
  Sparkles,
  Flower2,
  Plus,
  Check,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BucketItem {
  id: number;
  text: string;
  done: boolean;
  Icon: LucideIcon;
}

const INITIAL_ITEMS: BucketItem[] = [
  { id: 1, text: "Watch the northern lights together",    done: false, Icon: Sparkles        },
  { id: 2, text: "Cook a 3-course dinner from scratch",  done: true,  Icon: UtensilsCrossed },
  { id: 3, text: "Visit a city neither of us has been to", done: false, Icon: Plane         },
  { id: 4, text: "Take a spontaneous road trip",         done: false, Icon: Car             },
  { id: 5, text: "Learn a dance together",               done: true,  Icon: Music           },
  { id: 6, text: "Stargaze on a blanket outside",        done: false, Icon: Star            },
];

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28 } },
  exit:    { opacity: 0, x: 12, transition: { duration: 0.2  } },
};

export default function BucketList() {
  const [items, setItems]   = useState<BucketItem[]>(INITIAL_ITEMS);
  const [newItem, setNewItem] = useState("");

  const toggle = (id: number) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    setItems((p) => [...p, { id: Date.now(), text, done: false, Icon: Flower2 }]);
    setNewItem("");
  };

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <section
      id="bucket-list"
      className="glass-card rounded-3xl flex flex-col h-full overflow-hidden"
      style={{ border: "1px solid var(--border-glass)" }}
      aria-label="Our Bucket List"
    >
      {/* Gradient accent strip */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #f9a8d4, #ec4899, #fb7185)" }}
      />

      <div className="flex flex-col gap-4 p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-[1.15rem] font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading)" }}
            >
              Our Bucket List
            </h2>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-faint)" }}>
              {completed} of {items.length} adventures ticked off
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bg-slot)", border: "1px solid var(--border-glass)" }}
            aria-hidden="true"
          >
            <Map size={16} style={{ color: "var(--text-body)" }} />
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-faint)" }}>
              Progress
            </span>
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-label)" }}>
              {pct}%
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--border-glass)" }}
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemax={items.length}
            aria-label="Bucket list progress"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #f9a8d4, #ec4899)" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* List */}
        <ul className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-60 pr-0.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-item-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  aria-pressed={item.done}
                  aria-label={`${item.done ? "Mark incomplete" : "Mark complete"}: ${item.text}`}
                >
                  {/* Check circle */}
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                    style={{
                      borderColor: item.done ? "#ec4899" : "var(--border-input)",
                      background: item.done
                        ? "linear-gradient(135deg, #f9a8d4, #ec4899)"
                        : "transparent",
                    }}
                    aria-hidden="true"
                  >
                    {item.done && (
                      <Check size={10} color="white" strokeWidth={3} />
                    )}
                  </span>

                  {/* Category icon */}
                  <span
                    className="flex-shrink-0"
                    aria-hidden="true"
                    style={{ color: item.done ? "var(--text-faint)" : "var(--text-label)" }}
                  >
                    <item.Icon size={14} strokeWidth={2} />
                  </span>

                  {/* Text */}
                  <span
                    className="text-sm font-medium leading-snug transition-all duration-200 flex-1"
                    style={{
                      color: item.done ? "var(--text-faint)" : "var(--text-body)",
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Completion badge */}
        {completed === items.length && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(249,168,212,0.15), rgba(236,72,153,0.1))",
              border: "1px solid var(--border-glass)",
            }}
          >
            <Trophy size={13} style={{ color: "#ec4899" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-body)" }}>
              All adventures complete — you two are incredible!
            </span>
          </motion.div>
        )}

        {/* Add new */}
        <div
          className="flex gap-2 pt-3"
          style={{ borderTop: "1px solid var(--border-divider)" }}
        >
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add a new adventure…"
            id="bucket-list-input"
            className="flex-1 text-sm px-3 py-2 rounded-xl outline-none transition-all duration-200"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
              color: "var(--text-heading)",
            }}
            aria-label="New bucket list item"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addItem}
            id="bucket-list-add-btn"
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
              boxShadow: "0 3px 10px rgba(236,72,153,0.28)",
            }}
            aria-label="Add bucket list item"
          >
            <Plus size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
