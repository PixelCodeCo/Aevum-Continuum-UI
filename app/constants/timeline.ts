import type { TimelineConfig, TimelineEvent } from "@/app/types/timeline";

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
  bottom: 80,
} as const;

export const INITIAL_YEAR_RANGE = {
  start: -3000,
  end: 2025,
} as const;

export const SAMPLE_EVENTS: TimelineEvent[] = [
  { title: "Pyramids of Giza", year: -2560 },
  { title: "Fall of Rome", year: 476 },
  { title: "Battle of Hastings", year: 1066 },
  { title: "French Revolution", year: 1789 },
  { title: "World War II", year: 1939 },
];
