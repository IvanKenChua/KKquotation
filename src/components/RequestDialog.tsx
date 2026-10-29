import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Facebook,
  Mail,
  Printer,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { business, hasEmail, hasFacebook } from "@/config/business";
import { useCopy } from "@/hooks/useCopy";
import { formatCurrency, formatDateLong } from "@/pricing/format";
import {
  buildQuotationMailto,
  buildShareText,
} from "@/pricing/quote";
import type { QuotationDocument } from "@/pricing/types";

type RequestDialogProps = {
  open: boolean;
  quotation: QuotationDocument | null;
  onClose: () => void;
  onPrint: () => void;
};

export function RequestDialog({
  open,
  quotation,
  onClose,
  onPrint,
}: RequestDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const { copied, copy } = useCopy();

  const closeDialog = () => {
    setStep(1);
    setAcknowledged(false);
    onClose();
  };

  if (!quotation) return null;

  const totalLabel =
    quotation.total === null
      ? "Custom quotation required"
      : formatCurrency(quotation.total);
  const emailHref = hasEmail
    ? buildQuotationMailto(quotation, business.email)
    : null;

  return (
    <Modal open={open} onClose={closeDialog} labelledBy="request-dialog-title">
      {step === 1 ? (
        <>
          <p className="eyebrow text-teal-dark">Before you send</p>
          <h2 id="request-dialog-title" className="modal-title">
            Request this quotation
          </h2>
          <p className="modal-lede">
            Check the summary below. Nothing is sent or stored automatically —
            the next step gives you a choice of ways to send it.
          </p>

          <dl className="request-summary">
            <div>
              <dt>Quotation</dt>
              <dd>{quotation.quotationNumber}</dd>
            </div>
            <div>
              <dt>Prepared for</dt>
              <dd>
                {quotation.client.fullName.trim() || "Client name not provided"}
              </dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                {quotation.client.projectTitle.trim() ||
                  "Untitled design project"}
              </dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{quotation.service.name}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDateLong(quotation.quotationDate)}</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>{formatDateLong(quotation.validUntil)}</dd>
            </div>
            <div className="request-summary__total">
              <dt>Estimated total</dt>
              <dd>{totalLabel}</dd>
            </div>
          </dl>

          <label className="acknowledgement">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>
              I understand this is an estimate, not a confirmed booking or final
              invoice. Final pricing, scope, and availability still need
              confirmation from KENVAS KREATIVE.
            </span>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--green btn--lg"
              disabled={!acknowledged}
              onClick={() => setStep(2)}
            >
              Continue to send options
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn--outline btn--lg" onClick={closeDialog}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="modal-success-icon" aria-hidden="true">
            <Check size={20} />
          </span>
          <p className="eyebrow text-teal-dark">Quotation ready</p>
          <h2 id="request-dialog-title" className="modal-title">
            Your quotation is ready to send
          </h2>
          <p className="modal-lede">
            This website does not email or store your request automatically.
            Choose one of the options below to send the quotation to KENVAS
            KREATIVE.
          </p>

          <div className="send-options">
            {emailHref && (
              <a className="send-option" href={emailHref}>
                <span className="send-option__icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <span>
                  <strong>Open a prefilled email draft</strong>
                  <span>{business.email}</span>
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}

            {hasFacebook && (
              <a
                className="send-option"
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="send-option__icon" aria-hidden="true">
                  <Facebook size={18} />
                </span>
                <span>
                  <strong>Message KENVAS KREATIVE on Facebook</strong>
                  <span>Copy the summary first, then paste it into the chat.</span>
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}

            <button
              type="button"
              className="send-option"
              onClick={() => copy(buildShareText(quotation))}
            >
              <span className="send-option__icon" aria-hidden="true">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </span>
              <span>
                <strong>{copied ? "Summary copied" : "Copy quotation summary"}</strong>
                <span>Paste it into an email, message, or your preferred channel.</span>
              </span>
              <Copy size={15} aria-hidden="true" />
            </button>

            <button type="button" className="send-option" onClick={onPrint}>
              <span className="send-option__icon" aria-hidden="true">
                <Printer size={18} />
              </span>
              <span>
                <strong>Print or save as PDF</strong>
                <span>Use your browser’s print dialog to save an A4 copy.</span>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="send-note">
            <ShieldCheck size={16} aria-hidden="true" />
            <p>
              No request has been sent yet. Your quotation becomes a request
              only after you email or message it to KENVAS KREATIVE and receive
              confirmation.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--green btn--lg" onClick={closeDialog}>
              <Send size={16} aria-hidden="true" />
              Done
            </button>
            <button
              type="button"
              className="btn btn--outline btn--lg"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
