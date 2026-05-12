import TileCard from "./TileCard";
import { tileColors } from "./tileColors";

export default function SettingsTile({ label, children, accent = false }) {
  const colors = tileColors(accent);

  return (
    <TileCard accent={accent}>
      {label ? (
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: colors.label }}
        >
          {label}
        </p>
      ) : null}

      <div className="space-y-4">{children}</div>
    </TileCard>
  );
}
