"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Film, RotateCcw, CloudUpload, SlidersHorizontal,
  ImageIcon, Loader2, CheckCircle2, AlertCircle, Timer,
} from "lucide-react";
import { supabase, BUCKET } from "@/lib/supabase";

/* ─── Personalise ─────────────────────────────────────────────── */
const STRIP_NAMES = "Mark + Aiseil";
const STRIP_DATE  = "Feb 7, 2020";

/* ─── Constants ───────────────────────────────────────────────── */
const TOTAL_SHOTS = 4;
const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FILM_FILTERS = [
  { name: "Natural", value: "none" },
  { name: "Velvet",  value: "sepia(0.28) saturate(1.2) contrast(1.05)" },
  { name: "Chrome",  value: "contrast(1.18) saturate(0.8) brightness(1.05)" },
  { name: "Fade",    value: "brightness(1.12) saturate(0.65) contrast(0.95)" },
  { name: "Noir",    value: "grayscale(0.8) contrast(1.2)" },
  { name: "Bloom",   value: "saturate(1.55) brightness(1.06) hue-rotate(5deg)" },
];

/* ─── Types ───────────────────────────────────────────────────── */
interface GalleryPhoto { name: string; url: string; }
type Phase = "idle" | "shooting" | "rendering" | "preview" | "saving";

/* ─── Utilities ───────────────────────────────────────────────── */
const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res) => {
    const el = new Image();
    el.onload = () => res(el);
    el.src = src;
  });
}

async function renderStrip(captures: string[], filter: string): Promise<string> {
  const W    = 360;
  const PAD  = 16;
  const GAP  = 8;
  const PW   = W - PAD * 2;
  const PH   = Math.round(PW * 0.75);
  const FOOT = 108;
  const H    = PAD + TOTAL_SHOTS * (PH + GAP) - GAP + FOOT;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  /* White background */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  /* Photos */
  for (let i = 0; i < Math.min(captures.length, TOTAL_SHOTS); i++) {
    const img = await loadImg(captures[i]);
    const y   = PAD + i * (PH + GAP);
    if (filter && filter !== "none") ctx.filter = filter;
    ctx.drawImage(img, PAD, y, PW, PH);
    ctx.filter = "none";
  }

  /* Footer */
  const footY = PAD + TOTAL_SHOTS * (PH + GAP) - GAP + 18;

  /* Pink separator line */
  ctx.strokeStyle = "rgba(236,72,153,0.4)";
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, footY);
  ctx.lineTo(W / 2 + 40, footY);
  ctx.stroke();

  /* Names */
  ctx.fillStyle   = "#1a1a1a";
  ctx.font        = `bold 18px Georgia, serif`;
  ctx.textAlign   = "center";
  ctx.fillText(STRIP_NAMES, W / 2, footY + 28);

  /* Date */
  ctx.fillStyle   = "#9ca3af";
  ctx.font        = `11px Arial, sans-serif`;
  ctx.fillText(STRIP_DATE.toUpperCase(), W / 2, footY + 50);

  return canvas.toDataURL("image/jpeg", 0.95);
}

/* ─── Saved strip polaroid card ───────────────────────────────── */
function StripCard({ photo }: { photo: GalleryPhoto }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: CUBIC }}
      className="flex-shrink-0 rounded-xl overflow-hidden cursor-pointer"
      style={{
        width: 76,
        padding: "6px 6px 22px",
        background: "#ffffff",
        boxShadow: "0 6px 20px rgba(244,114,182,0.2)",
        border: "1px solid rgba(244,114,182,0.18)",
      }}
    >
      <img src={photo.url} alt="Saved photo strip" className="w-full rounded-lg object-cover" />
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function Photobooth() {
  const webcamRef       = useRef<Webcam>(null);
  const abortRef        = useRef(false);
  const filterRef       = useRef(FILM_FILTERS[0]);

  const [phase, setPhase]               = useState<Phase>("idle");
  const [countdown, setCountdown]       = useState(3);
  const [shotNum, setShotNum]           = useState(1);
  const [flashOn, setFlashOn]           = useState(false);
  const [captures, setCaptures]         = useState<string[]>([]);
  const [stripUrl, setStripUrl]         = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILM_FILTERS[0]);
  const [gallery, setGallery]           = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [cameraReady, setCameraReady]   = useState(false);
  const [cameraError, setCameraError]   = useState(false);
  const [saveStatus, setSaveStatus]     = useState<"idle" | "success" | "error">("idle");

  /* ── Gallery ──────────────────────────────────────────────────── */
  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      sortBy: { column: "created_at", order: "desc" },
      limit: 30,
    });
    if (!error && data) {
      setGallery(
        data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            name: f.name,
            url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
          }))
      );
    }
    setLoadingGallery(false);
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  /* ── Session: async countdown + capture loop ─────────────────── */
  const startSession = useCallback(async () => {
    abortRef.current = false;
    const shots: string[] = [];
    setCaptures([]);
    setStripUrl(null);
    setSaveStatus("idle");
    setPhase("shooting");

    for (let s = 1; s <= TOTAL_SHOTS; s++) {
      if (abortRef.current) return;
      setShotNum(s);

      /* Countdown 3 → 1 */
      for (let c = 3; c >= 1; c--) {
        if (abortRef.current) return;
        setCountdown(c);
        await sleep(1000);
      }
      if (abortRef.current) return;
      setCountdown(0);

      /* Snap */
      const snap = webcamRef.current?.getScreenshot({ width: 1280, height: 960 });
      if (snap) {
        shots.push(snap);
        setCaptures([...shots]);
      }

      /* White flash */
      setFlashOn(true);
      await sleep(360);
      setFlashOn(false);

      /* Brief pause between shots */
      if (s < TOTAL_SHOTS) await sleep(900);
    }

    if (abortRef.current) return;

    /* Render composite strip */
    setPhase("rendering");
    const url = await renderStrip(shots, filterRef.current.value);
    if (abortRef.current) return;
    setStripUrl(url);
    setPhase("preview");
  }, []);

  /* ── Save strip to Supabase ───────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!stripUrl) return;
    setPhase("saving");
    try {
      const blob = dataURLtoBlob(stripUrl);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${uuidv4()}.jpg`, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      setSaveStatus("success");
      setStripUrl(null);
      setCaptures([]);
      setPhase("idle");
      await fetchGallery();
    } catch {
      setSaveStatus("error");
      setPhase("preview");
    }
  }, [stripUrl, fetchGallery]);

  /* ── Retake / Abort ───────────────────────────────────────────── */
  const handleRetake = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setCaptures([]);
    setStripUrl(null);
    setSaveStatus("idle");
    setCountdown(3);
  }, []);

  /* ── Filter change ────────────────────────────────────────────── */
  const handleFilterChange = (f: (typeof FILM_FILTERS)[0]) => {
    setActiveFilter(f);
    filterRef.current = f;
  };

  const isShooting = phase === "shooting" || phase === "rendering";
  const isPreview  = phase === "preview"  || phase === "saving";

  /* ─────────────────────────────────────────────────────────────── */
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
        style={{ background: "linear-gradient(90deg,#fb7185,#ec4899,#f472b6)" }}
      />

      <div className="flex flex-col gap-4 p-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-[1.15rem] font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading)" }}
            >
              Date Night Photobooth
            </h2>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-faint)" }}>
              {phase === "rendering"
                ? "Developing your strip…"
                : isShooting
                  ? `Shot ${shotNum} of ${TOTAL_SHOTS} — smile!`
                  : isPreview
                    ? "Your strip is ready to save!"
                    : "4 auto-shots · pick a filter first"}
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

        {/* ── Film filter pills ───────────────────────────────────── */}
        {phase === "idle" && (
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }} role="radiogroup" aria-label="Film filter">
              {FILM_FILTERS.map((f) => {
                const active = activeFilter.name === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => handleFilterChange(f)}
                    role="radio"
                    aria-checked={active}
                    id={`filter-${f.name.toLowerCase()}`}
                    className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                    style={
                      active
                        ? { background: "linear-gradient(135deg,#f9a8d4,#ec4899)", color: "#fff", boxShadow: "0 2px 8px rgba(236,72,153,0.28)" }
                        : { background: "var(--bg-pill-inactive)", color: "var(--text-body)", border: "1px solid var(--border-glass)" }
                    }
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main display ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isPreview && stripUrl ? (

            /* ── Strip preview ────────────────────────────────────── */
            <motion.div
              key="strip"
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.45, ease: CUBIC }}
              className="flex justify-center py-2"
            >
              <motion.div
                animate={{ rotate: [-0.8, 0.6, -0.4, 0.8, 0], y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                style={{
                  padding: 10,
                  paddingBottom: 32,
                  background: "#ffffff",
                  borderRadius: 16,
                  boxShadow: "0 16px 48px rgba(236,72,153,0.22), 0 4px 16px rgba(0,0,0,0.1)",
                  maxWidth: 230,
                  transform: "rotate(-1deg)",
                }}
              >
                <img
                  src={stripUrl}
                  alt="Photo booth strip preview"
                  className="w-full rounded-lg"
                />
              </motion.div>
            </motion.div>

          ) : (

            /* ── Webcam + shot grid ───────────────────────────────── */
            <motion.div
              key="cam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-2"
            >
              {/* Camera viewport */}
              <div
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "4/3",
                  border: "2px solid rgba(244,114,182,0.42)",
                  boxShadow: "0 0 0 4px rgba(244,114,182,0.07)",
                  background: "var(--bg-slot)",
                }}
              >
                {cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <Camera size={30} strokeWidth={1.5} style={{ color: "var(--text-faint)" }} />
                    <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
                      Camera access denied — please allow and reload.
                    </p>
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.95}
                    videoConstraints={{ facingMode: "user", aspectRatio: 4 / 3 }}
                    onUserMediaError={() => setCameraError(true)}
                    onUserMedia={() => setCameraReady(true)}
                    className="w-full h-full object-cover"
                    style={{ filter: activeFilter.value }}
                    mirrored
                  />
                )}

                {/* Shot counter badge */}
                {isShooting && phase !== "rendering" && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-[11px] font-bold tabular-nums"
                    style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(8px)" }}
                  >
                    {shotNum}/{TOTAL_SHOTS}
                  </div>
                )}

                {/* Countdown number */}
                <AnimatePresence>
                  {phase === "shooting" && countdown > 0 && (
                    <motion.div
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.35, ease: CUBIC }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      {/* Soft ring */}
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" as const }}
                        className="absolute w-24 h-24 rounded-full"
                        style={{ border: "3px solid rgba(255,255,255,0.6)" }}
                      />
                      <span
                        className="relative text-8xl font-bold text-white"
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          textShadow: "0 4px 32px rgba(0,0,0,0.5)",
                        }}
                      >
                        {countdown}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* White flash */}
                <AnimatePresence>
                  {flashOn && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.36 }}
                      className="absolute inset-0 bg-white pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Rendering overlay */}
                {phase === "rendering" && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(6px)" }}
                  >
                    <Loader2 size={30} className="animate-spin" style={{ color: "#ec4899" }} />
                    <span className="text-[13px] font-semibold" style={{ color: "#ec4899" }}>
                      Developing film…
                    </span>
                  </div>
                )}

                {/* Pink vignette */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(244,114,182,0.09) 100%)" }}
                />
              </div>

              {/* 4-shot thumbnail grid — appears while shooting */}
              {(isShooting || captures.length > 0) && (
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${TOTAL_SHOTS}, 1fr)` }}
                >
                  {Array.from({ length: TOTAL_SHOTS }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden relative"
                      style={{
                        aspectRatio: "4/3",
                        background: "var(--bg-slot)",
                        border: captures[i]
                          ? "1.5px solid rgba(244,114,182,0.35)"
                          : "1.5px dashed var(--border-dashed)",
                      }}
                    >
                      {captures[i] ? (
                        <motion.img
                          initial={{ opacity: 0, scale: 1.06 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          src={captures[i]}
                          alt={`Shot ${i + 1}`}
                          className="w-full h-full object-cover"
                          style={{ filter: activeFilter.value }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span
                            className="text-[10px] font-bold tabular-nums"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {i + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action buttons ──────────────────────────────────────── */}
        <div className="flex gap-2.5">
          {phase === "idle" && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(236,72,153,0.38)" }}
              whileTap={{ scale: 0.97 }}
              onClick={startSession}
              disabled={cameraError || !cameraReady}
              id="photobooth-start-btn"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#f472b6 0%,#ec4899 100%)",
                boxShadow: "0 4px 16px rgba(236,72,153,0.28)",
              }}
              aria-label="Start photo session"
            >
              <Camera size={15} strokeWidth={2} />
              {cameraReady ? "Start Session" : "Loading camera…"}
            </motion.button>
          )}

          {isShooting && (
            <>
              <div
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "var(--bg-slot)", color: "var(--text-faint)", border: "1px solid var(--border-glass)" }}
              >
                <Timer size={14} />
                {phase === "rendering" ? "Developing…" : "Get ready!"}
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleRetake}
                id="photobooth-abort-btn"
                className="px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-body)",
                }}
                aria-label="Cancel session"
              >
                <RotateCcw size={14} strokeWidth={2} />
              </motion.button>
            </>
          )}

          {isPreview && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRetake}
                disabled={phase === "saving"}
                id="photobooth-retake-btn"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-body)",
                }}
                aria-label="Retake photos"
              >
                <RotateCcw size={14} strokeWidth={2} />
                Retake
              </motion.button>
              <motion.button
                whileHover={phase !== "saving" ? { scale: 1.02, boxShadow: "0 8px 24px rgba(236,72,153,0.38)" } : {}}
                whileTap={phase !== "saving" ? { scale: 0.97 } : {}}
                onClick={handleSave}
                disabled={phase === "saving"}
                id="photobooth-save-btn"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#f472b6 0%,#ec4899 100%)",
                  boxShadow: "0 4px 16px rgba(236,72,153,0.28)",
                  opacity: phase === "saving" ? 0.75 : 1,
                }}
                aria-label="Save photo strip"
              >
                {phase === "saving"
                  ? (<><Loader2 size={14} className="animate-spin" />Saving…</>)
                  : (<><CloudUpload size={14} strokeWidth={2} />Save Strip</>)
                }
              </motion.button>
            </>
          )}
        </div>

        {/* ── Status feedback ─────────────────────────────────────── */}
        <AnimatePresence>
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 size={13} />
              Strip saved to your memories!
            </motion.div>
          )}
          {saveStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={13} />
              Upload failed — check your Supabase bucket policy.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Saved strips gallery ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <ImageIcon size={12} style={{ color: "var(--text-faint)" }} />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-faint)" }}
            >
              Saved Strips
            </span>
            {!loadingGallery && (
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--bg-tag)", color: "var(--text-label)", border: "1px solid var(--border-glass)" }}
              >
                {gallery.length}
              </span>
            )}
          </div>

          {loadingGallery ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-faint)" }} />
            </div>
          ) : gallery.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-5 rounded-2xl"
              style={{ background: "var(--bg-slot)", border: "1.5px dashed var(--border-dashed)" }}
            >
              <Camera size={18} strokeWidth={1.5} style={{ color: "var(--text-faint)" }} />
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                No strips yet — start your first session!
              </p>
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(244,114,182,0.3) transparent" }}
              aria-label="Saved photo strips gallery"
            >
              {gallery.map((p) => (
                <StripCard key={p.name} photo={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
