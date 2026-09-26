import type { Metadata } from "next";
import { CreatePropertyView } from "@/components/properties/CreatePropertyView";

export const metadata: Metadata = {
  title: "Add a property",
  description: "List a property to rent or sell on Housing Agent.",
};

export default function CreatePropertyPage() {
  return <CreatePropertyView />;
}
