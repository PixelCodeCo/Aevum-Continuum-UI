import type { DbEvent } from "@/app/types/database";
import type { TimelineEvent } from "@/app/types/timeline";
import { createServerClient } from "@/app/lib/supabase";

export function mapDbEventToTimelineEvent(dbEvent: DbEvent): TimelineEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    summary: dbEvent.summary,
    year: dbEvent.start_year,
    endYear: dbEvent.end_year,
    importance: dbEvent.importance,
    scope: dbEvent.scope,
  };
}

export async function fetchEvents(): Promise<TimelineEvent[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .order("start_year", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return (data as DbEvent[]).map(mapDbEventToTimelineEvent);
}
