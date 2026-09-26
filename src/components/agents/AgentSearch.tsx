"use client";

import { useState } from "react";
import { SPECIALISATIONS, SPECIALISATION_LABELS } from "@/constants/accountTypes";
import { AGENT_DISTANCE_OPTIONS } from "@/constants/propertyTypes";
import { DEFAULT_AGENT_CRITERIA, useAgents } from "@/hooks/useAgents";
import type { AgentCriteria } from "@/types/search";
import type { Specialisation } from "@/types/agent";
import { IconPin, IconSearch } from "@/components/ui/Icons";
import { Button, EmptyState, Field, Input, Select } from "@/components/ui";
import { RadiusFilter } from "@/components/search/LocationFilter";
import { AgentCard } from "./AgentCard";

/** The Find an Agent page: search, then a grid of matching agencies. */
export function AgentSearch() {
  const { criteria, setCriteria, reset, matches, centre } = useAgents();
  const [draft, setDraft] = useState<AgentCriteria>(DEFAULT_AGENT_CRITERIA);

  const set = <K extends keyof AgentCriteria>(key: K, value: AgentCriteria[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const clearAll = () => {
    setDraft(DEFAULT_AGENT_CRITERIA);
    reset();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Find an agent
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Search by agent or agency name, by postcode, or by what they specialise in —
          then see what they currently have on their books.
        </p>
      </header>

      <form
        className="mt-8 rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setCriteria(draft);
        }}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <Field label="Agent or agency name" htmlFor="agent-q">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
              <Input
                id="agent-q"
                value={draft.query}
                onChange={(event) => set("query", event.target.value)}
                placeholder="e.g. Harper, Kestrel"
                className="pl-10"
              />
            </div>
          </Field>

          <Field label="Postcode, town or city" htmlFor="agent-location">
            <div className="relative">
              <IconPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
              <Input
                id="agent-location"
                value={draft.location}
                onChange={(event) => set("location", event.target.value)}
                placeholder="e.g. SW11 or Leeds"
                autoComplete="postal-code"
                className="pl-10"
              />
            </div>
          </Field>

          <RadiusFilter
            idPrefix="agent"
            radius={draft.radius}
            onChange={(radius) => set("radius", radius)}
            options={AGENT_DISTANCE_OPTIONS}
            label="Distance"
          />

          <Field label="Specialisation" htmlFor="agent-spec">
            <Select
              id="agent-spec"
              value={draft.specialisation}
              onChange={(event) =>
                set("specialisation", event.target.value as Specialisation | "")
              }
            >
              <option value="">Any specialisation</option>
              {SPECIALISATIONS.map((value) => (
                <option key={value} value={value}>
                  {SPECIALISATION_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="submit" size="lg">
            <IconSearch className="size-5" />
            Search agents
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </form>

      <p className="mt-8 text-lg font-semibold text-ink" aria-live="polite">
        {matches.length} {matches.length === 1 ? "agent" : "agents"}
        {centre && (
          <span className="ml-2 text-base font-normal text-ink-muted">
            within {criteria.radius} miles of {centre.label}
          </span>
        )}
      </p>

      {matches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No agents match this search"
            description="Try widening the distance, clearing the specialisation filter, or searching a nearby town."
            action={
              <Button variant="secondary" onClick={clearAll}>
                Show all agents
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {matches.map((match) => (
            <AgentCard key={match.agent.id} agent={match.agent} distance={match.distance} />
          ))}
        </div>
      )}
    </div>
  );
}
