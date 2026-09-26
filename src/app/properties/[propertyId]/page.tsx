import type { Metadata } from "next";
import { properties } from "@/lib/seed";
import { PropertyDetails } from "@/components/properties/PropertyDetails";

export function generateStaticParams() {
  return properties.map((property) => ({ propertyId: property.id }));
}

export async function generateMetadata(
  props: PageProps<"/properties/[propertyId]">,
): Promise<Metadata> {
  const { propertyId } = await props.params;
  const property = properties.find((item) => item.id === propertyId);
  if (!property) return { title: "Property" };

  return {
    title: `${property.title}, ${property.postcode}`,
    description: property.description.slice(0, 155),
  };
}

export default async function PropertyPage(
  props: PageProps<"/properties/[propertyId]">,
) {
  const { propertyId } = await props.params;
  // Listings created in this browser are unknown to the server, so the client
  // component resolves the id against the live store.
  return <PropertyDetails propertyId={propertyId} />;
}
