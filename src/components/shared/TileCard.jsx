import { Card, CardContent } from "@/components/ui/card";

/**
 * Shared card shell used by StatTile and SettingsTile.
 * Edit padding, rounding, shadow, or blur here to affect both.
 */
export default function TileCard({ accent = false, children, contentStyle }) {
  const borderColor = accent ? "rgba(255,255,255,0.25)" : "#f1dde7";
  const background = accent
    ? "rgba(255,255,255,0.22)"
    : "rgba(255,255,255,0.92)";

  return (
    <Card
      className="rounded-3xl shadow-sm"
      style={{ borderColor, background, backdropFilter: "blur(8px)" }}
    >
      <CardContent className="p-5" style={contentStyle}>{children}</CardContent>
    </Card>
  );
}
