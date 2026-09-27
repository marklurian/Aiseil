"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  Camera,
  ArrowRight,
  X,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface MemoryPolaroid {
  id: string;
  src: string;
  caption: string;
  date: string;
  location?: string;
  note?: string;
  rotation: string;
  tapeColor: string;
}

const MEMORIES: MemoryPolaroid[] = [
  {
    id: "beach-walk",
    src: "/memories/sunset_beach.jpg",
    caption: "Sunset Beach Stroll",
    date: "October 2023",
    location: "Coastline Walk",
    note: "Golden hour was breathtaking, but watching you laugh at the incoming waves was my absolute favorite part.",
    rotation: "-rotate-2",
    tapeColor: "rgba(254, 215, 170, 0.75)", // peach washi
  },
  {
    id: "cafe-date",
    src: "/memories/cafe_date.jpg",
    caption: "Sunny Morning Cafe Date",
    date: "November 2023",
    location: "Little Corner Cafe",
    note: "Two heart lattes, warm strawberry shortcake, and endless quiet conversations about our dreams.",
    rotation: "rotate-2",
    tapeColor: "rgba(251, 207, 232, 0.75)", // pink washi
  },
  {
    id: "stargazing",
    src: "/memories/stargazing.jpg",
    caption: "Stargazing & Fairy Lights",
    date: "February 2024",
    location: "Pine Ridge Overlook",
    note: "Wrapped under one big wool blanket, lantern glowing, pointing out constellations until 3 AM.",
    rotation: "-rotate-1",
    tapeColor: "rgba(221, 214, 254, 0.75)", // lilac washi
  },
  {
    id: "cherry-blossom",
    src: "/memories/cherry_blossom.jpg",
    caption: "Cherry Blossoms in Spring",
    date: "April 2024",
    location: "Sakura Garden Walk",
    note: "Pink petals raining softly everywhere. You put a little blossom in my hair and took my hand.",
    rotation: "rotate-3",
    tapeColor: "rgba(254, 205, 211, 0.75)", // rose washi
  },
  {
    id: "autumn-walk",
    src: "/memories/autumn_walk.jpg",
    caption: "Golden Autumn Afternoon",
    date: "September 2024",
    location: "Maple Park",
    note: "Crunching leaves, warm sweaters, and that cozy golden light that makes everything feel eternal.",
    rotation: "-rotate-2",
    tapeColor: "rgba(254, 240, 138, 0.75)", // yellow washi
  },
  {
    id: "road-trip",
    src: "/memories/road_trip.jpg",
    caption: "Spontaneous Mountain Road Trip",
    date: "June 2024",
    location: "Sunrise Mountain Pass",
    note: "Windows rolled down, favorite songs blasting, nowhere to be except together on the open road.",
    rotation: "rotate-1",
    tapeColor: "rgba(187, 247, 208, 0.75)", // sage washi
  },
];

export default function MemoriesGallery() {
  const [selected, setSelected] = useState<MemoryPolaroid | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      id="memories"
      className="mx-auto w-full max-w-5xl pt-10 pb-20 px-2"
      aria-label="Our Memories Gallery"
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
          <Camera size={12} />
          Polaroid Collection
          <Sparkles size={11} />
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "var(--text-heading)",
          }}
        >
          Moments Frozen in Time
        </h2>
        <p
          className="mt-2 text-xs sm:text-sm font-light max-w-md"
          style={{ color: "var(--text-muted)" }}
        >
          Scattered polaroids from our favorite dates, sunny mornings, and late-night adventures together.
        </p>

        {/* Link to Photobooth CTA */}
        <Link
          href="/photobooth"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-2xl text-pink-600 dark:text-pink-300 hover:text-pink-700 bg-pink-100/50 dark:bg-pink-950/40 border border-pink-200/60 dark:border-pink-800/40 transition-all hover:scale-103"
        >
          <Camera size={13} />
          Take new prints in Date Night Photobooth
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* ── Scattered Masonry Grid ── */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {MEMORIES.map((item, index) => {
          const isLiked = liked[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="break-inside-avoid"
            >
              <div
                onClick={() => setSelected(item)}
                className={`relative group cursor-pointer rounded-2xl bg-white dark:bg-neutral-900 transition-all duration-300 transform ${item.rotation} hover:rotate-0 hover:scale-103 hover:z-20`}
                style={{
                  padding: "12px 12px 28px",
                  border: "1px solid rgba(244, 114, 182, 0.32)",
                  boxShadow:
                    "0 14px 36px rgba(244, 114, 182, 0.16), 0 4px 14px rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* Washi Tape Strip on Top */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 rounded-xs pointer-events-none z-10"
                  style={{
                    background: item.tapeColor,
                    borderLeft: "2px dashed rgba(0,0,0,0.12)",
                    borderRight: "2px dashed rgba(0,0,0,0.12)",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                    transform: "translateX(-50%) rotate(-1deg)",
                  }}
                />

                {/* Photo Container */}
                <div className="relative w-full rounded-xl overflow-hidden aspect-[4/3] bg-pink-50/50">
                  <img
                    src={item.src}
                    alt={item.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 text-[11px] font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <Eye size={12} /> View Memory
                    </span>
                  </div>

                  {/* Little Heart Like Badge */}
                  <button
                    type="button"
                    onClick={(e) => toggleLike(item.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md flex items-center justify-center shadow-xs transition-transform active:scale-80 hover:scale-110"
                    aria-label="Like memory"
                  >
                    <Heart
                      size={13}
                      className={
                        isLiked
                          ? "text-rose-500 fill-rose-500"
                          : "text-neutral-400 dark:text-neutral-500"
                      }
                    />
                  </button>
                </div>

                {/* Polaroid Chin: Handwritten Caption & Date */}
                <div className="mt-3 px-1 flex flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className="text-base font-bold tracking-tight text-neutral-800 dark:text-neutral-100"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {item.caption}
                    </h3>
                    <span className="text-[10px] font-medium text-pink-500/80 dark:text-pink-400/80 flex-shrink-0">
                      {item.date}
                    </span>
                  </div>

                  {item.location && (
                    <div className="flex items-center gap-1 text-[10.5px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      <MapPin size={10} />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Fullscreen Polaroid Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative max-w-xl w-full bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                border: "1px solid rgba(244, 114, 182, 0.3)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors"
                aria-label="Close memory modal"
              >
                <X size={16} />
              </button>

              {/* Photo */}
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-inner">
                <img
                  src={selected.src}
                  alt={selected.caption}
                  className="w-full max-h-[58vh] object-contain"
                />
              </div>

              {/* Memory Story */}
              <div className="mt-4 flex flex-col gap-1.5 px-1">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xl font-bold text-neutral-900 dark:text-neutral-100"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {selected.caption}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-pink-500 font-semibold">
                    <Calendar size={12} />
                    <span>{selected.date}</span>
                  </div>
                </div>

                {selected.location && (
                  <p className="text-xs text-neutral-400 flex items-center gap-1">
                    <MapPin size={11} /> {selected.location}
                  </p>
                )}

                {selected.note && (
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed border-l-2 border-pink-400 pl-3 py-0.5">
                    &ldquo;{selected.note}&rdquo;
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
