import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PALETTE, TEXT } from "@/lib/constants";
import { SPARKLE_PALETTES, PALETTE_SWATCHES } from "@/components/shared/SparkleIcon";

const triggerStyle = {
  borderColor: PALETTE.inputBorder,
  backgroundColor: PALETTE.controlBg,
};

export default function ColorSelector({
  iconColor,
  setIconColor,
  t,
  accent = true,
}) {
  const colorLabel = (p) =>
    t[`color${p.charAt(0).toUpperCase() + p.slice(1)}`] ?? p;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p
        style={{ ...TEXT.bodyStrong, textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.88)" : "#5f4a55" }}
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
  );
}
