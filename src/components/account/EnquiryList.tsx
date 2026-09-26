import Link from "next/link";
import { ROUTES } from "@/constants/navigation";
import { getAgentSync } from "@/services/agent.service";
import { formatDate } from "@/lib/utils";
import type { Enquiry } from "@/types/user";
import { Card } from "@/components/ui";

export function EnquiryList({ enquiries }: { enquiries: Enquiry[] }) {
  if (enquiries.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line bg-surface px-6 py-8 text-center text-sm text-ink-muted">
        You haven&apos;t contacted any agents yet. Messages you send from a property or
        agent page will appear here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {enquiries.map((enquiry) => {
        const agent = getAgentSync(enquiry.agentId);
        return (
          <li key={enquiry.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">
                  {agent ? `${agent.agency} — ${agent.name}` : "Agent"}
                </p>
                <p className="text-sm text-ink-muted">{formatDate(enquiry.sentAt)}</p>
              </div>

              {enquiry.propertyId && (
                <Link
                  href={ROUTES.property(enquiry.propertyId)}
                  className="mt-1 inline-block text-sm text-link underline underline-offset-4"
                >
                  View the property
                </Link>
              )}

              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {enquiry.message}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
