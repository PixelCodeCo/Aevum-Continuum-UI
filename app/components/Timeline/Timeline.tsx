"use client";

import { useTimeline } from "@/app/hooks/useTimeline";
import type { TimelineEvent } from "@/app/types/timeline";
import { Filter } from "@/app/components/Filter/index";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const svgRef = useTimeline(events);

  return (
    <div className="relative">
      <div className="sticky z-40 top-14 right-0">
        <Filter />
      </div>
      <svg ref={svgRef} />
    </div>
  );
}
