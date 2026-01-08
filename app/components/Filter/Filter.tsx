import { ListFilter } from "lucide-react";
import { FiltersModal } from "@/app/components/Modal/FiltersModal";
import { useState } from "react";

export function Filter() {
  const [hidden, setHidden] = useState(false);

  const filterModal = () => {
    setHidden(!hidden);
  };
  return (
    <>
      <div className="flex justify-center">
        <div
          className="border rounded-full p-2 border-zinc-400 mt-2 cursor-pointer"
          onClick={filterModal}
        >
          <ListFilter />
        </div>
      </div>
      {hidden && <FiltersModal />}
    </>
  );
}
