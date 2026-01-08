export interface TimelineEvent {
  id: string;
  title: string;
  summary: string | null;
  year: number;
  endYear: number | null;
  importance: number;
  scope: string;
}

export interface TimelineMargin {
  bottom: number;
}

export interface TimelineConfig {
  minYear: number;
  maxYear: number;
  scaleExtent: [number, number];
  colors: {
    background: string;
    axis: string;
    tickText: string;
    eventDot: string;
    labelText: string;
  };
}

export interface TimePeriod {
  name: string;
  shortName: string;
  startYear: number;
  endYear: number;
  color: string;
  tier: number;
}
