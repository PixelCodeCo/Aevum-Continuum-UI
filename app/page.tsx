import { Timeline } from "@/app/components/Timeline";
import { SAMPLE_EVENTS } from "@/app/constants/timeline";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Timeline events={SAMPLE_EVENTS} />
      {/* <Footer /> */}
    </div>
  );
}
