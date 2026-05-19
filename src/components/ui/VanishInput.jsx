import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * VanishInput — input with animated cycling placeholders and vanish-on-submit effect.
 * Ported from Aceternity UI PlaceholdersAndVanishInput.
 *
 * Props:
 *  - placeholders: string[] — rotating placeholder texts
 *  - value: string — controlled value
 *  - onChange: (e) => void
 *  - inputMode: string — "text" | "numeric"
 *  - maxLength: number
 *  - label: string — optional label above input
 *  - type: string — input type
 */
export default function VanishInput({
  placeholders = [],
  value: controlledValue,
  onChange,
  inputMode = "text",
  maxLength,
  label,
  type = "text",
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const newDataRef = useRef([]);
  const [animating, setAnimating] = useState(false);

  const startAnimation = () => {
    if (placeholders.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };

  useEffect(() => {
    startAnimation();
    const handleVis = () => {
      if (document.visibilityState !== "visible" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        startAnimation();
      }
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, [placeholders]);

  // Canvas rendering has been removed to maximize typing performance
  // on low-end devices, as extracting imageData on every keystroke causes lag.

  return (
    <div className="vanish-input-group">
      {label && <label className="vanish-input-label">{label}</label>}
      <div className="vanish-input-wrapper">
        {/* Canvas removed for performance */}
        <input
          ref={inputRef}
          value={controlledValue || ""}
          onChange={(e) => {
            if (!animating && onChange) onChange(e);
          }}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`vanish-input ${animating ? "text-transparent" : ""}`}
        />

        {/* Animated placeholder */}
        <div className="vanish-input-placeholder-area">
          <AnimatePresence mode="wait">
            {!controlledValue && (
              <motion.p
                initial={{ y: 5, opacity: 0 }}
                key={`placeholder-${currentPlaceholder}`}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.3, ease: "linear" }}
                className="vanish-input-placeholder"
              >
                {placeholders[currentPlaceholder]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
