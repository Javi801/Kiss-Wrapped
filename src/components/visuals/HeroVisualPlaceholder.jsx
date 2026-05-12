import { useState } from "react";
import { motion } from "framer-motion";
import { PALETTE } from "@/lib/constants";
import mainBackground from "@/assets/main-background.png";

/**
 * Displays the main circular hero visual.
 * Falls back gracefully if the image fails to load.
 */
export default function HeroVisualPlaceholder() {
  // Track if the image loads correctly.
  const [hasImage, setHasImage] = useState(true);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "18rem",
        width: "18rem",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(255,255,255,0.55)",
      }}
    >
      {/* Background gradient layer */}
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          bottom: "1.5rem",
          left: "1.5rem",
          borderRadius: "9999px",
          background: `linear-gradient(135deg, ${PALETTE.blush}, #fff7fb, ${PALETTE.sky})`,
        }}
      />

      {/* Floating animated container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          height: "12rem",
          width: "12rem",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: "32px",
          textAlign: "center",
        }}
      >
        {hasImage ? (
          <img
            src={mainBackground}
            alt="KissRecorder visual"
            style={{ height: "100%", width: "100%", objectFit: "contain" }}
            onError={() => setHasImage(false)}
          />
        ) : (
          // Fallback when image is missing.
          <div style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }} />
        )}
      </motion.div>
    </div>
  );
}