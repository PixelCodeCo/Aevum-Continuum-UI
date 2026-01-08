import type { TimelineConfig, TimePeriod } from "@/app/types/timeline";

export const TIMELINE_CONFIG: TimelineConfig = {
  minYear: -300000,
  maxYear: 2500,
  scaleExtent: [0.5, 100],
  colors: {
    background: "#fafafa",
    axis: "#e5e5e5",
    tickText: "#888",
    eventDot: "#6366f1",
    labelText: "#374151",
  },
};

export const TIMELINE_MARGIN = {
  bottom: 100,
} as const;

export const INITIAL_YEAR_RANGE = {
  start: -3000,
  end: 2025,
} as const;

// Tier 0: Main sequential ages (no overlap, covers all of history)
// Tier 1: Cultural/political movements (overlay on tier 0)
// Tier 2: Additional movements that overlap with tier 1
export const TIME_PERIODS: TimePeriod[] = [
  // Tier 0 - Sequential Ages
  { name: "Paleolithic", shortName: "Paleo", startYear: -300000, endYear: -10000, color: "#2f4f3e", tier: 0 },
  { name: "Mesolithic", shortName: "Meso", startYear: -10000, endYear: -8000, color: "#4a7c59", tier: 0 },
  { name: "Neolithic", shortName: "Neo", startYear: -8000, endYear: -3300, color: "#d4a574", tier: 0 },
  { name: "Bronze Age", shortName: "Bronze", startYear: -3300, endYear: -1200, color: "#8c6d3f", tier: 0 },
  { name: "Iron Age", shortName: "Iron", startYear: -1200, endYear: -500, color: "#5f6a6a", tier: 0 },
  { name: "Classical Antiquity", shortName: "Classical", startYear: -500, endYear: 500, color: "#c2b280", tier: 0 },
  { name: "Medieval Period", shortName: "Medieval", startYear: 500, endYear: 1500, color: "#7a3e2e", tier: 0 },
  { name: "Early Modern", shortName: "Early Mod", startYear: 1500, endYear: 1800, color: "#4c6b8a", tier: 0 },
  { name: "Long 19th Century", shortName: "19th C", startYear: 1800, endYear: 1914, color: "#555555", tier: 0 },
  { name: "Modern Era", shortName: "Modern", startYear: 1914, endYear: 2030, color: "#3b6ea5", tier: 0 },

  // Tier 1 - Cultural Movements
  { name: "Renaissance", shortName: "Renaiss.", startYear: 1400, endYear: 1600, color: "#5b7c99", tier: 1 },
  { name: "Enlightenment", shortName: "Enlighten.", startYear: 1685, endYear: 1815, color: "#e6d8a3", tier: 1 },
  { name: "Cold War", shortName: "Cold War", startYear: 1947, endYear: 1991, color: "#2f4f7f", tier: 1 },

  // Tier 2 - Overlaps with Tier 1
  { name: "Industrial Revolution", shortName: "Industrial", startYear: 1760, endYear: 1840, color: "#6e6e6e", tier: 2 },
  { name: "Digital Age", shortName: "Digital", startYear: 1970, endYear: 2030, color: "#4fa3d1", tier: 2 },
];

export const HUMAN_LIFESPAN_YEARS = 80;
