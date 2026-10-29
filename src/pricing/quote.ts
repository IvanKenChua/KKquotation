import { QUOTE_TERMS } from "@/data/pricing";
import {
  addDaysIso,
  formatCurrency,
  formatDateLong,
  toIsoDate,
} from "@/pricing/format";
import {
  COMPLEXITY_LABELS,
  CONTENT_STATUS_LABELS,
  PHOTO_STATUS_LABELS,
  PRICING_METHOD_LABELS,
  URGENCY_LABELS,
} from "@/pricing/labels";
import type {
  ClientDetails,
  QuoteCalculation,
  QuotationDocument,
  QuotationMeta,
  QuotationSpecification,
} from "@/pricing/types";

function randomToken(length = 4): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoApi.getRandomValues(values);
    return Array.from(
      values,
      (value) => alphabet[value % alphabet.length]
    ).join("");
  }
  return Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

export function generateQuotationNumber(date = new Date()): string {
  const compactDate = toIsoDate(date).replaceAll("-", "");
  return `KK-${compactDate}-${randomToken()}`;
}

export function createQuotationMeta(date = new Date()): QuotationMeta {
  const quotationDate = toIsoDate(date);
  return {
    quotationNumber: generateQuotationNumber(date),
    quotationDate,
    validUntil: addDaysIso(quotationDate, QUOTE_TERMS.validityDays),
  };
}

export function buildSpecifications(
  calculation: QuoteCalculation
): QuotationSpecification[] {
  const { service, quantity, variations } = calculation;

  const quantityValue =
    service.pricingMethod === "per-unit"
      ? `${quantity.requested} ${
          quantity.requested === 1 ? service.unitSingular : service.unitLabel
        }${
          quantity.additional > 0
            ? ` — ${quantity.additional} additional beyond the ${quantity.included} included`
            : ` — within the ${quantity.included} included`
        }`
      : service.pricingMethod === "fixed"
        ? `Fixed package — ${quantity.requested} ${
            quantity.requested === 1
              ? service.unitSingular
              : service.unitLabel
          } requested (quantity not billed per unit)`
        : "To be confirmed after scope review";

  const specifications: QuotationSpecification[] = [
    { label: "Service", value: service.name },
    {
      label: "Pricing method",
      value: PRICING_METHOD_LABELS[service.pricingMethod],
    },
    { label: "Quantity", value: quantityValue },
    { label: "Variations / sizes", value: `${variations.requested}` },
    {
      label: "Design complexity",
      value: COMPLEXITY_LABELS[calculation.complexity],
    },
    {
      label: "Content status",
      value: CONTENT_STATUS_LABELS[calculation.contentStatus],
    },
    {
      label: "Photo status",
      value: service.coversPhotoEditing
        ? "Included in the selected service"
        : PHOTO_STATUS_LABELS[calculation.photoStatus],
    },
    {
      label: "Urgency",
      value: URGENCY_LABELS[calculation.urgency],
    },
    {
      label: "Extra revisions",
      value:
        calculation.extraRevisions > 0
          ? `${calculation.extraRevisions} additional beyond the ${calculation.includedRevisions} included`
          : "None",
    },
  ];

  return specifications;
}

function turnaroundFor(calculation: QuoteCalculation): string {
  if (calculation.requiresManualReview) {
    return "Confirmed after scope review";
  }
  switch (calculation.urgency) {
    case "rush":
      return "Rush — priority scheduling, subject to availability";
    case "express":
      return "Express — shortest available schedule, subject to availability";
    case "standard":
      return QUOTE_TERMS.standardTurnaround;
    default:
      return QUOTE_TERMS.standardTurnaround;
  }
}

export function buildQuotation(
  calculation: QuoteCalculation,
  details: ClientDetails,
  meta: QuotationMeta
): QuotationDocument {
  return {
    quotationNumber: meta.quotationNumber,
    quotationDate: meta.quotationDate,
    validUntil: meta.validUntil,
    client: details,
    service: calculation.service,
    specifications: buildSpecifications(calculation),
    lines: calculation.lines,
    total: calculation.total,
    isEstimate: true,
    requiresManualReview: calculation.requiresManualReview,
    reviewMessage: calculation.reviewMessage,
    estimatedTurnaround: turnaroundFor(calculation),
    includedRevisions: calculation.includedRevisions,
    totalRevisions: calculation.totalRevisions,
    paymentTerms: QUOTE_TERMS.paymentTerms,
    notes: details.notes.trim(),
    specialInstructions: details.specialInstructions.trim(),
    scopeDisclaimer: QUOTE_TERMS.scopeDisclaimer,
    estimateDisclaimer: QUOTE_TERMS.estimateDisclaimer,
  };
}

export function buildShareText(quotation: QuotationDocument): string {
  const clientName = quotation.client.fullName.trim() || "Client name not provided";
  const projectTitle =
    quotation.client.projectTitle.trim() || "Untitled design project";

  const lineText =
    quotation.lines.length > 0
      ? quotation.lines
          .map(
            (line) =>
              `${line.label}: ${line.description} — ${formatCurrency(line.amount)}`
          )
          .join("\n")
      : "Custom quotation required — scope and price will be confirmed after review.";

  return [
    "KENVAS KREATIVE — Design Quotation",
    "Every idea deserves a canvas.",
    "",
    `Quotation number: ${quotation.quotationNumber}`,
    `Quotation date: ${formatDateLong(quotation.quotationDate)}`,
    `Valid until: ${formatDateLong(quotation.validUntil)}`,
    "",
    `Client: ${clientName}`,
    quotation.client.businessName
      ? `Business / brand: ${quotation.client.businessName}`
      : "",
    `Project: ${projectTitle}`,
    "",
    `Service: ${quotation.service.name}`,
    ...quotation.specifications.map(
      (specification) => `${specification.label}: ${specification.value}`
    ),
    "",
    "ITEMIZED CHARGES",
    lineText,
    "",
    quotation.total === null
      ? "Estimated total: Custom quotation required"
      : `Estimated total: ${formatCurrency(quotation.total)}`,
    `Estimated turnaround: ${quotation.estimatedTurnaround}`,
    `Included revisions: ${quotation.includedRevisions}${
      quotation.totalRevisions > quotation.includedRevisions
        ? ` (+${quotation.totalRevisions - quotation.includedRevisions} extra)`
        : ""
    }`,
    `Payment terms: ${quotation.paymentTerms}`,
    "",
    quotation.notes ? `Additional notes: ${quotation.notes}` : "",
    quotation.specialInstructions
      ? `Special instructions: ${quotation.specialInstructions}`
      : "",
    "",
    quotation.scopeDisclaimer,
    quotation.estimateDisclaimer,
    "",
    "KENVAS KREATIVE · Every idea deserves a canvas.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildQuotationMailto(
  quotation: QuotationDocument,
  email: string
): string {
  const subject = `Quotation request ${quotation.quotationNumber} — ${
    quotation.client.projectTitle.trim() || quotation.service.name
  }`;
  const body = [
    "Hello KENVAS KREATIVE,",
    "",
    "I would like to request the following design quotation. I understand this is an estimate and not a confirmed booking.",
    "",
    buildShareText(quotation),
    "",
    `Client email: ${quotation.client.email || "Not provided"}`,
    `Contact number: ${quotation.client.contactNumber || "Not provided"}`,
  ].join("\n");

  return `mailto:${email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
