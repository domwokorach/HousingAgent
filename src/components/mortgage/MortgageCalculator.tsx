"use client";

import { useId, useState } from "react";
import { calculateMortgage, stampDuty } from "@/lib/mortgage";
import { formatMoney } from "@/lib/utils";
import type { Property } from "@/types/property";
import { Checkbox, Field, Input, Select } from "@/components/ui";
import { CostRow } from "./CostRow";

const DEPOSIT_PERCENTAGES = [5, 10, 15, 20, 25, 30, 40, 50];
const TERMS = [10, 15, 20, 25, 30, 35, 40];

/** Deposit, rate and term, against the monthly repayment and cash needed. */
export function MortgageCalculator({ property }: { property: Property }) {
  const id = useId();
  const [depositPercent, setDepositPercent] = useState(10);
  const [interestRate, setInterestRate] = useState(4.5);
  const [termYears, setTermYears] = useState(30);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);

  const result = calculateMortgage({
    price: property.price,
    depositPercent,
    interestRate,
    termYears,
  });
  const duty = stampDuty(property.price, firstTimeBuyer);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Your mortgage
        </h3>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Deposit" htmlFor={`${id}-deposit`}>
            <Select
              id={`${id}-deposit`}
              value={depositPercent}
              onChange={(event) => setDepositPercent(Number(event.target.value))}
            >
              {DEPOSIT_PERCENTAGES.map((percent) => (
                <option key={percent} value={percent}>
                  {percent}% — {formatMoney((property.price * percent) / 100)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Interest rate (%)" htmlFor={`${id}-rate`}>
            <Input
              id={`${id}-rate`}
              type="number"
              min={0}
              max={20}
              step={0.05}
              value={interestRate}
              onChange={(event) =>
                setInterestRate(Math.min(20, Math.max(0, Number(event.target.value) || 0)))
              }
            />
          </Field>

          <Field label="Mortgage term" htmlFor={`${id}-term`} className="sm:col-span-2">
            <Select
              id={`${id}-term`}
              value={termYears}
              onChange={(event) => setTermYears(Number(event.target.value))}
            >
              {TERMS.map((years) => (
                <option key={years} value={years}>
                  {years} years
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Checkbox
          id={`${id}-ftb`}
          className="mt-4"
          checked={firstTimeBuyer}
          onChange={(event) => setFirstTimeBuyer(event.target.checked)}
          label="I'm a first-time buyer (affects stamp duty)"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          What it costs
        </h3>
        <dl className="mt-3">
          <CostRow label="Purchase price" value={formatMoney(property.price)} />
          <CostRow
            label="Deposit"
            hint={`${depositPercent}% of the price`}
            value={formatMoney(result.deposit)}
          />
          <CostRow
            label="Mortgage amount"
            hint={`${result.loanToValue.toFixed(0)}% loan to value`}
            value={formatMoney(result.loan)}
          />
          <CostRow
            label="Estimated monthly payment"
            hint={`${interestRate}% over ${termYears} years, repayment`}
            value={formatMoney(result.monthlyPayment, true)}
            strong
          />
          <CostRow
            label="Total interest over the term"
            value={formatMoney(result.totalInterest)}
          />
          <CostRow
            label="Stamp duty"
            hint={firstTimeBuyer ? "First-time buyer rates" : "Standard residential rates"}
            value={formatMoney(duty)}
          />
          <CostRow
            label="Cash needed up front"
            hint="Deposit plus stamp duty"
            value={formatMoney(result.deposit + duty)}
            strong
          />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          An illustration, not a mortgage offer or financial advice. Rates, fees and
          eligibility vary by lender — speak to a qualified adviser before committing.
        </p>
      </div>
    </div>
  );
}
