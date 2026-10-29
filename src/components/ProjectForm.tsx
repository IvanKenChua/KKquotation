import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  Info,
  PencilRuler,
  Send,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ADD_ON_RATE,
  PUBLIC_ADD_ONS,
  QUOTE_TERMS,
} from "@/data/pricing";
import { formatCurrency, todayIso } from "@/pricing/format";
import {
  COMPLEXITY_LABELS,
  CONTENT_STATUS_LABELS,
  PHOTO_STATUS_LABELS,
  PRICING_METHOD_LABELS,
  URGENCY_LABELS,
  complexityDescription,
  contentStatusDescription,
  photoStatusDescription,
  pricingMethodDetail,
  urgencyDescription,
} from "@/pricing/labels";
import type {
  AddOnId,
  ClientDetails,
  Complexity,
  ContentStatus,
  DiscountType,
  PhotoStatus,
  QuoteCalculation,
  QuoteInput,
  ServiceConfig,
  Urgency,
} from "@/pricing/types";
import type { ClientErrors, PricingErrors } from "@/lib/validation";
import { SelectField, TextAreaField, TextField } from "@/components/FormField";

type ProjectFormProps = {
  service: ServiceConfig;
  calculation: QuoteCalculation;
  input: QuoteInput;
  details: ClientDetails;
  clientErrors: ClientErrors;
  pricingErrors: PricingErrors;
  showErrors: boolean;
  onInputChange: (patch: Partial<QuoteInput>) => void;
  onDetailsChange: (patch: Partial<ClientDetails>) => void;
  onToggleAddOn: (id: AddOnId) => void;
  onAddOnQuantityChange: (id: AddOnId, quantity: number) => void;
  onRequest: () => void;
  onReview: () => void;
  onChangeService: () => void;
};

type ChoiceCardProps<T extends string> = {
  name: string;
  value: T;
  checked: boolean;
  label: string;
  description: string;
  onChange: (value: T) => void;
};

function ChoiceCard<T extends string>({
  name,
  value,
  checked,
  label,
  description,
  onChange,
}: ChoiceCardProps<T>) {
  return (
    <label className={`choice-card ${checked ? "is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="choice-card__input"
      />
      <span className="choice-card__indicator" aria-hidden="true">
        <Check size={12} />
      </span>
      <span className="choice-card__copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
    </label>
  );
}

function FormSection({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {  return (
    <section className="form-section">
      <div className="form-section__head">
        <span className="form-section__number">{number}</span>
        <span className="form-section__icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="form-section__body">{children}</div>
    </section>
  );
}

export function ProjectForm({
  service,
  calculation,
  input,
  details,
  clientErrors,
  pricingErrors,
  showErrors,
  onInputChange,
  onDetailsChange,
  onToggleAddOn,
  onAddOnQuantityChange,
  onRequest,
  onReview,
  onChangeService,
}: ProjectFormProps) {
  const isManual = calculation.requiresManualReview;
  const isFixed = service.pricingMethod === "fixed";
  const isPerUnit = service.pricingMethod === "per-unit";

  const clientError = (key: keyof ClientDetails) =>
    showErrors ? clientErrors[key] : undefined;
  const pricingError = (key: keyof PricingErrors) =>
    showErrors ? pricingErrors[key] : undefined;

  const quantityHint = isPerUnit
    ? `The base package includes ${service.includedQuantity} ${
        service.includedQuantity === 1
          ? service.unitSingular
          : service.unitLabel
      }. Each additional ${
        service.unitSingular
      } is charged at the configured unit rate.`
    : "This is a fixed-price package. The base fee is not multiplied by quantity. Additional items may need a separate quotation.";

  return (
    <form
      className="project-form"
      onSubmit={(event) => {
        event.preventDefault();
        onRequest();
      }}
      noValidate
    >
      <div className="selected-service">
        <div className="selected-service__icon" aria-hidden="true">
          <Sparkles size={19} />
        </div>
        <div className="selected-service__copy">
          <span>Selected service</span>
          <strong>{service.name}</strong>
          <p>{pricingMethodDetail(service.pricingMethod)}</p>
        </div>
        <button
          type="button"
          className="selected-service__change"
          onClick={onChangeService}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Change
        </button>
      </div>

      <div className="selected-service__meta">
        <span className="method-badge">
          {PRICING_METHOD_LABELS[service.pricingMethod]}
        </span>
        <span>{service.includedRevisions} revisions included</span>
        {isPerUnit && (
          <span>
            {service.includedQuantity}{" "}
            {service.includedQuantity === 1
              ? service.unitSingular
              : service.unitLabel}{" "}
            included
          </span>
        )}
      </div>

      {isManual && (
        <div className="manual-review manual-review--form">
          <span className="manual-review__icon" aria-hidden="true">
            <AlertCircle size={19} />
          </span>
          <div>
            <h3>This project needs a personalized quotation</h3>
            <p>
              {calculation.reviewMessage ??
                "Because this service is custom-priced, automatic pricing controls are hidden. Share your scope below and we will review it personally."}
            </p>
          </div>
        </div>
      )}

      {!isManual && (
        <>
          <FormSection
            number="02"
            title="Scope and quantity"
            description="Tell us how much design work is needed."
            icon={<PencilRuler size={17} />}
          >
            <div className="field-grid field-grid--two">
              <TextField
                id="service-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                step={1}
                label={
                  isFixed
                    ? "Quantity requested"
                    : service.quantityLabel
                }
                value={input.quantity}
                onChange={(event) =>
                  onInputChange({ quantity: Number(event.target.value) })
                }
                hint={quantityHint}
                error={pricingError("quantity")}
              />
              <TextField
                id="service-variations"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                step={1}
                label="Number of variations or sizes"
                value={input.variations}
                onChange={(event) =>
                  onInputChange({ variations: Number(event.target.value) })
                }
                hint="The package includes one. Extra variations or sizes are charged separately."
                error={pricingError("variations")}
              />
            </div>

            {isFixed && input.quantity > 1 && (
              <div className="inline-alert" role="status">
                <Info size={16} aria-hidden="true" />
                <p>
                  <strong>Fixed-price package:</strong> the base fee is not
                  multiplied by quantity, and no automatic per-unit charge has
                  been added. Additional items beyond the package may require a
                  separate quotation.
                </p>
              </div>
            )}
          </FormSection>

          <FormSection
            number="03"
            title="Design complexity"
            description="Choose the level that best reflects the work involved."
            icon={<Sparkles size={17} />}
          >
            <fieldset className="choice-fieldset">
              <legend className="sr-only">Design complexity</legend>
              <div className="choice-grid choice-grid--three">
                {(["basic", "standard", "complex"] as Complexity[]).map(
                  (level) => (
                    <ChoiceCard
                      key={level}
                      name="complexity"
                      value={level}
                      checked={input.complexity === level}
                      label={COMPLEXITY_LABELS[level]}
                      description={complexityDescription(level)}
                      onChange={(value) => onInputChange({ complexity: value })}
                    />
                  )
                )}
              </div>
            </fieldset>
          </FormSection>

          <FormSection
            number="04"
            title="Content and images"
            description="Let us know what is ready and what needs support."
            icon={<FileText size={17} />}
          >
            <fieldset className="choice-fieldset">
              <legend className="field-label">Content status</legend>
              <div className="choice-grid choice-grid--three">
                {(
                  [
                    "client-provided",
                    "needs-copywriting",
                    "needs-formatting",
                  ] as ContentStatus[]
                ).map((status) => (
                  <ChoiceCard
                    key={status}
                    name="content-status"
                    value={status}
                    checked={input.contentStatus === status}
                    label={CONTENT_STATUS_LABELS[status]}
                    description={contentStatusDescription(status)}
                    onChange={(value) =>
                      onInputChange({ contentStatus: value })
                    }
                  />
                ))}
              </div>
            </fieldset>

            {service.coversPhotoEditing ? (
              <div className="inline-note">
                <Info size={16} aria-hidden="true" />
                <p>
                  Photo editing is already included in the selected service, so
                  no separate photo charge is added.
                </p>
              </div>
            ) : (
              <fieldset className="choice-fieldset">
                <legend className="field-label">Photo status</legend>
                <div className="choice-grid choice-grid--two">
                  {(
                    ["client-provided", "needs-photo-editing"] as PhotoStatus[]
                  ).map((status) => (
                    <ChoiceCard
                      key={status}
                      name="photo-status"
                      value={status}
                      checked={input.photoStatus === status}
                      label={PHOTO_STATUS_LABELS[status]}
                      description={photoStatusDescription(status, false)}
                      onChange={(value) => onInputChange({ photoStatus: value })}
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </FormSection>

          <FormSection
            number="05"
            title="Turnaround"
            description="Urgent deadlines are subject to availability."
            icon={<Send size={17} />}
          >
            <fieldset className="choice-fieldset">
              <legend className="sr-only">Urgency</legend>
              <div className="choice-grid choice-grid--three">
                {(["standard", "rush", "express"] as Urgency[]).map((urgency) => (
                  <ChoiceCard
                    key={urgency}
                    name="urgency"
                    value={urgency}
                    checked={input.urgency === urgency}
                    label={URGENCY_LABELS[urgency]}
                    description={urgencyDescription(urgency)}
                    onChange={(value) => onInputChange({ urgency: value })}
                  />
                ))}
              </div>
            </fieldset>
            <p className="field-note">
              Rush and Express selections add the configured service-specific
              fee. Deadlines are confirmed only after the project scope is
              reviewed.
            </p>
          </FormSection>

          <FormSection
            number="06"
            title="Revisions and optional add-ons"
            description="Only add work that is not already included above."
            icon={<Sparkles size={17} />}
          >
            <TextField
              id="service-extra-revisions"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              step={1}
              label="Extra revisions requested"
              value={input.extraRevisions}
              onChange={(event) =>
                onInputChange({ extraRevisions: Number(event.target.value) })
              }
              hint={`${service.includedRevisions} revisions are included. Extra revisions are ${formatCurrency(
                ADD_ON_RATE["extra-revisions"]
              )} each.`}
              error={pricingError("extraRevisions")}
            />

            <div className="addon-list">
              {PUBLIC_ADD_ONS.map((addOn) => {
                const selected = (input.addOns[addOn.id] ?? 0) > 0;
                return (
                  <div
                    key={addOn.id}
                    className={`addon-card ${selected ? "is-selected" : ""}`}
                  >
                    <input
                      id={`addon-${addOn.id}`}
                      type="checkbox"
                      className="addon-card__input"
                      checked={selected}
                      onChange={() => onToggleAddOn(addOn.id)}
                    />
                    <label
                      htmlFor={`addon-${addOn.id}`}
                      className="addon-card__label"
                    >
                      <span className="addon-card__check" aria-hidden="true">
                        <Check size={12} />
                      </span>
                      <span className="addon-card__copy">
                        <strong>{addOn.name}</strong>
                        <span>{addOn.description}</span>
                        <em>
                          {formatCurrency(addOn.rate)} per {addOn.unitLabel}
                          {addOn.scope === "project" ? " · once per project" : ""}
                        </em>
                      </span>
                    </label>
                    {selected && addOn.scope === "unit" && (
                      <div className="addon-card__quantity">
                        <label htmlFor={`addon-qty-${addOn.id}`}>Qty</label>
                        <input
                          id={`addon-qty-${addOn.id}`}
                          type="number"
                          min={1}
                          max={99}
                          step={1}
                          value={input.addOns[addOn.id] ?? 1}
                          onChange={(event) =>
                            onAddOnQuantityChange(
                              addOn.id,
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="inline-note">
              <Info size={16} aria-hidden="true" />
              <p>
                Copywriting, formatting, photo editing, extra revisions, and
                additional design sizes are priced through the fields above, so
                they are not repeated in the add-on list. This prevents
                double-charging the same work.
              </p>
            </div>
          </FormSection>

          <FormSection
            number="07"
            title="Project and client details"
            description="These details appear on your quotation."
            icon={<FileText size={17} />}
          >
            <div className="field-grid field-grid--two">
              <TextField
                id="client-fullName"
                label="Full name"
                required
                autoComplete="name"
                value={details.fullName}
                onChange={(event) =>
                  onDetailsChange({ fullName: event.target.value })
                }
                error={clientError("fullName")}
                placeholder="Your name"
              />
              <TextField
                id="client-businessName"
                label="Business or brand name"
                optional
                autoComplete="organization"
                value={details.businessName}
                onChange={(event) =>
                  onDetailsChange({ businessName: event.target.value })
                }
                error={clientError("businessName")}
                placeholder="Your brand, if applicable"
              />
              <TextField
                id="client-email"
                type="email"
                label="Email address"
                optional
                autoComplete="email"
                value={details.email}
                onChange={(event) =>
                  onDetailsChange({ email: event.target.value })
                }
                error={clientError("email")}
                placeholder="you@example.com"
              />
              <TextField
                id="client-contactNumber"
                type="tel"
                label="Contact number"
                optional
                autoComplete="tel"
                value={details.contactNumber}
                onChange={(event) =>
                  onDetailsChange({ contactNumber: event.target.value })
                }
                error={clientError("contactNumber")}
                placeholder="+63 9XX XXX XXXX"
              />
              <TextField
                id="client-projectTitle"
                label="Project title"
                required
                value={details.projectTitle}
                onChange={(event) =>
                  onDetailsChange({ projectTitle: event.target.value })
                }
                error={clientError("projectTitle")}
                placeholder="e.g. New logo for a coffee brand"
              />
              <TextField
                id="client-preferredDeadline"
                type="date"
                label="Preferred deadline"
                optional
                min={todayIso()}
                value={details.preferredDeadline}
                onChange={(event) =>
                  onDetailsChange({ preferredDeadline: event.target.value })
                }
                error={clientError("preferredDeadline")}
                hint="Subject to availability and confirmation."
              />
            </div>

            <TextAreaField
              id="client-projectDescription"
              label="Project description"
              optional
              rows={4}
              value={details.projectDescription}
              onChange={(event) =>
                onDetailsChange({ projectDescription: event.target.value })
              }
              error={clientError("projectDescription")}
              placeholder="What are you making, who is it for, and what should the design achieve?"
              hint="A short brief helps us confirm the scope after you send the quotation."
            />

            <TextAreaField
              id="client-specialInstructions"
              label="Special instructions"
              optional
              rows={3}
              value={details.specialInstructions}
              onChange={(event) =>
                onDetailsChange({ specialInstructions: event.target.value })
              }
              error={clientError("specialInstructions")}
              placeholder="Dimensions, brand colours, must-use content, references…"
            />

            <TextAreaField
              id="client-notes"
              label="Additional notes"
              optional
              rows={3}
              value={details.notes}
              onChange={(event) =>
                onDetailsChange({ notes: event.target.value })
              }
              error={clientError("notes")}
              placeholder="Anything else we should know?"
            />

            <p className="privacy-note">
              <Info size={14} aria-hidden="true" />
              Your details stay in this browser until you choose to print, copy,
              or send the quotation. Nothing is submitted automatically.
            </p>
          </FormSection>

          <FormSection
            number="08"
            title="Discount"
            description="Only use this if a discount has been discussed with you."
            icon={<Sparkles size={17} />}
          >
            <SelectField
              id="discount-type"
              label="Discount type"
              value={input.discountType}
              onChange={(event) =>
                onInputChange({
                  discountType: event.target.value as DiscountType,
                })
              }
            >
              <option value="none">No discount</option>
              <option value="fixed">Fixed amount</option>
              <option value="percentage">Percentage</option>
            </SelectField>

            {input.discountType !== "none" && (
              <TextField
                id="discount-value"
                type="number"
                inputMode="decimal"
                min={0}
                max={input.discountType === "percentage" ? 100 : undefined}
                step="0.01"
                label={
                  input.discountType === "percentage"
                    ? "Discount percentage"
                    : "Discount amount"
                }
                prefix={input.discountType === "fixed" ? "₱" : undefined}
                suffix={input.discountType === "percentage" ? "%" : undefined}
                value={input.discountValue}
                onChange={(event) =>
                  onInputChange({ discountValue: Number(event.target.value) })
                }
                error={pricingError("discountValue")}
                hint="Discounts are provisional and subject to confirmation. The estimate cannot go below zero."
              />
            )}
          </FormSection>
        </>
      )}

      <div className="form-actions">
        <div>
          <p className="form-actions__label">Ready to review?</p>
          <p>
            {isManual
              ? "Send the scope so we can prepare a personalized quotation."
              : `Estimated total: ${
                  calculation.total === null
                    ? "custom quotation required"
                    : formatCurrency(calculation.total)
                }`}
          </p>
        </div>
        <div className="form-actions__buttons">
          {!isManual && (
            <button type="button" className="btn btn--outline btn--lg" onClick={onReview}>
              View quotation
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )}
          <button type="submit" className="btn btn--green btn--lg">
            {isManual ? "Request a Custom Quote" : "Request This Quotation"}
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="form-disclaimer">{QUOTE_TERMS.estimateDisclaimer}</p>
    </form>
  );
}
