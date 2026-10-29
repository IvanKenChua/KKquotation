import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import { QUOTE_TERMS } from "@/data/pricing";
import { formatCurrency } from "@/pricing/format";
import { PRICING_METHOD_LABELS } from "@/pricing/labels";
import type { QuoteCalculation } from "@/pricing/types";

type PriceSummaryProps = {
  calculation: QuoteCalculation | null;
  onReview: () => void;
  onRequest: () => void;
};

function SummaryRow({
  label,
  value,
  sublabel,
  negative = false,
  zeroText = "No additional charge",
}: {
  label: string;
  value: number;
  sublabel?: string;
  negative?: boolean;
  zeroText?: string;
}) {
  return (
    <div className="summary-row">
      <dt>
        {label}
        {sublabel && <span>{sublabel}</span>}
      </dt>
      <dd className={negative ? "is-negative" : undefined}>
        {value === 0 ? zeroText : formatCurrency(value)}
      </dd>
    </div>
  );
}

export function PriceSummary({
  calculation,
  onReview,
  onRequest,
}: PriceSummaryProps) {
  if (!calculation) {
    return (
      <aside className="price-summary price-summary--empty" aria-label="Price summary">
        <div className="price-summary__head">
          <p className="eyebrow">Live estimate</p>
          <h2>Price summary</h2>
        </div>
        <div className="summary-empty">
          <span aria-hidden="true">
            <Sparkles size={21} />
          </span>
          <h3>Your estimate starts here</h3>
          <p>
            Select a design service and the itemized estimate will appear in
            this panel as you configure the project.
          </p>
          <a href="#services" className="btn btn--outline btn--sm">
            Browse services
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </aside>
    );
  }

  const { service } = calculation;
  const warnings = calculation.warnings.filter(
    (warning, index, all) =>
      all.findIndex((item) => item.message === warning.message) === index
  );

  return (
    <aside
      id="price-summary"
      className="price-summary"
      aria-label="Live price summary"
    >
      <div className="price-summary__head">
        <div>
          <p className="eyebrow">Live estimate</p>
          <h2>Price summary</h2>
        </div>
        <span className="live-pill">
          <span aria-hidden="true" />
          Updates instantly
        </span>
      </div>

      <div className="price-summary__service">
        <div>
          <span>Selected service</span>
          <strong>{service.name}</strong>
        </div>
        <span className="method-badge">
          {PRICING_METHOD_LABELS[service.pricingMethod]}
        </span>
      </div>

      {calculation.requiresManualReview ? (
        <div className="manual-review">
          <span className="manual-review__icon" aria-hidden="true">
            <AlertCircle size={19} />
          </span>
          <div>
            <h3>Custom quotation required</h3>
            <p>
              {calculation.reviewMessage ??
                "This project needs a personalized quotation. Submit your details so we can review the scope and confirm the price."}
            </p>
            <p className="manual-review__meta">
              {calculation.includedRevisions} revisions included ·{" "}
              {calculation.totalRevisions} total with extras
            </p>
          </div>
        </div>
      ) : (
        <>
          <dl className="summary-lines">
            <SummaryRow
              label="Base design fee"
              value={calculation.baseFee}
              zeroText="To be quoted"
            />
            <SummaryRow
              label="Additional quantity"
              value={calculation.quantityCharges}
              sublabel={
                calculation.quantity.applies
                  ? calculation.quantity.additional > 0
                    ? `${calculation.quantity.additional} beyond ${calculation.quantity.included} included`
                    : `Within ${calculation.quantity.included} included`
                  : "Fixed package"
              }
            />
            <SummaryRow
              label="Complexity adjustment"
              value={calculation.complexityAdjustment}
            />
            <SummaryRow
              label="Content / photo"
              value={calculation.contentPhotoCharges}
            />
            <SummaryRow
              label="Additional services"
              value={calculation.additionalServices}
              sublabel="Variations, revisions, and add-ons"
            />
            <SummaryRow
              label="Rush / Express fee"
              value={calculation.urgencyFee}
              zeroText="Standard turnaround"
            />
            {calculation.discountAmount > 0 && (
              <>
                <div className="summary-row summary-row--subtotal">
                  <dt>Subtotal before discount</dt>
                  <dd>{formatCurrency(calculation.subtotal ?? 0)}</dd>
                </div>
                <SummaryRow
                  label="Discount"
                  value={-calculation.discountAmount}
                  negative
                />
              </>
            )}
          </dl>

          <div className="summary-total" aria-live="polite" aria-atomic="true">
            <span>Estimated total</span>
            <strong>{formatCurrency(calculation.total ?? 0)}</strong>
            <small>PHP · estimate only</small>
          </div>

          <div className="summary-revisions">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>
              {calculation.includedRevisions} revisions included
              {calculation.extraRevisions > 0
                ? ` + ${calculation.extraRevisions} extra`
                : ""}
            </span>
          </div>
        </>
      )}

      {warnings.length > 0 && (
        <ul className="summary-warnings">
          {warnings.map((warning) => (
            <li
              key={`${warning.code}-${warning.message}`}
              className={`summary-warning summary-warning--${warning.severity}`}
            >
              {warning.severity === "warning" ? (
                <AlertCircle size={15} aria-hidden="true" />
              ) : (
                <Info size={15} aria-hidden="true" />
              )}
              <span>{warning.message}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="summary-note">{QUOTE_TERMS.scopeNote}</p>

      <div className="summary-actions">
        <button type="button" className="btn btn--green btn--md" onClick={onReview}>
          Review full quotation
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn--outline btn--md"
          onClick={onRequest}
        >
          {calculation.requiresManualReview
            ? "Request a custom quote"
            : "Request this quotation"}
        </button>
      </div>
    </aside>
  );
}
