import {
  depositCapWeeks,
  estimatedRunningCosts,
  rentDeposit,
  weeklyFromMonthly,
} from "@/lib/mortgage";
import { formatMoney } from "@/lib/utils";
import type { Property } from "@/types/property";
import { CostRow } from "./CostRow";

/** What a tenancy costs each month, and what is needed up front. */
export function RentCalculator({ property }: { property: Property }) {
  const weekly = weeklyFromMonthly(property.price);
  const deposit = rentDeposit(property);
  const weeks = property.depositWeeks ?? depositCapWeeks(property.price);
  const costs = estimatedRunningCosts(property);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          What you pay
        </h3>
        <dl className="mt-3">
          <CostRow label="Monthly rent" value={`${formatMoney(property.price)} pcm`} strong />
          <CostRow label="Weekly equivalent" value={`${formatMoney(weekly)} pw`} />
          <CostRow
            label="Tenancy deposit"
            hint={`${weeks} weeks' rent`}
            value={formatMoney(deposit)}
          />
          <CostRow
            label="Due before you move in"
            hint="First month's rent plus deposit"
            value={formatMoney(property.price + deposit)}
            strong
          />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Deposits are capped at five weeks&apos; rent (six where annual rent is £50,000 or
          more) under the Tenant Fees Act 2019.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Estimated monthly household costs
        </h3>
        <dl className="mt-3">
          <CostRow
            label="Council tax"
            hint={property.councilTaxBand ? `Band ${property.councilTaxBand}` : undefined}
            value={formatMoney(costs.councilTax)}
          />
          <CostRow label="Gas and electricity" value={formatMoney(costs.energy)} />
          <CostRow label="Water" value={formatMoney(costs.water)} />
          <CostRow label="Broadband" value={formatMoney(costs.broadband)} />
          <CostRow label="Contents insurance" value={formatMoney(costs.contents)} />
          <CostRow label="Estimated bills" value={`${formatMoney(costs.total)} pcm`} strong />
          <CostRow
            label="Rent plus bills"
            value={`${formatMoney(property.price + costs.total)} pcm`}
            strong
          />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Estimates only, based on the property size and bedroom count. Your actual bills
          will depend on your supplier, usage and local authority.
        </p>
      </div>
    </div>
  );
}
