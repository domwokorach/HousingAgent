import type { Metadata } from "next";
import { AgentSearch } from "@/components/agents/AgentSearch";

export const metadata: Metadata = {
  title: "Find an agent",
  description:
    "Search housing agents by name, postcode, town, distance and specialisation, and see the properties they currently have listed.",
};

export default function AgentsPage() {
  return <AgentSearch />;
}
