import type { Property } from "@/types/property";

/** A rental month is 1/12 of a year, so a week is rent x 12 / 52. */
export function weeklyFromMonthly(monthly: number): number {
  return (monthly * 12) / 52;
}

export function monthlyFromWeekly(weekly: number): number {
  return (weekly * 52) / 12;
}

/**
 * Tenancy deposits in England are capped at 5 weeks' rent where annual rent is
 * under £50,000, and 6 weeks above that (Tenant Fees Act 2019).
 */
export function depositCapWeeks(monthlyRent: number): number {
  return monthlyRent * 12 >= 50_000 ? 6 : 5;
}

export function rentDeposit(property: Property): number {
  const weeks = property.depositWeeks ?? depositCapWeeks(property.price);
  return weeklyFromMonthly(property.price) * weeks;
}

/** Rough monthly running costs, scaled by size and bedroom count. */
export function estimatedRunningCosts(property: Property) {
  const councilTax = 105 + property.bedrooms * 38;
  const energy = 45 + Math.round(property.sizeSqFt * 0.055);
  const water = 26 + property.bedrooms * 8;
  const broadband = 30;
  const contents = 12 + property.bedrooms * 3;
  return {
    councilTax,
    energy,
    water,
    broadband,
    contents,
    total: councilTax + energy + water + broadband + contents,
  };
}

export interface MortgageInput {
  price: number;
  depositPercent: number;
  interestRate: number;
  termYears: number;
}

export interface MortgageResult {
  deposit: number;
  loan: number;
  monthlyPayment: number;
  totalRepaid: number;
  totalInterest: number;
  loanToValue: number;
}

/** Standard capital-and-interest repayment formula. */
export function calculateMortgage({
  price,
  depositPercent,
  interestRate,
  termYears,
}: MortgageInput): MortgageResult {
  const deposit = (price * depositPercent) / 100;
  const loan = Math.max(price - deposit, 0);
  const months = Math.max(Math.round(termYears * 12), 1);
  const monthlyRate = interestRate / 100 / 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loan / months
      : (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const totalRepaid = monthlyPayment * months;

  return {
    deposit,
    loan,
    monthlyPayment,
    totalRepaid,
    totalInterest: totalRepaid - loan,
    loanToValue: price > 0 ? (loan / price) * 100 : 0,
  };
}

/** Stamp duty (England & NI, standard residential rates from April 2025). */
export function stampDuty(price: number, firstTimeBuyer = false): number {
  const bands = firstTimeBuyer && price <= 500_000
    ? [
        { upTo: 300_000, rate: 0 },
        { upTo: 500_000, rate: 0.05 },
      ]
    : [
        { upTo: 125_000, rate: 0 },
        { upTo: 250_000, rate: 0.02 },
        { upTo: 925_000, rate: 0.05 },
        { upTo: 1_500_000, rate: 0.1 },
        { upTo: Infinity, rate: 0.12 },
      ];

  let owed = 0;
  let previous = 0;
  for (const band of bands) {
    if (price <= previous) break;
    owed += (Math.min(price, band.upTo) - previous) * band.rate;
    previous = band.upTo;
  }
  return owed;
}
