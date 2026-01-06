import { Timeline } from "@/app/components/Timeline";
import { SAMPLE_EVENTS } from "@/app/constants/timeline";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Timeline events={SAMPLE_EVENTS} />
      <Footer />
    </>
  );
}
