"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Film,
  RotateCcw,
  CloudUpload,
  SlidersHorizontal,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase, BUCKET } from "@/lib/supabase";

/* ─── Types ─────────────────────────────────────────────────── */
interface GalleryPhoto {
  name: string;
  url: string;
}

/* ─── Film filters ───────────────────────────────────────────── */
const FILM_FILTERS = [
  { name: "Natural", value: "none" },
  { name: "Velvet",  value: "sepia(0.28) saturate(1.2) contrast(1.05)" },
  { name: "Chrome",  value: "contrast(1.18) saturate(0.8) brightness(1.05)" },
  { name: "Fade",    value: "brightness(1.12) saturate(0.65) contrast(0.95)" },
  { name: "Noir",    value: "grayscale(0.8) contrast(1.2)" },
  { name: "Bloom",   value: "saturate(1.55) brightness(1.06) hue-rotate(5deg)" },
];

/* ─── Helper: base64 → Blob ──────────────────────────────────── */
function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

/* ─── Polaroid card ──────────────────────────────────────────── */
function PolaroidCard({ photo, filter }: { photo: GalleryPhoto; filter: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 120,
        background: "var(--bg-glass)",
        border: "1px solid var(--border-glass)",
        boxShadow: "0 4px 18px rgba(244,114,182,0.14)",
        padding: "8px 8px 28px",
      }}
    >
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{ aspectRatio: "1/1", background: "var(--bg-slot)" }}
      >
        <img
          src={photo.url}
          alt="Captured memory"
          className="w-full h-full object-cover"
          style={{ filter }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Photobooth() {
  const webcamRef                       = useRef<Webcam>(null);
  const [captured, setCaptured]         = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILM_FILTERS[0]);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState<"idle" | "success" | "error">("idle");
  const [gallery, setGallery]           = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [cameraError, setCameraError]   = useState(false);

  /* ── Fetch gallery on mount ─────────────────────────────────── */
  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      sortBy: { column: "created_at", order: "desc" },
      limit: 30,
    });
    if (!error && data) {
      const photos: GalleryPhoto[] = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        }));
      setGallery(photos);
    }
    setLoadingGallery(false);
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  /* ── Capture screenshot ─────────────────────────────────────── */
  const handleCapture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot({ width: 1280, height: 960 });
    if (screenshot) {
      setCaptured(screenshot);
      setSaveStatus("idle");
    }
  }, []);

  /* ── Retake ─────────────────────────────────────────────────── */
  const handleRetake = () => {
    setCaptured(null);
    setSaveStatus("idle");
  };

  /* ── Upload to Supabase ─────────────────────────────────────── */
  const handleSave = async () => {
    if (!captured) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const blob     = dataURLtoBlob(captured);
      const fileName = `${uuidv4()}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      setSaveStatus("success");
      setCaptured(null);
      await fetchGallery();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <section
      id="photobooth"
      className="glass-card rounded-3xl flex flex-col overflow-hidden"
      style={{ border: "1px solid var(--border-glass)" }}
      aria-label="Date Night Photobooth"
    >
      {/* Gradient accent strip */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #fb7185, #ec4899, #f472b6)" }}
      />

      <div className="flex flex-col gap-4 p-6">
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
              Capture a moment together
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
                  id={`filter-${f.name.toLowerCase()}`}
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
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera / Preview area */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            aspectRatio: "4/3",
            border: "2px solid",
            borderColor: "rgba(244,114,182,0.4)",
            boxShadow: "0 0 0 4px rgba(244,114,182,0.08), 0 8px 32px rgba(236,72,153,0.12)",
            background: "var(--bg-slot)",
          }}
        >
          <AnimatePresence mode="wait">
            {captured ? (
              /* Preview of captured image */
              <motion.img
                key="preview"
                src={captured}
                alt="Captured photo preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover"
                style={{ filter: activeFilter.value }}
              />
            ) : cameraError ? (
              /* Camera error state */
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col items-center justify-center gap-3"
              >
                <Camera size={36} style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
                <p className="text-xs text-center px-6" style={{ color: "var(--text-faint)" }}>
                  Camera access denied or unavailable.
                  <br />Please allow camera access and reload.
                </p>
              </motion.div>
            ) : (
              /* Live webcam feed */
              <motion.div
                key="webcam"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.95}
                  videoConstraints={{ facingMode: "user", aspectRatio: 4 / 3 }}
                  onUserMediaError={() => setCameraError(true)}
                  className="w-full h-full object-cover"
                  style={{ filter: activeFilter.value, transform: "scaleX(-1)" }}
                  mirrored
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pink vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: "radial-gradient(ellipse at center, transparent 60%, rgba(244,114,182,0.08) 100%)",
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          {!captured ? (
            /* Capture button */
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(236,72,153,0.38)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCapture}
              disabled={cameraError}
              id="photobooth-capture-btn"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
                boxShadow: "0 4px 16px rgba(236,72,153,0.28)",
              }}
              aria-label="Capture photo"
            >
              <Camera size={15} strokeWidth={2} />
              Capture
            </motion.button>
          ) : (
            <>
              {/* Retake */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRetake}
                id="photobooth-retake-btn"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300"
                style={{
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-body)",
                }}
                aria-label="Retake photo"
              >
                <RotateCcw size={14} strokeWidth={2} />
                Retake
              </motion.button>

              {/* Save Memory */}
              <motion.button
                whileHover={!saving ? { scale: 1.02, boxShadow: "0 8px 24px rgba(236,72,153,0.38)" } : {}}
                whileTap={!saving ? { scale: 0.97 } : {}}
                onClick={handleSave}
                disabled={saving}
                id="photobooth-save-btn"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-70"
                style={{
                  background: saving
                    ? "linear-gradient(135deg, #f9a8d4 0%, #f472b6 100%)"
                    : "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
                  boxShadow: "0 4px 16px rgba(236,72,153,0.28)",
                }}
                aria-label="Save memory to cloud"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CloudUpload size={14} strokeWidth={2} />
                    Save Memory
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>

        {/* Status feedback */}
        <AnimatePresence>
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 size={13} />
              Memory saved to your photobooth!
            </motion.div>
          )}
          {saveStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={13} />
              Upload failed. Check your Supabase bucket policy.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gallery strip ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <ImageIcon size={12} style={{ color: "var(--text-faint)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Our Memories
            </span>
            {!loadingGallery && (
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--bg-tag)", color: "var(--text-label)", border: "1px solid var(--border-glass)" }}
              >
                {gallery.length} photo{gallery.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingGallery ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} style={{ color: "var(--text-faint)" }} className="animate-spin" />
            </div>
          ) : gallery.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl"
              style={{
                background: "var(--bg-slot)",
                border: "1.5px dashed var(--border-dashed)",
              }}
            >
              <Camera size={20} style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                No memories yet — capture your first one!
              </p>
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(244,114,182,0.3) transparent" }}
              aria-label="Photo gallery"
            >
              {gallery.map((photo) => (
                <PolaroidCard
                  key={photo.name}
                  photo={photo}
                  filter={activeFilter.value}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
