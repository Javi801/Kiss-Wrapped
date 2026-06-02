import { TEXT, PALETTES } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

const THEMES = Object.keys(PALETTES).map((key) => ({
  key,
  gradient: `linear-gradient(135deg, ${PALETTES[key].bgGradientFrom}, ${PALETTES[key].bgGradientVia}, ${PALETTES[key].bgGradientTo})`,
}));

export default function ThemeSelector({ theme, setTheme, t }) {
  const PALETTE = usePalette();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p style={{ ...TEXT.bodyStrong, textTransform: "uppercase", color: PALETTE.textSoft }}>
        {t.appTheme}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {THEMES.map(({ key, gradient }) => {
          const selected = theme === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className="rounded-2xl"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem",
                border: selected
                  ? `2px solid ${PALETTE.accent}`
                  : `1.5px solid ${PALETTE.inputBorder}`,
                backgroundColor: selected ? PALETTE.accentMuted : PALETTE.controlBg,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <span
                className="rounded-full"
                style={{
                  display: "block",
                  width: "2rem",
                  height: "2rem",
                  background: gradient,
                  boxShadow: selected ? `0 2px 8px rgba(0,0,0,0.18)` : "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
              <span style={{ ...TEXT.caption, fontWeight: selected ? "700" : "500", color: selected ? PALETTE.accent : PALETTE.textSoft }}>
                {t[`theme${key.charAt(0).toUpperCase() + key.slice(1)}`]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
