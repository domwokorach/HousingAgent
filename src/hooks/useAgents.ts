"use client";

import { useCallback, useMemo, useState } from "react";
import { agents } from "@/lib/seed";
import { distanceMiles, locatePostcode } from "@/lib/postcode";
import type { Agent } from "@/types/agent";
import type { AgentCriteria, AgentMatch, PlacePoint } from "@/types/search";

export const DEFAULT_AGENT_CRITERIA: AgentCriteria = {
  query: "",
  location: "",
  radius: 20,
  specialisation: "",
};

/**
 * Agent directory search. The seed agents are static, so this filters in
 * memory and keeps the applied criteria in component state — it mirrors
 * `agent.service.searchAgents` so the two can be swapped for a fetch later.
 */
export function useAgents(initial: AgentCriteria = DEFAULT_AGENT_CRITERIA) {
  const [criteria, setCriteria] = useState<AgentCriteria>(initial);

  const { matches, centre } = useMemo<{
    matches: AgentMatch[];
    centre: PlacePoint | null;
  }>(() => {
    const needle = criteria.query.trim().toLowerCase();
    const place = criteria.location.trim();
    const located = place ? locatePostcode(place) : null;
    const resolved = located
      ? { lat: located.lat, lng: located.lng, label: located.town }
      : null;

    const found: AgentMatch[] = [];

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

      const distance = resolved ? distanceMiles(resolved, agent) : null;

      if (place && !resolved) {
        const covers = [agent.town, agent.postcode, ...agent.areasCovered]
          .join(" ")
          .toLowerCase();
        if (!covers.includes(place.toLowerCase())) continue;
      } else if (distance !== null && distance > criteria.radius) {
        continue;
      }

      found.push({ agent, distance });
    }

    found.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return b.agent.rating - a.agent.rating;
    });

    return { matches: found, centre: resolved };
  }, [criteria]);

  const reset = useCallback(() => setCriteria(DEFAULT_AGENT_CRITERIA), []);

  const getAgent = useCallback(
    (id: string): Agent | undefined => agents.find((agent) => agent.id === id),
    [],
  );

  return { criteria, setCriteria, reset, matches, centre, getAgent, allAgents: agents };
}
