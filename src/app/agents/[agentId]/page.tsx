import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { agents } from "@/lib/seed";
import { getPropertiesByAgent } from "@/services/property.service";
import { AgentProfile } from "@/components/agents/AgentProfile";

export function generateStaticParams() {
  return agents.map((agent) => ({ agentId: agent.id }));
}

export async function generateMetadata(
  props: PageProps<"/agents/[agentId]">,
): Promise<Metadata> {
  const { agentId } = await props.params;
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) return { title: "Agent" };

  return { title: `${agent.agency}, ${agent.town}`, description: agent.bio };
}

export default async function AgentProfilePage(props: PageProps<"/agents/[agentId]">) {
  const { agentId } = await props.params;
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) notFound();

  const listings = await getPropertiesByAgent(agent.id);
  return <AgentProfile agent={agent} listings={listings} />;
}
