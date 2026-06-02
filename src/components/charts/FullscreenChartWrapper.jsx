import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { usePalette } from "@/lib/theme";
import { FullscreenContext } from "./FullscreenContext";

function getChartFilename() {
  return `kiss-recorder-chart-${new Date().toISOString().slice(0, 10)}.png`;
}

function getCaptureSize(el) {
  const rect = el.getBoundingClientRect();
  return {
    width: Math.ceil(Math.max(el.scrollWidth, el.offsetWidth, rect.width)),
    height: Math.ceil(Math.max(el.scrollHeight, el.offsetHeight, rect.height)),
  };
}

async function shareCanvasImage(canvas, filename) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Chart image download is only available on mobile.");
  }

  const dataUrl = canvas.toDataURL("image/png");
  const base64Data = dataUrl.split(",")[1];
  const path = `${Date.now()}-${filename}`;

  await Filesystem.writeFile({
    path,
    directory: Directory.Cache,
    data: base64Data,
    recursive: true,
  });

  try {
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });
    await Share.share({
      title: filename,
      dialogTitle: "Guardar imagen",
      files: [uri],
    });
  } finally {
    Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {});
  }
}

function IconButton({ onClick, disabled, children, palette, title }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 999,
        border: `1px solid ${palette.cardBorder}`,
        background: hovered ? palette.cardSoft : palette.card,
        color: palette.text,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.12s, opacity 0.12s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export default function FullscreenChartWrapper({ children, centerContent = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [hovered, setHovered] = useState(false);
  const captureRef = useRef(null);
  const PALETTE = usePalette();

  const open = useCallback(() => {
    setDownloadError("");
    setIsFullscreen(true);
  }, []);
  const close = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, isFullscreen]);

  const download = useCallback(async () => {
    const el = captureRef.current;
    if (!el || downloading) return;
    setDownloadError("");
    setDownloading(true);
    const finalFilename = getChartFilename();

    // Temporarily expand all overflow/maxHeight constraints so full content is captured.
    const allEls = [...el.querySelectorAll("*")];
    const saved = [];
    allEls.forEach((s) => {
      const cs = window.getComputedStyle(s);
      const clipsOverflow = ["auto", "hidden", "scroll"].some(
        (v) => cs.overflow === v || cs.overflowX === v || cs.overflowY === v
      );
      const hasMaxH = cs.maxHeight && cs.maxHeight !== "none" && cs.maxHeight !== "0px";
      if (clipsOverflow || hasMaxH) {
        saved.push({
          el: s,
          overflow: s.style.overflow,
          overflowX: s.style.overflowX,
          overflowY: s.style.overflowY,
          maxHeight: s.style.maxHeight,
          height: s.style.height,
        });
        if (clipsOverflow) {
          s.style.overflow = "visible";
          s.style.overflowX = "visible";
          s.style.overflowY = "visible";
        }
        if (hasMaxH) {
          s.style.maxHeight = "none";
          s.style.height = "auto";
        }
      }
    });

    // Give layout a tick to reflow before capture.
    await new Promise((r) => setTimeout(r, 80));

    try {
      const { width, height } = getCaptureSize(el);
      const canvas = await html2canvas(el, {
        backgroundColor: PALETTE.cardBg || "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
      });

      await shareCanvasImage(canvas, finalFilename);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to download chart image", error);
      setDownloadError("No se pudo descargar la imagen.");
    } finally {
      saved.forEach(({ el: s, overflow, overflowX, overflowY, maxHeight, height }) => {
        s.style.overflow = overflow;
        s.style.overflowX = overflowX;
        s.style.overflowY = overflowY;
        s.style.maxHeight = maxHeight;
        s.style.height = height;
      });
      setDownloading(false);
    }
  }, [downloading, PALETTE.cardBg]);

  if (isFullscreen) {
    return createPortal(
      <FullscreenContext.Provider value={true}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: PALETTE.bg,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Floating controls */}
          <div
            style={{
              position: "fixed",
              top: 14,
              right: 14,
              zIndex: 10001,
              display: "flex",
              gap: 8,
            }}
          >
            <IconButton
              onClick={download}
              disabled={downloading}
              palette={PALETTE}
              title="Descargar imagen"
            >
              <Download size={15} />
            </IconButton>
            <IconButton onClick={close} palette={PALETTE} title="Cerrar">
              <X size={15} />
            </IconButton>
          </div>

          {/* Chart content — captureRef wraps everything that goes into the image */}
          <div
            ref={captureRef}
            data-fullscreen-chart
            data-center-content={centerContent ? "true" : undefined}
            style={{
              padding: "3.5rem 1.25rem 3rem",
              minHeight: "100dvh",
              boxSizing: "border-box",
              position: "relative",
              display: "flex",
            }}
          >
            <style>
              {`
                [data-fullscreen-chart] > [data-slot="card"] {
                  flex: 1 1 auto;
                  width: 100%;
                  min-height: calc(100dvh - 6.5rem);
                  border-radius: 1.25rem !important;
                  position: relative;
                }

                [data-fullscreen-chart] > [data-slot="card"] > [data-slot="card-content"] {
                  flex: 1 1 auto;
                  min-height: 0;
                  display: flex;
                  flex-direction: column;
                }

                [data-fullscreen-chart][data-center-content="true"] > [data-slot="card"] > [data-slot="card-content"] {
                  align-items: center;
                  justify-content: center;
                }

                [data-fullscreen-chart][data-center-content="true"] > [data-slot="card"] > [data-slot="card-content"] > * {
                  max-width: 100%;
                }

                [data-fullscreen-chart] [data-slot="card-content"] div:has(> .recharts-responsive-container) {
                  flex: 1 1 auto;
                  height: clamp(20rem, 64dvh, 44rem) !important;
                  min-height: 20rem;
                }

                [data-fullscreen-chart] [data-bar-chart-container] {
                  /* TODO: Tune the fullscreen height of vertical bar charts.
                     They should keep a pleasant max proportion, close to 4 high by 3 wide. */
                  flex: 0 1 auto !important;
                  height: min(58dvh, calc(133.333vw - 3.333rem), 34rem) !important;
                  min-height: 18rem !important;
                }

                [data-fullscreen-watermark] {
                  bottom: calc(3rem + 10px);
                  right: calc(1.25rem + 14px);
                }

                @media (max-width: 640px) {
                  [data-fullscreen-chart] {
                    padding: 3.25rem 0.75rem 2.5rem !important;
                  }

                  [data-fullscreen-chart] > [data-slot="card"] {
                    min-height: calc(100dvh - 5.75rem);
                    border-radius: 1rem !important;
                  }

                  [data-fullscreen-watermark] {
                    bottom: calc(2.5rem + 10px);
                    right: calc(0.75rem + 14px);
                  }

                  [data-fullscreen-chart] [data-slot="card-content"] div:has(> .recharts-responsive-container) {
                    height: clamp(18rem, 62dvh, 34rem) !important;
                    min-height: 18rem;
                  }

                  [data-fullscreen-chart] [data-bar-chart-container] {
                    height: min(56dvh, calc(133.333vw - 2rem), 30rem) !important;
                    min-height: 16rem !important;
                  }
                }
              `}
            </style>
            {children}
            {downloadError ? (
              <div
                role="status"
                style={{
                  position: "absolute",
                  top: "0.875rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1,
                  border: `1px solid ${PALETTE.inputBorder}`,
                  borderRadius: 999,
                  background: PALETTE.card,
                  color: PALETTE.text,
                  padding: "0.35rem 0.75rem",
                  fontSize: 12,
                  boxShadow: "0 6px 18px rgb(0 0 0 / 0.08)",
                }}
              >
                {downloadError}
              </div>
            ) : null}

            {/* Watermark — included in download because it lives inside captureRef */}
            <div
              data-fullscreen-watermark
              style={{
                position: "absolute",
                color: PALETTE.watermark ?? PALETTE.textSoft,
                opacity: PALETTE.watermarkOpacity ?? 0.35,
                fontSize: 11,
                letterSpacing: "0.06em",
                fontWeight: 500,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              KissRecorder
            </div>
          </div>
        </div>
      </FullscreenContext.Provider>,
      document.body
    );
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <button
        onClick={open}
        title="Pantalla completa"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 999,
          border: `1px solid ${PALETTE.cardBorder}`,
          background: PALETTE.card,
          color: PALETTE.textSoft,
          cursor: "pointer",
          opacity: hovered ? 0.85 : 0.3,
          transition: "opacity 0.15s",
          zIndex: 10,
        }}
      >
        <Maximize2 size={13} />
      </button>
    </div>
  );
}
