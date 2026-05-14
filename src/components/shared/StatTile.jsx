import TileCard from "./TileCard";
import { tileColors } from "./tileColors";

export default function StatTile({ label, value, helper, accent = false }) {
  const colors = tileColors(accent);

  return (
    <TileCard accent={accent}>
      <p
        style={{ fontSize: "0.75rem", lineHeight: "1rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.12em", color: colors.label }}
      >
        {label}
      </p>

      <p
        style={{ marginTop: "0.5rem", fontSize: "1.875rem", lineHeight: "2.25rem", fontWeight: "700", letterSpacing: "-0.025em", color: colors.value }}
      >
        {value}
      </p>

      {helper ? (
        <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", lineHeight: "1.25rem", color: colors.helper }}>
          {helper}
        </p>
      ) : null}
    </TileCard>
  );
}
