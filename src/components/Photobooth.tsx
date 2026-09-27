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
  Download,
  SlidersHorizontal,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Timer,
  Layout,
  X,
  Eye,
  Heart,
  Sparkles,
  Palette,
  Type,
} from "lucide-react";
import { supabase, BUCKET } from "@/lib/supabase";

/* ─── Personalisation Defaults ─────────────────────────────────── */
const DEFAULT_NAMES = "Mark + Aiseil";
const DEFAULT_DATE = "02.07.2020";
const DEFAULT_SUBTITLE = "OUR FOREVER";
const DEFAULT_QUOTE = "Thank you for your love and support";

/* ─── Paper Color Presets ─────────────────────────────────────── */
export const PAPER_PRESETS = [
  { name: "Cream", hex: "#faf7f2", label: "Warm Cream" },
  { name: "White", hex: "#ffffff", label: "Classic White" },
  { name: "Blush", hex: "#fdf0f5", label: "Blush Pink" },
  { name: "Peach", hex: "#fff4ed", label: "Soft Peach" },
  { name: "Sage", hex: "#f1f5ee", label: "Matcha Sage" },
  { name: "Lavender", hex: "#f5f2fa", label: "Muted Lavender" },
  { name: "Noir", hex: "#1c1917", label: "Midnight Noir" },
];

/* ─── Constants ───────────────────────────────────────────────── */
const TOTAL_SHOTS = 4;
const CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type TemplateType = "postcard" | "strip";

const FILM_FILTERS = [
  { name: "Natural", value: "none" },
  { name: "Velvet", value: "sepia(0.28) saturate(1.2) contrast(1.05)" },
  { name: "Chrome", value: "contrast(1.18) saturate(0.8) brightness(1.05)" },
  { name: "Fade", value: "brightness(1.12) saturate(0.65) contrast(0.95)" },
  { name: "Noir", value: "grayscale(0.85) contrast(1.2)" },
  { name: "Bloom", value: "saturate(1.55) brightness(1.06) hue-rotate(5deg)" },
];

/* ─── Types ───────────────────────────────────────────────────── */
interface GalleryPhoto {
  name: string;
  url: string;
  createdAt?: string | null;
}

type Phase = "idle" | "shooting" | "rendering" | "preview" | "saving";

/* ─── Utilities ───────────────────────────────────────────────── */
const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function isDarkColor(color: string): boolean {
  const c = color.replace("#", "");
  let r = 255;
  let g = 255;
  let b = 255;
  if (c.length === 3) {
    r = parseInt(c[0] + c[0], 16);
    g = parseInt(c[1] + c[1], 16);
    b = parseInt(c[2] + c[2], 16);
  } else if (c.length === 6) {
    r = parseInt(c.slice(0, 2), 16);
    g = parseInt(c.slice(2, 4), 16);
    b = parseInt(c.slice(4, 6), 16);
  }
  return 0.299 * r + 0.587 * g + 0.114 * b < 135;
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => res(el);
    el.onerror = (e) => rej(e);
    el.src = src;
  });
}

function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function playShutterSound() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(820, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // AudioContext blocked or unsupported, silent fallback
  }
}

/**
 * Ensures Google Fonts (Alex Brush and Cormorant Garamond) are in memory
 * using native FontFace API before drawing to canvas.
 */
async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    const alexBrush = new FontFace(
      "Alex Brush",
      "url(https://fonts.gstatic.com/s/alexbrush/v23/SZc83FzrJKuqFbwMKk6EtUI.ttf)"
    );
    await alexBrush.load();
    document.fonts.add(alexBrush);
  } catch {}

  try {
    const cormorant = new FontFace(
      "Cormorant Garamond",
      "url(https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnM.ttf)",
      { weight: "600" }
    );
    await cormorant.load();
    document.fonts.add(cormorant);
  } catch {}

  try {
    await document.fonts.ready;
  } catch {}
}

/**
 * Draws an image with object-fit: cover center crop into (x, y, w, h)
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Dynamically wraps custom quote text to fit note card width with optimal font size
 */
function wrapQuoteText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): { lines: string[]; fontSize: number; lineHeight: number } {
  const candidateSizes = [46, 42, 38, 34, 30, 26, 22];

  for (const fontSize of candidateSizes) {
    ctx.font = `400 ${fontSize}px 'Alex Brush', 'Dancing Script', 'Great Vibes', 'Brush Script MT', cursive`;
    const paragraphs = text.split("\n");
    const lines: string[] = [];

    for (const p of paragraphs) {
      const words = p.trim().split(/\s+/);
      if (!words[0]) continue;
      let cur = words[0];

      for (let i = 1; i < words.length; i++) {
        const w = words[i];
        if (ctx.measureText(cur + " " + w).width <= maxWidth) {
          cur += " " + w;
        } else {
          lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
    }

    const lineHeight = Math.round(fontSize * 1.15);
    const totalHeight = lines.length * lineHeight;

    if (lines.length <= 4 && totalHeight <= 170) {
      return { lines: lines.length > 0 ? lines : [text], fontSize, lineHeight };
    }
  }

  const fontSize = 20;
  const lineHeight = 24;
  return { lines: [text], fontSize, lineHeight };
}

/* ─── Canvas Compositors ──────────────────────────────────────── */

/**
 * Template A: Postcard Print (Left layout from reference image)
 * 1 Big Hero Photo + 3 Mini Photos + Rotated Vertical Names + Fully Custom Calligraphy Love Note
 */
async function renderPostcardLayout(
  captures: string[],
  filter: string,
  customQuote: string,
  paperColor: string
): Promise<string> {
  await ensureFontsLoaded();

  const W = 1200;
  const H = 800;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const dark = isDarkColor(paperColor);

  // 1. Paper background
  ctx.fillStyle = paperColor || "#faf7f2";
  ctx.fillRect(0, 0, W, H);

  // Subtle interior paper border
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // 2. Left vertical margin rotated text: "MARK + AISEIL"
  ctx.save();
  ctx.translate(46, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = dark ? "#f5f5f4" : "#1e1e1e";
  ctx.font = "600 19px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.26em";
  }
  ctx.fillText(DEFAULT_NAMES.toUpperCase(), 0, 0);
  ctx.restore();

  // 3. Main photo content bounds
  const contentLeft = 92;
  const contentRight = W - 44; // 1156
  const totalContentW = contentRight - contentLeft; // 1064

  // Top Section:
  const heroW = 676;
  const heroH = 448;
  const topY = 44;

  if (captures[0]) {
    const heroImg = await loadImg(captures[0]);
    if (filter && filter !== "none") ctx.filter = filter;
    drawCoverImage(ctx, heroImg, contentLeft, topY, heroW, heroH);
    ctx.filter = "none";
  }

  // Right Note Card Area (Top Right)
  const noteLeft = contentLeft + heroW; // 768
  const noteW = contentRight - noteLeft; // 388
  const noteCenterX = noteLeft + noteW / 2;

  // Fully custom calligraphy script quote
  const quoteText = customQuote.trim() || DEFAULT_QUOTE;
  const { lines, fontSize, lineHeight } = wrapQuoteText(ctx, quoteText, noteW - 48);

  ctx.fillStyle = dark ? "#fafaf9" : "#2a2827";
  ctx.font = `400 ${fontSize}px 'Alex Brush', 'Dancing Script', 'Great Vibes', 'Brush Script MT', cursive`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }

  const quoteBlockHeight = (lines.length - 1) * lineHeight;
  const quoteStartY = 200 - quoteBlockHeight / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, noteCenterX, quoteStartY + idx * lineHeight);
  });

  // Thin minimalist horizontal divider
  ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.28)" : "rgba(100, 100, 100, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(noteCenterX - 45, 298);
  ctx.lineTo(noteCenterX + 45, 298);
  ctx.stroke();

  // Date
  ctx.fillStyle = dark ? "#d6d3d1" : "#4a4744";
  ctx.font = "500 14px 'Cormorant Garamond', 'Playfair Display', serif";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.22em";
  }
  ctx.fillText(DEFAULT_DATE, noteCenterX, 332);

  // Subtitle / Location
  ctx.fillStyle = dark ? "#a8a29e" : "#5c5854";
  ctx.font = "500 13px 'Cormorant Garamond', 'Playfair Display', serif";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.25em";
  }
  ctx.fillText(DEFAULT_SUBTITLE, noteCenterX, 358);

  // 4. Bottom row: 3 smaller landscape photos
  const bottomY = 512;
  const bottomH = 244;
  const gap = 16;
  const miniW = (totalContentW - gap * 2) / 3; // 344

  for (let i = 1; i < Math.min(captures.length, 4); i++) {
    const miniImg = await loadImg(captures[i]);
    const miniX = contentLeft + (i - 1) * (miniW + gap);
    if (filter && filter !== "none") ctx.filter = filter;
    drawCoverImage(ctx, miniImg, miniX, bottomY, miniW, bottomH);
    ctx.filter = "none";
  }

  return canvas.toDataURL("image/jpeg", 0.96);
}

/**
 * Template B: Classic Film Strip (Right layout from reference image)
 * 4 Stacked Photos + Minimalist Footer Card with customizable paper color
 */
async function renderStripLayout(
  captures: string[],
  filter: string,
  paperColor: string
): Promise<string> {
  await ensureFontsLoaded();

  const W = 460;
  const PAD_X = 26;
  const PAD_TOP = 26;
  const GAP = 12;
  const PW = W - PAD_X * 2; // 408
  const PH = Math.round(PW * 0.72); // ~294
  const FOOTER_H = 140;
  const H = PAD_TOP + TOTAL_SHOTS * (PH + GAP) - GAP + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const dark = isDarkColor(paperColor);

  // Paper background
  ctx.fillStyle = paperColor || "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Photos
  for (let i = 0; i < Math.min(captures.length, TOTAL_SHOTS); i++) {
    const img = await loadImg(captures[i]);
    const y = PAD_TOP + i * (PH + GAP);
    if (filter && filter !== "none") ctx.filter = filter;
    drawCoverImage(ctx, img, PAD_X, y, PW, PH);
    ctx.filter = "none";
  }

  // Footer area
  const footY = PAD_TOP + TOTAL_SHOTS * (PH + GAP) - GAP + 24;

  // Couple names in elegant serif
  ctx.fillStyle = dark ? "#fafaf9" : "#1e1e1e";
  ctx.font = "600 20px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.22em";
  }
  ctx.fillText(DEFAULT_NAMES.toUpperCase(), W / 2, footY + 22);

  // Delicate divider line
  ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.28)" : "rgba(100, 100, 100, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, footY + 42);
  ctx.lineTo(W / 2 + 40, footY + 42);
  ctx.stroke();

  // Date
  ctx.fillStyle = dark ? "#d6d3d1" : "#525252";
  ctx.font = "500 13px 'Cormorant Garamond', 'Playfair Display', serif";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.22em";
  }
  ctx.fillText(DEFAULT_DATE, W / 2, footY + 68);

  // Subtitle
  ctx.fillStyle = dark ? "#a8a29e" : "#6b7280";
  ctx.font = "500 12px 'Cormorant Garamond', 'Playfair Display', serif";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.25em";
  }
  ctx.fillText(DEFAULT_SUBTITLE, W / 2, footY + 88);

  return canvas.toDataURL("image/jpeg", 0.96);
}

/* ─── Saved Strip/Card Polaroid Thumbnail ───────────────────────── */
function GalleryItemCard({
  photo,
  onClick,
}: {
  photo: GalleryPhoto;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex-shrink-0 text-left rounded-xl overflow-hidden cursor-pointer transition-shadow"
      style={{
        width: 88,
        padding: "6px 6px 18px",
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(244,114,182,0.18), 0 2px 6px rgba(0,0,0,0.06)",
        border: "1px solid rgba(244,114,182,0.22)",
      }}
      aria-label={`View photo ${photo.name}`}
    >
      <div className="w-full rounded-lg overflow-hidden bg-rose-50/50">
        <img
          src={photo.url}
          alt="Saved memory print"
          className="w-full object-cover rounded-lg"
          loading="lazy"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-center">
        <span className="text-[9px] font-medium text-neutral-400 truncate tracking-wider">
          MEMORY
        </span>
      </div>
    </motion.button>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function Photobooth() {
  const webcamRef = useRef<Webcam>(null);
  const abortRef = useRef(false);
  const filterRef = useRef(FILM_FILTERS[0]);
  const templateRef = useRef<TemplateType>("postcard");
  const quoteRef = useRef(DEFAULT_QUOTE);
  const paperColorRef = useRef("#faf7f2");
  const quoteDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [template, setTemplate] = useState<TemplateType>("postcard");
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [shotNum, setShotNum] = useState(1);
  const [flashOn, setFlashOn] = useState(false);
  const [captures, setCaptures] = useState<string[]>([]);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILM_FILTERS[0]);
  const [paperColor, setPaperColor] = useState("#faf7f2");
  const [customQuote, setCustomQuote] = useState(DEFAULT_QUOTE);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  /* Preload Google Fonts on mount */
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  /* Sync refs */
  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  useEffect(() => {
    filterRef.current = activeFilter;
  }, [activeFilter]);

  useEffect(() => {
    quoteRef.current = customQuote;
  }, [customQuote]);

  useEffect(() => {
    paperColorRef.current = paperColor;
  }, [paperColor]);

  /* ── Gallery Fetch ───────────────────────────────────────────── */
  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
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
              createdAt: f.created_at,
            }))
        );
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  /* ── Render function ─────────────────────────────────────────── */
  const doRender = useCallback(
    async (
      shots: string[],
      templ: TemplateType,
      filt: string,
      quote: string,
      color: string
    ) => {
      if (templ === "postcard") {
        return await renderPostcardLayout(shots, filt, quote, color);
      } else {
        return await renderStripLayout(shots, filt, color);
      }
    },
    []
  );

  /* ── Switch Template in Preview ──────────────────────────────── */
  const handleSwitchTemplate = async (newTempl: TemplateType) => {
    if (captures.length < TOTAL_SHOTS) return;
    setTemplate(newTempl);
    templateRef.current = newTempl;
    setPhase("rendering");
    const url = await doRender(
      captures,
      newTempl,
      filterRef.current.value,
      quoteRef.current,
      paperColorRef.current
    );
    setRenderedUrl(url);
    setPhase("preview");
  };

  /* ── Switch Paper Color ──────────────────────────────────────── */
  const handlePaperColorChange = async (color: string) => {
    setPaperColor(color);
    paperColorRef.current = color;
    if (phase === "preview" && captures.length === TOTAL_SHOTS) {
      const url = await doRender(
        captures,
        templateRef.current,
        filterRef.current.value,
        quoteRef.current,
        color
      );
      setRenderedUrl(url);
    }
  };

  /* ── Custom Quote Change with Debounced Re-render ────────────── */
  const handleQuoteChange = (val: string) => {
    setCustomQuote(val);
    quoteRef.current = val;
    if (phase === "preview" && captures.length === TOTAL_SHOTS && template === "postcard") {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
      quoteDebounceRef.current = setTimeout(async () => {
        const url = await doRender(
          captures,
          "postcard",
          filterRef.current.value,
          val,
          paperColorRef.current
        );
        setRenderedUrl(url);
      }, 260);
    }
  };

  /* ── Session: 4 auto-shots sequence ──────────────────────────── */
  const startSession = useCallback(async () => {
    abortRef.current = false;
    const shots: string[] = [];
    setCaptures([]);
    setRenderedUrl(null);
    setSaveStatus("idle");
    setPhase("shooting");

    for (let s = 1; s <= TOTAL_SHOTS; s++) {
      if (abortRef.current) return;
      setShotNum(s);

      /* 3-second countdown */
      for (let c = 3; c >= 1; c--) {
        if (abortRef.current) return;
        setCountdown(c);
        await sleep(1000);
      }
      if (abortRef.current) return;
      setCountdown(0);

      /* Snap photo */
      playShutterSound();
      const snap = webcamRef.current?.getScreenshot({ width: 1280, height: 960 });
      if (snap) {
        shots.push(snap);
        setCaptures([...shots]);
      }

      /* Shutter Flash */
      setFlashOn(true);
      await sleep(340);
      setFlashOn(false);

      /* Brief breath between shots */
      if (s < TOTAL_SHOTS) await sleep(900);
    }

    if (abortRef.current) return;

    /* Render composite */
    setPhase("rendering");
    const url = await doRender(
      shots,
      templateRef.current,
      filterRef.current.value,
      quoteRef.current,
      paperColorRef.current
    );
    if (abortRef.current) return;
    setRenderedUrl(url);
    setPhase("preview");
  }, [doRender]);

  /* ── Save to Supabase ─────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!renderedUrl) return;
    setPhase("saving");
    try {
      const blob = dataURLtoBlob(renderedUrl);
      const filename = `${templateRef.current}-${uuidv4()}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, blob, { contentType: "image/jpeg", upsert: false });

      if (error) throw error;
      setSaveStatus("success");
      await fetchGallery();
    } catch {
      setSaveStatus("error");
    } finally {
      setPhase("preview");
    }
  }, [renderedUrl, fetchGallery]);

  /* ── Download direct JPEG ────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!renderedUrl) return;
    const filename = `aiseil-photobooth-${template}-${new Date().toISOString().slice(0, 10)}.jpg`;
    downloadImage(renderedUrl, filename);
  }, [renderedUrl, template]);

  /* ── Retake ──────────────────────────────────────────────────── */
  const handleRetake = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setCaptures([]);
    setRenderedUrl(null);
    setSaveStatus("idle");
    setCountdown(3);
  }, []);

  /* ── Filter change ────────────────────────────────────────────── */
  const handleFilterChange = (f: (typeof FILM_FILTERS)[0]) => {
    setActiveFilter(f);
    filterRef.current = f;
  };

  const isShooting = phase === "shooting" || phase === "rendering";
  const isPreview = phase === "preview" || phase === "saving";

  return (
    <>
      <section
        id="photobooth"
        className="glass-card rounded-3xl flex flex-col overflow-hidden"
        style={{ border: "1px solid var(--border-glass)" }}
        aria-label="Date Night Photobooth"
      >
        {/* Top gradient accent line */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg,#fb7185,#ec4899,#f472b6)" }}
        />

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-[1.2rem] font-bold leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-heading)" }}
                >
                  Date Night Photobooth
                </h2>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--bg-tag)",
                    color: "var(--text-label)",
                    border: "1px solid var(--border-glass)",
                  }}
                >
                  <Sparkles size={10} /> 4-Shot Studio
                </span>
              </div>
              <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-faint)" }}>
                {phase === "rendering"
                  ? "Developing high-res print…"
                  : isShooting
                  ? `Shot ${shotNum} of ${TOTAL_SHOTS} — smile & hold pose!`
                  : isPreview
                  ? "Customize paper color, edit custom quote, download, or save to memories."
                  : "Choose Postcard or Strip layout · 4 automatic snaps"}
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

          {/* ── Controls Row (Idle Setup) ─────────────────────────── */}
          {phase === "idle" && (
            <div className="flex flex-col gap-3">
              {/* Layout Switcher */}
              <div className="flex items-center justify-between gap-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-pink-200/30">
                <span className="text-[11px] font-semibold pl-2 flex items-center gap-1.5 text-pink-700 dark:text-pink-300">
                  <Layout size={12} />
                  Print Layout:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setTemplate("postcard")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      template === "postcard"
                        ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-300 hover:text-pink-500"
                    }`}
                  >
                    <span>🖼️</span> Postcard Collage
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate("strip")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      template === "strip"
                        ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-300 hover:text-pink-500"
                    }`}
                  >
                    <span>🎞️</span> Classic Strip
                  </button>
                </div>
              </div>

              {/* Paper Color Bar */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-pink-50/40 dark:bg-white/5 border border-pink-200/20">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300 flex-shrink-0">
                  <Palette size={12} />
                  Paper Color:
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1" style={{ scrollbarWidth: "none" }}>
                  {PAPER_PRESETS.map((p) => {
                    const active = paperColor.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => handlePaperColorChange(p.hex)}
                        title={p.label}
                        className={`relative w-6 h-6 rounded-full flex-shrink-0 transition-transform ${
                          active ? "scale-115 ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900" : "hover:scale-105 border border-neutral-300/40"
                        }`}
                        style={{ backgroundColor: p.hex }}
                      />
                    );
                  })}
                  {/* Custom color picker */}
                  <label
                    title="Choose custom paper color"
                    className="relative w-6 h-6 rounded-full flex-shrink-0 cursor-pointer overflow-hidden border border-neutral-300/60 hover:scale-105 transition-transform flex items-center justify-center bg-gradient-to-tr from-rose-200 via-pink-300 to-amber-100"
                  >
                    <input
                      type="color"
                      value={paperColor}
                      onChange={(e) => handlePaperColorChange(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                    <Palette size={10} className="text-neutral-700 pointer-events-none" />
                  </label>
                </div>
              </div>

              {/* Custom Quote Field (for Postcard) */}
              {template === "postcard" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-pink-50/40 dark:bg-white/5 border border-pink-200/20">
                  <Type size={12} className="text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={customQuote}
                    onChange={(e) => handleQuoteChange(e.target.value)}
                    placeholder="Write your custom love quote here…"
                    className="flex-1 text-xs bg-transparent border-0 outline-hidden font-medium text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                    maxLength={120}
                  />
                </div>
              )}

              {/* Film Filters */}
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                <div
                  className="flex gap-1.5 overflow-x-auto py-0.5"
                  style={{ scrollbarWidth: "none" }}
                  role="radiogroup"
                  aria-label="Film filter"
                >
                  {FILM_FILTERS.map((f) => {
                    const active = activeFilter.name === f.name;
                    return (
                      <button
                        key={f.name}
                        onClick={() => handleFilterChange(f)}
                        role="radio"
                        aria-checked={active}
                        id={`filter-${f.name.toLowerCase()}`}
                        className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all duration-200"
                        style={
                          active
                            ? {
                                background: "linear-gradient(135deg,#f9a8d4,#ec4899)",
                                color: "#fff",
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
            </div>
          )}

          {/* ── Main Camera / Preview Box ─────────────────────────── */}
          <AnimatePresence mode="wait">
            {isPreview && renderedUrl ? (
              /* ── Composite Preview with Customization Toolbar ───── */
              <motion.div
                key="preview-card"
                initial={{ opacity: 0, scale: 0.9, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.4, ease: CUBIC }}
                className="flex flex-col items-center gap-3 py-1"
              >
                {/* Customization Toolbar in Preview */}
                <div className="flex flex-col gap-2.5 w-full bg-pink-50/50 dark:bg-neutral-900/50 p-2.5 rounded-2xl border border-pink-200/40">
                  {/* Top line: Layout switch & Paper Color Swatches */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Layout switch */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/5 dark:bg-white/5 border border-pink-200/40 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate("postcard")}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          template === "postcard"
                            ? "bg-white text-pink-600 shadow-xs dark:bg-pink-900/60 dark:text-pink-100"
                            : "text-neutral-500 hover:text-pink-600"
                        }`}
                      >
                        Postcard View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate("strip")}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          template === "strip"
                            ? "bg-white text-pink-600 shadow-xs dark:bg-pink-900/60 dark:text-pink-100"
                            : "text-neutral-500 hover:text-pink-600"
                        }`}
                      >
                        Strip View
                      </button>
                    </div>

                    {/* Paper Color Swatches */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-neutral-500 flex items-center gap-1">
                        <Palette size={11} /> Paper:
                      </span>
                      <div className="flex items-center gap-1">
                        {PAPER_PRESETS.map((p) => {
                          const active = paperColor.toLowerCase() === p.hex.toLowerCase();
                          return (
                            <button
                              key={p.hex}
                              type="button"
                              onClick={() => handlePaperColorChange(p.hex)}
                              title={p.label}
                              className={`w-5 h-5 rounded-full transition-transform ${
                                active
                                  ? "scale-120 ring-2 ring-pink-500 ring-offset-1"
                                  : "hover:scale-110 border border-neutral-300"
                              }`}
                              style={{ backgroundColor: p.hex }}
                            />
                          );
                        })}
                        {/* Custom color picker */}
                        <label
                          title="Pick custom color"
                          className="relative w-5 h-5 rounded-full cursor-pointer overflow-hidden border border-neutral-300 hover:scale-110 transition-transform flex items-center justify-center bg-gradient-to-tr from-rose-200 via-pink-300 to-amber-100"
                        >
                          <input
                            type="color"
                            value={paperColor}
                            onChange={(e) => handlePaperColorChange(e.target.value)}
                            className="opacity-0 absolute inset-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bottom line: Fully custom quote input (when in Postcard View) */}
                  {template === "postcard" && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-pink-200/50">
                      <Type size={12} className="text-pink-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={customQuote}
                        onChange={(e) => handleQuoteChange(e.target.value)}
                        placeholder="Type any custom quote or love message…"
                        className="flex-1 text-xs bg-transparent border-0 outline-hidden font-medium text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                        maxLength={120}
                        aria-label="Custom quote for postcard"
                      />
                    </div>
                  )}
                </div>

                {/* Print Paper Graphic Preview */}
                <div className="relative group max-w-full flex justify-center overflow-hidden py-1">
                  <motion.div
                    animate={{ rotate: [-0.6, 0.4, -0.6], y: [0, -2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                    onClick={() => setSelectedPhoto({ name: "Preview", url: renderedUrl })}
                    title="Click to view full screen"
                    style={{
                      padding: template === "postcard" ? 8 : 10,
                      paddingBottom: template === "postcard" ? 12 : 24,
                      background: isDarkColor(paperColor) ? "#262629" : "#ffffff",
                      borderRadius: 14,
                      boxShadow: "0 18px 48px rgba(236,72,153,0.22), 0 4px 16px rgba(0,0,0,0.12)",
                      maxWidth: template === "postcard" ? "100%" : 240,
                    }}
                  >
                    <img
                      src={renderedUrl}
                      alt="Photobooth print preview"
                      className="w-full h-auto rounded-lg shadow-inner"
                      style={{ maxHeight: "380px", objectFit: "contain" }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-neutral-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                        <Eye size={12} /> Click to Enlarge
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              /* ── Live Webcam & Thumbnail Grid ───────────────────── */
              <motion.div
                key="webcam-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-2.5"
              >
                {/* Camera Viewport */}
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: "4/3",
                    border: "2px solid rgba(244,114,182,0.42)",
                    boxShadow: "0 0 0 4px rgba(244,114,182,0.08)",
                    background: "var(--bg-slot)",
                  }}
                >
                  {cameraError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                      <Camera size={32} strokeWidth={1.5} style={{ color: "var(--text-faint)" }} />
                      <p className="text-xs text-center font-medium" style={{ color: "var(--text-faint)" }}>
                        Camera access is disabled. Please allow camera permissions and reload.
                      </p>
                    </div>
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={0.96}
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
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-[11px] font-bold tabular-nums"
                      style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)" }}
                    >
                      Photo {shotNum}/{TOTAL_SHOTS}
                    </div>
                  )}

                  {/* Countdown Big Overlay */}
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
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute w-24 h-24 rounded-full"
                          style={{ border: "3px solid rgba(255,255,255,0.7)" }}
                        />
                        <span
                          className="relative text-8xl font-bold text-white"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            textShadow: "0 4px 32px rgba(0,0,0,0.6)",
                          }}
                        >
                          {countdown}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shutter White Flash */}
                  <AnimatePresence>
                    {flashOn && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.34 }}
                        className="absolute inset-0 bg-white pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Developing Film Overlay */}
                  {phase === "rendering" && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)" }}
                    >
                      <Loader2 size={32} className="animate-spin text-pink-500" />
                      <span className="text-[13px] font-semibold text-pink-600">
                        Developing {template === "postcard" ? "Postcard Collage" : "Film Strip"}…
                      </span>
                    </div>
                  )}

                  {/* Soft Vignette Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 65%, rgba(244,114,182,0.1) 100%)",
                    }}
                  />
                </div>

                {/* 4-Shot Thumbnail Preview Row */}
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
                            ? "1.5px solid rgba(244,114,182,0.5)"
                            : "1.5px dashed var(--border-dashed)",
                        }}
                      >
                        {captures[i] ? (
                          <motion.img
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            src={captures[i]}
                            alt={`Capture ${i + 1}`}
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

          {/* ── Actions Row ─────────────────────────────────────────── */}
          <div className="flex gap-2">
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
                <Camera size={16} strokeWidth={2} />
                {cameraReady ? "Start 4-Shot Session" : "Starting camera…"}
              </motion.button>
            )}

            {isShooting && (
              <>
                <div
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
                  style={{
                    background: "var(--bg-slot)",
                    color: "var(--text-faint)",
                    border: "1px solid var(--border-glass)",
                  }}
                >
                  <Timer size={14} />
                  {phase === "rendering" ? "Developing…" : `Taking photo ${shotNum} of ${TOTAL_SHOTS}`}
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
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRetake}
                    disabled={phase === "saving"}
                    id="photobooth-retake-btn"
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                    style={{
                      background: "var(--bg-glass)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid var(--border-glass)",
                      color: "var(--text-body)",
                    }}
                    aria-label="Retake photos"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    Retake
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownload}
                    id="photobooth-download-btn"
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                    style={{
                      background: "var(--bg-glass)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid var(--border-glass)",
                      color: "var(--text-body)",
                    }}
                    aria-label="Download image"
                  >
                    <Download size={13} strokeWidth={2} />
                    Download
                  </motion.button>
                </div>

                <motion.button
                  whileHover={phase !== "saving" ? { scale: 1.02, boxShadow: "0 8px 24px rgba(236,72,153,0.38)" } : {}}
                  whileTap={phase !== "saving" ? { scale: 0.97 } : {}}
                  onClick={handleSave}
                  disabled={phase === "saving" || saveStatus === "success"}
                  id="photobooth-save-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold text-white transition-all"
                  style={{
                    background:
                      saveStatus === "success"
                        ? "linear-gradient(135deg,#10b981,#059669)"
                        : "linear-gradient(135deg,#f472b6 0%,#ec4899 100%)",
                    boxShadow: "0 4px 16px rgba(236,72,153,0.28)",
                    opacity: phase === "saving" ? 0.75 : 1,
                  }}
                  aria-label="Save print to Supabase memories"
                >
                  {phase === "saving" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Memory…
                    </>
                  ) : saveStatus === "success" ? (
                    <>
                      <CheckCircle2 size={14} /> Saved in Memories!
                    </>
                  ) : (
                    <>
                      <CloudUpload size={14} strokeWidth={2} /> Save to Memories
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* ── Status alerts ───────────────────────────────────────── */}
          <AnimatePresence>
            {saveStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <CheckCircle2 size={13} />
                Successfully saved to your Supabase memory scrapbook!
              </motion.div>
            )}
            {saveStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle size={13} />
                Upload failed. Please ensure the Supabase &apos;photobooth&apos; storage bucket is public or has upload policy enabled.
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Gallery Strip ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ImageIcon size={12} style={{ color: "var(--text-faint)" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-faint)" }}
              >
                Memory Vault Strips & Postcards
              </span>
              {!loadingGallery && (
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "var(--bg-tag)",
                    color: "var(--text-label)",
                    border: "1px solid var(--border-glass)",
                  }}
                >
                  {gallery.length} prints
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
                style={{
                  background: "var(--bg-slot)",
                  border: "1.5px dashed var(--border-dashed)",
                }}
              >
                <Camera size={18} strokeWidth={1.5} style={{ color: "var(--text-faint)" }} />
                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  No photobooth prints yet — snap your first session above!
                </p>
              </div>
            ) : (
              <div
                className="flex gap-3 overflow-x-auto pb-2 pt-1"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(244,114,182,0.3) transparent",
                }}
                aria-label="Saved photobooth memories gallery"
              >
                {gallery.map((p) => (
                  <GalleryItemCard
                    key={p.name}
                    photo={p}
                    onClick={() => setSelectedPhoto(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Full Size Lightbox Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-2xl max-h-[90vh] bg-white rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col items-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-neutral-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              {/* Image */}
              <div className="overflow-auto max-h-[72vh] flex items-center justify-center w-full rounded-2xl bg-neutral-50 p-2">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  className="max-h-[68vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Modal Footer */}
              <div className="w-full mt-3 flex items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <Heart size={12} className="text-pink-500 fill-pink-500" />
                  <span>Aiseil & Mark Photobooth Print</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadImage(selectedPhoto.url, selectedPhoto.name)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 transition-colors shadow-sm"
                >
                  <Download size={13} />
                  Download High-Res
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
