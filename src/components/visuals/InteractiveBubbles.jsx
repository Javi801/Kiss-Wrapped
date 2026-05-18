import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";

const BUBBLE_COUNT = 12;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 55;
const PARTICLE_COUNT = 9;

const TINTS = [
  "rgba(226,115,150,0.18)",
  "rgba(233,209,240,0.25)",
  "rgba(189,224,254,0.25)",
  "rgba(255,221,234,0.25)",
];

const PARTICLE_COLORS = [
  "rgba(226,115,150,0.85)",
  "rgba(210,90,130,0.75)",
  "rgba(233,180,220,0.8)",
  "rgba(189,210,254,0.8)",
  "rgba(255,200,220,0.8)",
];

let _nextId = BUBBLE_COUNT;

function makeBubble(id) {
  return {
    id,
    baseX: 5 + Math.random() * 90,
    baseY: 5 + Math.random() * 90,
    size: 22 + Math.random() * 36,
    tint: TINTS[Math.floor(Math.random() * TINTS.length)],
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 4,
  };
}

function makeParticles(size) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + Math.random() * 20 - 10;
    const rad = (angle * Math.PI) / 180;
    const distance = size * 0.9 + Math.random() * size * 0.7;
    const pSize = size * 0.13 + Math.random() * size * 0.1;
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    return { rad, distance, pSize, color };
  });
}

function BurstEffect({ burst }) {
  return (
    <div
      style={{
        position: "fixed",
        left: burst.x,
        top: burst.y,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {/* Shockwave ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: burst.size,
          height: burst.size,
          borderRadius: "50%",
          border: "2px solid rgba(226,115,150,0.6)",
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Particles */}
      {burst.particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(p.rad) * p.distance,
            y: Math.sin(p.rad) * p.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.4, 1] }}
          style={{
            position: "absolute",
            width: p.pSize,
            height: p.pSize,
            borderRadius: "50%",
            background: p.color,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

function Bubble({ bubble, pointerRef, onPop }) {
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const springX = useSpring(dx, { stiffness: 130, damping: 20 });
  const springY = useSpring(dy, { stiffness: 130, damping: 20 });

  useAnimationFrame(() => {
    const { x: px, y: py } = pointerRef.current;
    if (px === -9999) return;
    const bx = (bubble.baseX / 100) * window.innerWidth;
    const by = (bubble.baseY / 100) * window.innerHeight;
    const distX = bx - px;
    const distY = by - py;
    const dist = Math.sqrt(distX * distX + distY * distY);
    if (dist < REPEL_RADIUS && dist > 1) {
      const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
      dx.set((distX / dist) * force);
      dy.set((distY / dist) * force);
    } else {
      dx.set(0);
      dy.set(0);
    }
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${bubble.baseX}%`,
        top: `${bubble.baseY}%`,
        translateX: "-50%",
        translateY: "-50%",
        x: springX,
        y: springY,
        zIndex: 3,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        scale: [1, 1.35, 0],
        opacity: [1, 0.9, 0],
        transition: { duration: 0.26, ease: "easeIn", times: [0, 0.25, 1] },
      }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <motion.div
        animate={{
          y: [0, -14, 4, -10, 2, 0],
          x: [0, 7, -3, 6, -2, 0],
        }}
        transition={{
          duration: bubble.duration,
          delay: bubble.delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileTap={{ scale: 1.15 }}
        onPointerDown={(e) => onPop(bubble.id, e.clientX, e.clientY, bubble.size)}
        style={{
          width: bubble.size,
          height: bubble.size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.25) 28%, ${bubble.tint} 65%, transparent 100%)`,
          border: "1.5px solid rgba(255,255,255,0.65)",
          boxShadow:
            "inset 0 2px 5px rgba(255,255,255,0.5), 0 3px 16px rgba(200,180,220,0.18)",
          cursor: "pointer",
          touchAction: "none",
        }}
      />
    </motion.div>
  );
}

export default function InteractiveBubbles() {
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: BUBBLE_COUNT }, (_, i) => makeBubble(i)),
  );
  const [bursts, setBursts] = useState([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const update = (e) => {
      const t = e.touches?.[0];
      pointerRef.current = {
        x: t ? t.clientX : e.clientX,
        y: t ? t.clientY : e.clientY,
      };
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("touchmove", update, { passive: true });
    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("touchmove", update);
    };
  }, []);

  const popBubble = useCallback((id, x, y, size) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));

    const burstId = _nextId++;
    setBursts((prev) => [...prev, { id: burstId, x, y, size, particles: makeParticles(size) }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== burstId)), 500);

    setTimeout(
      () => setBubbles((prev) => [...prev, makeBubble(_nextId++)]),
      500 + Math.random() * 600,
    );
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 3 }}>
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} bubble={bubble} pointerRef={pointerRef} onPop={popBubble} />
        ))}
      </AnimatePresence>
      {bursts.map((burst) => (
        <BurstEffect key={burst.id} burst={burst} />
      ))}
    </div>
  );
}
