import { update } from "@/lib/db";
import { distanceMiles, locatePostcode } from "@/lib/postcode";
import { agents } from "@/lib/seed";
import { makeId } from "@/lib/utils";
import { fail, ok, type Result } from "@/types/api";
import type { Agent } from "@/types/agent";
import type { AgentCriteria, AgentSearchOutcome, AgentMatch } from "@/types/search";
import type { Enquiry, EnquiryDraft } from "@/types/user";
import { enquirySchema } from "@/validation/agent.schema";
import { validate } from "@/validation";

export async function listAgents(): Promise<Agent[]> {
  return agents;
}

export async function getAgent(id: string): Promise<Agent | null> {
  return agents.find((agent) => agent.id === id) ?? null;
}

/** Synchronous variant for server components that prerender agent pages. */
export function getAgentSync(id: string): Agent | undefined {
  return agents.find((agent) => agent.id === id);
}

export async function searchAgents(
  criteria: AgentCriteria,
): Promise<AgentSearchOutcome> {
  const needle = criteria.query.trim().toLowerCase();
  const place = criteria.location.trim();
  const located = place ? locatePostcode(place) : null;
  const centre = located
    ? { lat: located.lat, lng: located.lng, label: located.town }
    : null;

  const matches: AgentMatch[] = [];

  for (const agent of agents) {
    if (
      criteria.specialisation &&
      !agent.specialisations.includes(criteria.specialisation)
    ) {
      continue;
    }

    if (needle) {
      const haystack = [
        agent.name,
        agent.agency,
        agent.town,
        agent.postcode,
        ...agent.areasCovered,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) continue;
    }

    const distance = centre ? distanceMiles(centre, agent) : null;

    // A town typed into the location box may not be a known postcode, so fall
    // back to matching the areas an agent says they cover.
    if (place && !centre) {
      const covers = [agent.town, agent.postcode, ...agent.areasCovered]
        .join(" ")
        .toLowerCase();
      if (!covers.includes(place.toLowerCase())) continue;
    } else if (distance !== null && distance > criteria.radius) {
      continue;
    }

    matches.push({ agent, distance });
  }

  matches.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    return b.agent.rating - a.agent.rating;
  });

  return { matches, centre };
}

export async function sendEnquiry(draft: EnquiryDraft): Promise<Result<Enquiry>> {
  const parsed = validate(enquirySchema, draft);
  if (!parsed.ok) {
    const [field, message] = Object.entries(parsed.errors)[0];
    return fail(message, field);
  }
  if (!(await getAgent(draft.agentId))) {
    return fail("That agent is no longer listed.");
  }

  const enquiry: Enquiry = {
    ...draft,
    email: draft.email.trim().toLowerCase(),
    id: makeId("enq"),
    sentAt: new Date().toISOString(),
  };

  update((state) => ({ ...state, enquiries: [enquiry, ...state.enquiries] }));
  return ok(enquiry);
}

