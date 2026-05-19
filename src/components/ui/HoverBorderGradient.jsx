import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

const DIRECTIONS = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

const movingMap = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
};

const highlight =
  "radial-gradient(75% 181.15% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

/**
 * Hover Border Gradient — rotating radial gradient border that highlights on hover.
 * Ported from Aceternity UI.
 */
export default function HoverBorderGradient({
  children,
  containerClassName = "",
  className = "",
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState("TOP");

  const rotateDirection = (current) => {
    const idx = DIRECTIONS.indexOf(current);
    const next = clockwise
      ? (idx - 1 + DIRECTIONS.length) % DIRECTIONS.length
      : (idx + 1) % DIRECTIONS.length;
    return DIRECTIONS[next];
  };

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prev) => rotateDirection(prev));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`hover-border-gradient-container ${containerClassName}`}
      {...props}
    >
      <div className={`hover-border-gradient-inner ${className}`}>
        {children}
      </div>
      <motion.div
        className="hover-border-gradient-animated"
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className="hover-border-gradient-bg" />
    </Tag>
  );
}
