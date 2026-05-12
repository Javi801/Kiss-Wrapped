import { PALETTE } from "@/lib/constants";

export function tileColors(accent) {
  return {
    label: accent ? "rgba(255,255,255,0.88)" : PALETTE.textSoft,
    value: accent ? "#ffffff" : PALETTE.text,
    helper: accent ? "rgba(255,255,255,0.82)" : PALETTE.textSoft,
  };
}
