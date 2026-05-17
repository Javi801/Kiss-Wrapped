import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { SPARKLE_PALETTES, PALETTE_SWATCHES } from "@/components/shared/SparkleIcon";

const THEMES = [
  { key: "pink",  gradient: "linear-gradient(135deg, #ffddea, #f8abc7, #bde0fe)" },
  { key: "green", gradient: "linear-gradient(135deg, #d4edda, #a8d5b5, #bde0fe)" },
  { key: "dark",  gradient: "linear-gradient(135deg, #1a1535, #1e2d5a, #0f1e3d)" },
];

export default function ColorSelector({
  iconColor,
  setIconColor,
  theme,
  setTheme,
  t,
  accent = true,
}) {
  const PALETTE = usePalette();
  const triggerStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  };
  const colorLabel = (p) =>
    t[`color${p.charAt(0).toUpperCase() + p.slice(1)}`] ?? p;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {theme !== undefined && setTheme && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ ...TEXT.bodyStrong, textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.88)" : PALETTE.textSoft }}>
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
                      boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.18)" : "0 1px 3px rgba(0,0,0,0.1)",
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
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p
          style={{ ...TEXT.bodyStrong, textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.88)" : PALETTE.textSoft }}
        >
          {t.iconColor}
        </p>

        <Select value={iconColor} onValueChange={setIconColor}>
          <SelectTrigger
            aria-label={t.iconColor}
            className="rounded-3xl"
            style={{ height: "3.5rem", ...TEXT.base, boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", ...triggerStyle }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <SelectValue placeholder={t.iconColor} />
            </div>
          </SelectTrigger>

          <SelectContent>
            {SPARKLE_PALETTES.map((p) => (
              <SelectItem key={p} value={p}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    className="rounded-full"
                    style={{ height: "1rem", width: "1rem", background: PALETTE_SWATCHES[p] }}
                  />
                  {colorLabel(p)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
