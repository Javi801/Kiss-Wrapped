export function tileColors(accent, palette) {
  return {
    label: accent ? 'rgba(255,255,255,0.88)' : palette.textSoft,
    value: accent ? '#ffffff' : palette.text,
    helper: accent ? 'rgba(255,255,255,0.82)' : palette.textSoft,
  }
}
