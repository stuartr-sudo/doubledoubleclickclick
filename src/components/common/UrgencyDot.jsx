import React from "react";

/**
 * UrgencyDot
 * Backward compatible:
 * - level: 0 (none), 1 (gentle), 2 (warning), 3 (urgent)
 * New:
 * - state: "none" | "fresh" | "gentle" | "warning" | "urgent"
 * size: px diameter (default 10)
 */
export default function UrgencyDot({ level = 0, state, size = 10, className = "", label = "Urgency" }) {
  // Map legacy numeric level to state if state not provided
  const resolvedState = state || (level >= 3 ? "urgent" : level === 2 ? "warning" : level === 1 ? "gentle" : "none");
  if (!resolvedState || resolvedState === "none") return null;

  const styles = {
    fresh:   { ring: "bg-emerald-400/30", dot: "bg-emerald-300", dur: "2.2s" },
    gentle:  { ring: "bg-yellow-400/30",  dot: "bg-yellow-300",  dur: "2s"   },
    warning: { ring: "bg-amber-500/30",   dot: "bg-amber-400",   dur: "1.4s" },
    urgent:  { ring: "bg-red-600/30",     dot: "bg-red-500",     dur: "0.9s" },
  }[resolvedState];

  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <span className={`relative inline-flex items-center ${className}`} aria-label={label}>
      <span
        className={`absolute inline-flex rounded-full ${styles.ring} animate-ping`}
        style={{ width: px, height: px, animationDuration: styles.dur }}
      />
      <span
        className={`relative inline-flex rounded-full ${styles.dot}`}
        style={{ width: px, height: px, boxShadow: `0 0 10px 2px` }}
      />
    </span>
  );
}