import { describe, expect, it } from "vitest";
import {
  calculateMortgage,
  depositCapWeeks,
  estimatedRunningCosts,
  monthlyFromWeekly,
  rentDeposit,
  stampDuty,
  weeklyFromMonthly,
} from "@/lib/mortgage";
import type { Property } from "@/types/property";

const rental = {
  price: 3150,
  bedrooms: 2,
  sizeSqFt: 1120,
  depositWeeks: 5,
} as Property;

describe("weekly and monthly rent", () => {
  it("converts a month to a week over a 12/52 year", () => {
    // £3,150 pcm -> (3150 * 12) / 52
    expect(weeklyFromMonthly(3150)).toBeCloseTo(726.92, 2);
  });

  it("round-trips back to the monthly figure", () => {
    expect(monthlyFromWeekly(weeklyFromMonthly(1500))).toBeCloseTo(1500, 6);
  });
});

describe("deposit cap", () => {
  it("is five weeks below the £50,000 annual rent threshold", () => {
    expect(depositCapWeeks(4000)).toBe(5); // £48,000 a year
  });

  it("is six weeks at or above the threshold", () => {
    expect(depositCapWeeks(4167)).toBe(6); // £50,004 a year
  });

  it("uses the listing's own figure when one is set", () => {
    expect(rentDeposit(rental)).toBeCloseTo(weeklyFromMonthly(3150) * 5, 2);
  });
});

describe("running costs", () => {
  it("sums its parts", () => {
    const costs = estimatedRunningCosts(rental);
    const parts =
      costs.councilTax + costs.energy + costs.water + costs.broadband + costs.contents;
    expect(costs.total).toBe(parts);
  });

  it("scales with bedrooms", () => {
    const bigger = estimatedRunningCosts({ ...rental, bedrooms: 5 } as Property);
    expect(bigger.total).toBeGreaterThan(estimatedRunningCosts(rental).total);
  });
});

describe("calculateMortgage", () => {
  it("matches the standard repayment formula", () => {
    const result = calculateMortgage({
      price: 1_250_000,
      depositPercent: 10,
      interestRate: 4.5,
      termYears: 30,
    });

    expect(result.deposit).toBe(125_000);
    expect(result.loan).toBe(1_125_000);
    expect(result.loanToValue).toBeCloseTo(90, 6);
    expect(result.monthlyPayment).toBeCloseTo(5700.21, 2);
    expect(result.totalInterest).toBeCloseTo(result.totalRepaid - result.loan, 6);
  });

  it("divides the loan evenly at a zero rate", () => {
    const result = calculateMortgage({
      price: 240_000,
      depositPercent: 0,
      interestRate: 0,
      termYears: 20,
    });
    expect(result.monthlyPayment).toBeCloseTo(1000, 6);
  });

  it("has nothing to repay when the deposit covers the price", () => {
    const result = calculateMortgage({
      price: 300_000,
      depositPercent: 100,
      interestRate: 5,
      termYears: 25,
    });
    expect(result.loan).toBe(0);
    expect(result.monthlyPayment).toBe(0);
  });
});

describe("stampDuty", () => {
  it("charges nothing up to £125,000", () => {
    expect(stampDuty(125_000)).toBe(0);
  });

  it("applies the standard bands", () => {
    // 2% of 125k + 5% of 675k + 10% of 325k
    expect(stampDuty(1_250_000)).toBeCloseTo(68_750, 6);
  });

  it("gives first-time buyers relief up to £500,000", () => {
    expect(stampDuty(300_000, true)).toBe(0);
    expect(stampDuty(450_000, true)).toBeCloseTo(7_500, 6);
  });

  it("drops first-time buyer relief above £500,000", () => {
    expect(stampDuty(600_000, true)).toBe(stampDuty(600_000, false));
  });
});
