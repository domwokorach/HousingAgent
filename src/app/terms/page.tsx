import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/navigation";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The terms covering use of the Housing Agent demonstration application.",
};

const SECTIONS = [
  {
    id: "about",
    heading: "1. About this application",
    body: [
      "Housing Agent is a demonstration application. The properties, agents, reviews and prices it displays are sample data created for the purposes of the demo. They do not describe real homes and should not be relied on.",
      "No part of this application forms an offer, a tenancy agreement, a contract of sale, or financial advice.",
    ],
  },
  {
    id: "accounts",
    heading: "2. Your account",
    body: [
      "You are responsible for the accuracy of the details you provide and for keeping your password to yourself.",
      "Accounts may be deleted by you at any time from Account Settings. Deletion is permanent and removes your profile, saved properties, listings and enquiry history from this browser.",
    ],
  },
  {
    id: "listings",
    heading: "3. Listing a property",
    body: [
      "Landlords, sellers and agents must only list properties they are entitled to market, and must describe them accurately.",
      "Photographs you upload must be of the property being advertised and must be yours to use.",
    ],
  },
  {
    id: "pricing",
    heading: "4. Prices and calculations",
    body: [
      "Rent, deposit, running cost, mortgage and stamp duty figures shown anywhere in this application are illustrations produced by a simple calculator.",
      "They are not quotes, not offers of credit, and not a substitute for advice from a qualified mortgage adviser or solicitor.",
    ],
  },
  {
    id: "privacy",
    heading: "5. Privacy",
    body: [
      "This application has no server component. Your account details, saved properties, listings and enquiries are stored in your own browser using localStorage, and are never transmitted to us or to anyone else.",
      "Clearing your browser's site data removes everything. Deleting your account from Account Settings does the same for your account's records.",
      "Because the data never leaves your device, please treat the app as you would any local note: do not enter a password you use elsewhere, and do not enter information about other people.",
    ],
  },
  {
    id: "liability",
    heading: "6. Liability",
    body: [
      "The application is provided as-is, without warranty. To the extent permitted by law, no liability is accepted for any loss arising from its use.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Terms and Conditions
      </h1>
      <p className="mt-3 text-ink-muted">
        Last updated 25 September 2026. Please read these before creating an account.
      </p>

      <nav aria-label="On this page" className="mt-8 rounded-card border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          On this page
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-sm text-link hover:underline">
                {section.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3 leading-relaxed text-ink-muted">
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-line pt-6 text-sm text-ink-muted">
        Ready to get started?{" "}
        <Link href={ROUTES.register} className="font-medium text-link underline underline-offset-4">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
