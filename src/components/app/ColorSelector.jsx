import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SPARKLE_PALETTES, PALETTE_SWATCHES } from "@/components/shared/SparkleIcon";

const triggerStyle = {
  borderColor: "#ecd6e0",
  backgroundColor: "rgba(255,255,255,0.86)",
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
    <div className="space-y-2">
      <p
        className="text-sm font-semibold uppercase"
        style={{ color: accent ? "rgba(255,255,255,0.88)" : "#5f4a55" }}
      >
        {t.iconColor}
      </p>

      <Select value={iconColor} onValueChange={setIconColor}>
        <SelectTrigger
          aria-label={t.iconColor}
          className="h-14 rounded-3xl text-base shadow-sm"
          style={triggerStyle}
        >
          <div className="flex items-center gap-3">
            <SelectValue placeholder={t.iconColor} />
          </div>
        </SelectTrigger>

        <SelectContent>
          {SPARKLE_PALETTES.map((p) => (
            <SelectItem key={p} value={p}>
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ background: PALETTE_SWATCHES[p] }}
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
