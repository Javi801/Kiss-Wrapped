import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { usePalette } from "@/lib/theme";
import { TEXT } from "@/lib/constants";
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

async function shareImage(dataUrl, filename) {
  const base64 = dataUrl.split(",")[1];

  await Filesystem.writeFile({
    path: filename,
    directory: Directory.Cache,
    data: base64,
    recursive: true,
  });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  await Share.share({ files: [uri] });
  Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => {});
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
  const [downloadErrorObj, setDownloadErrorObj] = useState(null);
  const [sharingLog, setSharingLog] = useState(false);
  const [hovered, setHovered] = useState(false);
  const captureRef = useRef(null);
  const PALETTE = usePalette();

  const shareDownloadLog = useCallback(async () => {
    if (!downloadErrorObj) return;
    setSharingLog(true);
    try {
      const timestamp = new Date().toISOString();
      const platform = Capacitor.getPlatform?.() ?? "unknown";
      const content = [
        "KissRecorder Chart Export Error",
        `Timestamp: ${timestamp}`,
        `Platform: ${platform}`,
        `Error: ${downloadErrorObj?.message || String(downloadErrorObj)}`,
        "",
        "Stack trace:",
        downloadErrorObj?.stack || "(no stack trace available)",
      ].join("\n");

      const fileName = `kiss-recorder-export-error-${timestamp.slice(0, 10)}.txt`;
      await Filesystem.writeFile({
        path: fileName,
        directory: Directory.Cache,
        data: content,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ files: [uri] });
      Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
    } catch {
      // sharing failed silently
    } finally {
      setSharingLog(false);
    }
  }, [downloadErrorObj]);

  const open = useCallback(() => {
    setDownloadError("");
    setDownloadErrorObj(null);
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
      const dataUrl = await toPng(el, {
        backgroundColor: PALETTE.cardBg,
        pixelRatio: 2,
        width,
        height,
      });

      await shareImage(dataUrl, finalFilename);
    } catch (error) {
      console.error("Failed to download chart image", error);
      setDownloadError(`Error: ${error?.message || String(error)}`);
      setDownloadErrorObj(error);
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
              padding: 0,
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
                  min-height: 100dvh;
                  border-radius: 0 !important;
                  box-shadow: none !important;
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

                [data-fullscreen-chart] [data-slot="card-content"] div:has(> .recharts-responsive-container):not([data-bar-chart-container]) {
                  flex: 1 1 auto;
                  height: clamp(20rem, 64dvh, 44rem) !important;
                  min-height: 20rem;
                }

                [data-fullscreen-chart] [data-bar-chart-container] {
                  flex: 0 1 auto !important;
                  height: min(58dvh, calc(133.333vw - 7.333rem), 34rem) !important;
                  min-height: 18rem !important;
                  margin-block: auto;
                }

                [data-fullscreen-watermark] {
                  bottom: 10px;
                  right: 14px;
                }

                @media (max-width: 640px) {
                  [data-fullscreen-chart] > [data-slot="card"] {
                    min-height: 100dvh;
                    border-radius: 0 !important;
                  }

                  [data-fullscreen-watermark] {
                    bottom: 10px;
                    right: 14px;
                  }

                  [data-fullscreen-chart] [data-slot="card-content"] div:has(> .recharts-responsive-container):not([data-bar-chart-container]) {
                    height: clamp(18rem, 62dvh, 34rem) !important;
                    min-height: 18rem;
                  }

                  [data-fullscreen-chart] [data-bar-chart-container] {
                    height: min(56dvh, calc(133.333vw - 6rem), 30rem) !important;
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
                  padding: "0.35rem 0.5rem 0.35rem 0.75rem",
                  fontSize: 12,
                  boxShadow: "0 6px 18px rgb(0 0 0 / 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap",
                }}
              >
                {downloadError}
                <button
                  onClick={shareDownloadLog}
                  disabled={sharingLog}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: PALETTE.accent,
                    background: "none",
                    border: "none",
                    cursor: sharingLog ? "default" : "pointer",
                    opacity: sharingLog ? 0.5 : 1,
                    padding: "0.1rem 0.25rem",
                    flexShrink: 0,
                  }}
                >
                  {sharingLog ? "…" : "Compartir log"}
                </button>
              </div>
            ) : null}

            {/* Watermark — included in download because it lives inside captureRef */}
            <div
              data-fullscreen-watermark
              style={{
                position: "absolute",
                color: PALETTE.accent,
                opacity: PALETTE.watermarkOpacity ?? 0.5,
                ...TEXT.bodyStrong,
                letterSpacing: "0.1em",
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
          border: `1px solid ${PALETTE.accentSoft}`,
          background: hovered ? PALETTE.accentMuted : PALETTE.card,
          color: PALETTE.accent,
          cursor: "pointer",
          opacity: hovered ? 1 : 0.65,
          transition: "opacity 0.15s, background 0.15s",
          zIndex: 10,
        }}
      >
        <Maximize2 size={13} />
      </button>
    </div>
  );
}
