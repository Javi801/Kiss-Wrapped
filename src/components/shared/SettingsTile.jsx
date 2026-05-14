import TileCard from "./TileCard";
import { tileColors } from "./tileColors";
import { TEXT } from "@/lib/constants";

export default function SettingsTile({ label, children, accent = false, contentStyle }) {
  const colors = tileColors(accent);

  return (
    <TileCard accent={accent} contentStyle={contentStyle}>
      {label ? (
        <p
          style={{ marginBottom: "0.75rem", ...TEXT.label, textTransform: "uppercase", letterSpacing: "0.12em", color: colors.label }}
        >
          {label}
        </p>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>{children}</div>
    </TileCard>
  );
}
