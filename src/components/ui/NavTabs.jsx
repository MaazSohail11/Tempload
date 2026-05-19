import { useState } from "react";
import { motion } from "motion/react";
import HoverBorderGradient from "./HoverBorderGradient.jsx";

/**
 * Animated navigation tabs with HoverBorderGradient effect.
 * Each tab is a gradient-bordered pill that highlights on hover.
 */
export default function NavTabs({ tabs, activeValue, onTabChange }) {
  return (
    <div className="nav-tabs">
      {tabs.map((tab) => (
        <HoverBorderGradient
          key={tab.value}
          as="button"
          containerClassName={`nav-tab-hbg ${activeValue === tab.value ? "nav-tab-active" : ""}`}
          className="nav-tab-hbg-inner"
          onClick={() => onTabChange(tab.value)}
          duration={1.5}
        >
          {tab.title}
        </HoverBorderGradient>
      ))}
    </div>
  );
}
