import { PALETTE } from "@/lib/constants";
import BubbleStarsBackground from "@/components/visuals/BubbleStarsBackground";
import HeroVisualPlaceholder from "@/components/visuals/HeroVisualPlaceholder";

/**
 * Initial splash-like screen with hidden entry.
 * Acts as a playful gate before entering the main app.
 */
export default function IntroScreen({ onOpenMain, t }) {
  return (
    <div
      className="relative flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center overflow-hidden rounded-[32px]"
      style={{
        background: `linear-gradient(135deg, ${PALETTE.blush}, ${PALETTE.lilac}, ${PALETTE.sky})`,
      }}
    >
      {/* Floating animated background elements */}
      <BubbleStarsBackground />

      {/* Top radial overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_45%)]" />

      {/* Hidden entry — top-left heart */}
      <button
        type="button"
        onClick={onOpenMain}
        aria-label={t.hiddenAccess}
        className="absolute left-4 top-4 z-10 p-1 text-rose-300 opacity-40 transition hover:opacity-70"
      >
        ♡
      </button>

      {/* Center visual */}
      <div className="relative flex flex-col items-center">
        <HeroVisualPlaceholder t={t} />
      </div>
    </div>
  );
}