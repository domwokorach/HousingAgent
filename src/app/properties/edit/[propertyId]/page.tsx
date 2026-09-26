import type { Metadata } from "next";
import { EditPropertyView } from "@/components/properties/EditPropertyView";

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Update the details and photos of your property listing.",
};

export default async function EditPropertyPage(
  props: PageProps<"/properties/edit/[propertyId]">,
) {
  const { propertyId } = await props.params;
  return <EditPropertyView propertyId={propertyId} />;
}
