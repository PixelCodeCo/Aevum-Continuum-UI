import { Timeline } from "@/app/components/Timeline";
import { fetchEvents } from "@/app/lib/events";

export default async function Home() {
  const events = await fetchEvents();

  return (
    <div className="relative overflow-hidden">
      <Timeline events={events} />
    </div>
  );
}
