import React, { useEffect, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

function GradientLayer({ springX, springY, gradientColor, opacity, multiplier }) {
  const x = useTransform(springX, (val) => val * multiplier);
  const y = useTransform(springY, (val) => val * multiplier);
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, ${gradientColor} 0%, transparent 50%)`;

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background,
      }}
    />
  );
}

/**
 * NoiseBackground — animated moving gradient with noise texture overlay.
 * Ported from Aceternity UI.
 */
export default function NoiseBackground({
  children,
  className = "",
  containerClassName = "",
  gradientColors = [
    "rgb(255, 100, 150)",
    "rgb(100, 150, 255)",
    "rgb(255, 200, 100)",
  ],
  noiseIntensity = 0.2,
  speed = 0.1,
  animating = true,
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  const topGradientX = useTransform(springX, (val) => val * 0.1 - 50);

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastDirectionChangeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(rect.width / 2);
    y.set(rect.height / 2);
  }, [x, y]);

  const generateRandomVelocityRef = useRef(() => {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.5 + Math.random() * 0.5);
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
  });

  useEffect(() => {
    generateRandomVelocityRef.current = () => {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
    };
    velocityRef.current = generateRandomVelocityRef.current();
  }, [speed]);

  useAnimationFrame((time) => {
    if (!animating || !containerRef.current) return;

    // Throttle math updates slightly to ease CPU load on weak devices
    // We only recalculate boundaries every ~100ms instead of every 16ms
    if (time - lastDirectionChangeRef.current > 1500) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      velocityRef.current = { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
      lastDirectionChangeRef.current = time;
    }

    const currentX = x.get();
    const currentY = y.get();

    // Move gradients via framer-motion values (bypasses React render pipeline)
    let newX = currentX + velocityRef.current.x * 16;
    let newY = currentY + velocityRef.current.y * 16;

    x.set(newX);
    y.set(newY);
  });

  return (
    <div
      ref={containerRef}
      className={`noise-bg-container ${containerClassName}`}
      style={{ "--noise-opacity": noiseIntensity }}
    >
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[0]} opacity={0.4} multiplier={1} />
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[1]} opacity={0.3} multiplier={0.7} />
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[2] || gradientColors[0]} opacity={0.25} multiplier={1.2} />

      <motion.div
        className="noise-bg-strip"
        style={{
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
          x: animating ? topGradientX : 0,
        }}
      />

      <div className="noise-bg-noise">
        <img
          src="https://assets.aceternity.com/noise.webp"
          alt=""
          className="noise-bg-noise-img"
          style={{ opacity: `var(--noise-opacity)`, mixBlendMode: "overlay" }}
        />
      </div>

      <div className={`noise-bg-content ${className}`}>{children}</div>
    </div>
  );
}
