import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Printer,
  Send,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { business } from "@/config/business";
import { formatCurrency, formatDateLong } from "@/pricing/format";
import type { QuotationDocument } from "@/pricing/types";

type QuotePreviewProps = {
  quotation: QuotationDocument | null;
  copied: boolean;
  onCopy: () => void;
  onPrint: () => void;
  onRequest: () => void;
};

function contactLine(quotation: QuotationDocument): string {
  const parts = [quotation.client.email, quotation.client.contactNumber].filter(
    (value) => value.trim().length > 0
  );
  return parts.length > 0 ? parts.join(" · ") : "Contact details not provided";
}

export function QuotePreview({
  quotation,
  copied,
  onCopy,
  onPrint,
  onRequest,
}: QuotePreviewProps) {
  return (
    <section
      id="quotation"
      className="quotation-section section-pad"
      aria-labelledby="quotation-title"
    >
      <div className="container-kk">
        <div className="section-heading section-heading--quotation no-print">
          <div>
            <p className="eyebrow text-teal-dark">03 — Client quotation</p>
            <h2 id="quotation-title" className="section-title">
              Your quotation <span className="serif-accent">preview.</span>
            </h2>
          </div>
          <div className="quotation-heading__actions">
            <a href="#calculator" className="link-arrow">
              <ArrowLeft size={14} aria-hidden="true" />
              Back to calculator
            </a>
            {quotation && (
              <span className="quotation-heading__status">
                <span aria-hidden="true" />
                Estimate · not a booking
              </span>
            )}
          </div>
        </div>

        {!quotation ? (
          <div className="quotation-empty no-print">
            <span className="quotation-empty__icon" aria-hidden="true">
              <FileText size={24} />
            </span>
            <h3>Your quotation will appear here</h3>
            <p>
              Choose a service and enter your project details above. The
              itemized quotation updates as you go.
            </p>
            <a href="#services" className="btn btn--green btn--md">
              Choose a service
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        ) : (
          <>
            <div className="quotation-actions no-print">
              <button type="button" className="btn btn--ink btn--md" onClick={onPrint}>
                <Printer size={15} aria-hidden="true" />
                Print / Save PDF
              </button>
              <button type="button" className="btn btn--outline btn--md" onClick={onCopy}>
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy summary"}
              </button>
              <button type="button" className="btn btn--green btn--md" onClick={onRequest}>
                <Send size={15} aria-hidden="true" />
                {quotation.requiresManualReview
                  ? "Request a Custom Quote"
                  : "Request This Quotation"}
              </button>
            </div>

            <article className="quotation-sheet" aria-label="Client quotation">
              <header className="quote-head">
                <div className="quote-brand">
                  <Logo />
                  <p>{business.tagline}</p>
                </div>
                <div className="quote-head__meta">
                  <span className="quote-kicker">Design service quotation</span>
                  <strong>{quotation.quotationNumber}</strong>
                  <span>{formatDateLong(quotation.quotationDate)}</span>
                  <span className="quote-status">
                    {quotation.requiresManualReview
                      ? "Custom quotation"
                      : "Estimated quotation"}
                  </span>
                </div>
              </header>

              <div className="quote-rule" aria-hidden="true" />

              <section className="quote-parties" aria-label="Client and project">
                <div>
                  <p className="quote-label">Prepared for</p>
                  <p className="quote-value quote-value--strong">
                    {quotation.client.fullName.trim() || "Client name"}
                  </p>
                  {quotation.client.businessName.trim() && (
                    <p className="quote-value">
                      {quotation.client.businessName.trim()}
                    </p>
                  )}
                  <p className="quote-value quote-value--muted">
                    {contactLine(quotation)}
                  </p>
                </div>
                <div>
                  <p className="quote-label">Project</p>
                  <p className="quote-value quote-value--strong">
                    {quotation.client.projectTitle.trim() || "Untitled project"}
                  </p>
                  {quotation.client.projectDescription.trim() && (
                    <p className="quote-value quote-value--muted">
                      {quotation.client.projectDescription.trim()}
                    </p>
                  )}
                  {quotation.client.preferredDeadline && (
                    <p className="quote-value quote-value--muted">
                      Preferred deadline:{" "}
                      {formatDateLong(quotation.client.preferredDeadline)}
                    </p>
                  )}
                </div>
              </section>

              <section className="quote-block" aria-labelledby="quote-specs-title">
                <h3 id="quote-specs-title" className="quote-block__title">
                  Project specifications
                </h3>
                <dl className="quote-specs">
                  {quotation.specifications.map((specification) => (
                    <div key={specification.label}>
                      <dt>{specification.label}</dt>
                      <dd>{specification.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="quote-block" aria-labelledby="quote-charges-title">
                <h3 id="quote-charges-title" className="quote-block__title">
                  Itemized charges
                </h3>

                {quotation.requiresManualReview ? (
                  <div className="quote-manual">
                    <p className="quote-manual__title">Custom quotation required</p>
                    <p>
                      {quotation.reviewMessage ??
                        "This project requires a personalized quotation. Submit your project details so we can review the scope and confirm the price."}
                    </p>
                    <p className="quote-manual__meta">
                      The final amount will be confirmed after the scope review.
                    </p>
                  </div>
                ) : (
                  <div className="quote-table-wrap">
                    <table className="quote-table">
                      <thead>
                        <tr>
                          <th scope="col">Charge</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="quote-table__amount">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotation.lines.map((line) => (
                          <tr key={line.id}>
                            <th scope="row">{line.label}</th>
                            <td>{line.description}</td>
                            <td
                              className={`quote-table__amount ${
                                line.amount === 0 ? "is-zero" : ""
                              }`}
                            >
                              {line.amount === 0
                                ? "No charge"
                                : formatCurrency(line.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan={2}>
                            Total estimated project fee
                          </th>
                          <td className="quote-table__amount">
                            {quotation.total === null
                              ? "To be quoted"
                              : formatCurrency(quotation.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </section>

              <section className="quote-details" aria-label="Quotation terms">
                <div>
                  <h3 className="quote-block__title">Terms and timing</h3>
                  <dl className="quote-terms">
                    <div>
                      <dt>Estimated turnaround</dt>
                      <dd>{quotation.estimatedTurnaround}</dd>
                    </div>
                    <div>
                      <dt>Included revisions</dt>
                      <dd>
                        {quotation.includedRevisions}
                        {quotation.totalRevisions > quotation.includedRevisions
                          ? ` (+${
                              quotation.totalRevisions -
                              quotation.includedRevisions
                            } extra)`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Payment terms</dt>
                      <dd>{quotation.paymentTerms}</dd>
                    </div>
                    <div>
                      <dt>Quotation valid until</dt>
                      <dd>{formatDateLong(quotation.validUntil)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="quote-block__title">Notes</h3>
                  <p className="quote-note">
                    {quotation.notes || "No additional notes provided."}
                  </p>
                  {quotation.specialInstructions && (
                    <>
                      <p className="quote-label quote-label--spaced">
                        Special instructions
                      </p>
                      <p className="quote-note">
                        {quotation.specialInstructions}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <footer className="quote-foot">
                <div className="quote-disclaimers">
                  <p>{quotation.estimateDisclaimer}</p>
                  <p>{quotation.scopeDisclaimer}</p>
                </div>
                <div className="quote-signoff">
                  <p>Thank you for considering KENVAS KREATIVE.</p>
                  <span>Every idea deserves a canvas.</span>
                </div>
              </footer>
            </article>

            <p className="quotation-footnote no-print">
              Printing or saving this quotation does not confirm a booking or
              create a final invoice. Send the quotation to KENVAS KREATIVE for
              scope, availability, and final pricing confirmation.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
