import { usePalette } from "@/lib/theme";
import HeroVisualPlaceholder from "@/components/visuals/HeroVisualPlaceholder";
import InteractiveBubbles from "@/components/visuals/InteractiveBubbles";

/**
 * Initial splash-like screen with hidden entry.
 * Acts as a playful gate before entering the main app.
 */
export default function IntroScreen({ onOpenMain, t }) {
  const PALETTE = usePalette();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        zIndex: 10,
        background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
      }}
    >
      {/* Interactive poppable bubbles */}
      <InteractiveBubbles />

      {/* Top radial overlay */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: "radial-gradient(circle at top, rgba(255,255,255,0.95), transparent 45%)",
        }}
      />

      {/* Hidden entry in the top-left heart. */}
      <button
        type="button"
        onClick={onOpenMain}
        aria-label={t.hiddenAccess}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          zIndex: 10,
          padding: "0.25rem",
          color: PALETTE.accentSoft,
          opacity: 0.4,
          transition: "opacity 150ms",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ♡
      </button>

      {/* Center visual */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <HeroVisualPlaceholder t={t} />
      </div>
    </div>
  );
}
