export type DatePrecision = "day" | "month" | "year" | "decade" | "century";
export type EventScope = "global" | "regional" | "local";
export type EventStatus = "draft" | "pending" | "approved" | "rejected";

export interface DbEvent {
  id: string;
  title: string;
  summary: string | null;
  start_year: number;
  start_month: number | null;
  start_day: number | null;
  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
  date_precision: DatePrecision;
  scope: EventScope;
  importance: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}
