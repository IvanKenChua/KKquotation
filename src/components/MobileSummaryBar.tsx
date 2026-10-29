import { ArrowUpRight, X } from "lucide-react";
import { formatCurrency } from "@/pricing/format";
import type { QuoteCalculation } from "@/pricing/types";

type MobileSummaryBarProps = {
  calculation: QuoteCalculation | null;
  onReview: () => void;
  onDismiss: () => void;
};

export function MobileSummaryBar({
  calculation,
  onReview,
  onDismiss,
}: MobileSummaryBarProps) {
  if (!calculation) return null;

  return (
    <div className="mobile-summary no-print" role="region" aria-label="Compact price summary">
      <div className="mobile-summary__amount">
        <span>{calculation.requiresManualReview ? "Custom quotation" : "Estimated total"}</span>
        <strong>
          {calculation.requiresManualReview
            ? "To be quoted"
            : formatCurrency(calculation.total ?? 0)}
        </strong>
      </div>
      <button type="button" className="btn btn--green btn--sm" onClick={onReview}>
        Review quote
        <ArrowUpRight size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mobile-summary__close"
        onClick={onDismiss}
        aria-label="Hide compact price summary"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
