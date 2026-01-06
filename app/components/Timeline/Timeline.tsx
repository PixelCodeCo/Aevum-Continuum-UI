"use client";

import { useTimeline } from "@/app/hooks/useTimeline";
import type { TimelineEvent } from "@/app/types/timeline";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const svgRef = useTimeline(events);

  return <svg ref={svgRef} />;
}
