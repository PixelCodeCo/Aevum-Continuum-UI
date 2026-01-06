export interface TimelineEvent {
  title: string;
  year: number;
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
