"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Film, Plus, ImagePlus, SlidersHorizontal } from "lucide-react";

interface Photo {
  id: number;
  src: string;
  caption: string;
  filter: string;
}

const SAMPLE_PHOTOS: Photo[] = [
  { id: 1, src: "", caption: "Our first coffee date", filter: "sepia(0.3) saturate(1.2)" },
  { id: 2, src: "", caption: "Sunset at the beach",   filter: "saturate(1.4) brightness(1.05)" },
  { id: 3, src: "", caption: "Lazy Sunday afternoon", filter: "sepia(0.2) contrast(1.1)" },
];

const FILM_FILTERS = [
  { name: "Velvet", value: "sepia(0.28) saturate(1.2) contrast(1.05)" },
  { name: "Chrome", value: "contrast(1.18) saturate(0.8) brightness(1.05)" },
  { name: "Fade",   value: "brightness(1.12) saturate(0.65) contrast(0.95)" },
  { name: "Noir",   value: "grayscale(0.65) contrast(1.15)" },
  { name: "Bloom",  value: "saturate(1.55) brightness(1.06) hue-rotate(5deg)" },
];

function EmptySlot({ index, onClick }: { index: number; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
      style={{
        background: "var(--bg-slot)",
        border: "1.5px dashed var(--border-dashed)",
      }}
      aria-label={`Upload photo for slot ${index + 1}`}
      id={`photobooth-slot-${index}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)" }}
        aria-hidden="true"
      >
        <ImagePlus size={16} style={{ color: "var(--text-label)" }} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
        Drop a photo
      </span>
    </motion.button>
  );
}

function FilledSlot({ photo }: { photo: Photo }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.3 }}
      className="aspect-[3/4] rounded-2xl overflow-hidden relative group"
      style={{ boxShadow: "0 4px 20px rgba(244,114,182,0.14)" }}
    >
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.caption}
          className="w-full h-full object-cover"
          style={{ filter: photo.filter }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: "var(--bg-photo-fill)", filter: photo.filter }}
          aria-label={photo.caption}
        >
          <Camera size={28} style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
        </div>
      )}
      {/* Caption overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p
          className="text-[10px] font-medium text-center leading-snug px-2 py-1 rounded-lg inline-block w-full"
          style={{
            background: "rgba(0,0,0,0.28)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {photo.caption}
        </p>
      </div>
    </motion.div>
  );
}

export default function Photobooth() {
  const [photos, setPhotos]           = useState<Photo[]>(SAMPLE_PHOTOS);
  const [activeFilter, setActiveFilter] = useState(FILM_FILTERS[0]);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot]   = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => {
      const next = [...prev];
      next[activeSlot] = { ...next[activeSlot], src: url };
      return next;
    });
    e.target.value = "";
    setActiveSlot(null);
  };

  return (
    <section
      id="photobooth"
      className="glass-card rounded-3xl flex flex-col h-full overflow-hidden"
      style={{ border: "1px solid var(--border-glass)" }}
      aria-label="Date Night Photobooth"
    >
      {/* Gradient accent strip */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #fb7185, #ec4899, #f472b6)" }}
      />

      <div className="flex flex-col gap-4 p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-[1.15rem] font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading)" }}
            >
              Date Night Photobooth
            </h2>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-faint)" }}>
              {photos.filter((p) => p.src).length} of {photos.length} slots filled
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bg-slot)", border: "1px solid var(--border-glass)" }}
            aria-hidden="true"
          >
            <Film size={16} style={{ color: "var(--text-body)" }} />
          </div>
        </div>

        {/* Film filter pills */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
          <div
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
            role="radiogroup"
            aria-label="Film filter selection"
          >
            {FILM_FILTERS.map((f) => {
              const active = activeFilter.name === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setActiveFilter(f)}
                  role="radio"
                  aria-checked={active}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                  style={
                    active
                      ? {
                          background: "linear-gradient(135deg,#f9a8d4,#ec4899)",
                          color: "white",
                          boxShadow: "0 2px 8px rgba(236,72,153,0.28)",
                        }
                      : {
                          background: "var(--bg-pill-inactive)",
                          color: "var(--text-body)",
                          border: "1px solid var(--border-glass)",
                        }
                  }
                  id={`filter-${f.name.toLowerCase()}`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo strip */}
        <div className="grid grid-cols-3 gap-2.5 flex-1">
          <AnimatePresence mode="popLayout">
            {photos.map((photo, i) =>
              photo.src ? (
                <FilledSlot
                  key={photo.id}
                  photo={{ ...photo, filter: activeFilter.value }}
                />
              ) : (
                <EmptySlot key={photo.id} index={i} onClick={() => handleSlotClick(i)} />
              )
            )}
          </AnimatePresence>
        </div>

        {/* Add strip button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            setPhotos((prev) => [
              ...prev,
              { id: Date.now(), src: "", caption: "New memory", filter: activeFilter.value },
            ])
          }
          id="photobooth-add-strip-btn"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            background: "var(--bg-input)",
            border: "1px dashed var(--border-dashed)",
            color: "var(--text-body)",
          }}
          aria-label="Add another photo slot"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add to Strip
        </motion.button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </section>
  );
}
