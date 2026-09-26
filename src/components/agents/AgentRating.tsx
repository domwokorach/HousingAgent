import { cx } from "@/lib/utils";
import { IconStar } from "@/components/ui/Icons";

/** Five stars filled to the nearest whole, with the value read out for AT. */
export function AgentRating({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex", className)} aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <IconStar
            key={step}
            className={cx("size-4", rating >= step - 0.25 ? "text-accent" : "text-line")}
          />
        ))}
      </span>
    </span>
  );
}
