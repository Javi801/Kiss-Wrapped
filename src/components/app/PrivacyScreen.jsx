import { motion } from "framer-motion";
import { usePalette } from "@/lib/theme";

export default function PrivacyScreen() {
  const PALETTE = usePalette();
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, transition: { duration: 0 } }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
      }}
    >
      <span
        style={{
          fontSize: "3.5rem",
          opacity: 0.3,
          color: PALETTE.accentSoft,
          userSelect: "none",
        }}
      >
        ♡
      </span>
    </motion.div>
  );
}
