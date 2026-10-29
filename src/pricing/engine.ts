import {
  ADD_ON_BY_ID,
  ADD_ON_RATE,
  SERVICE_BY_ID,
} from "@/data/pricing";
import { formatCurrency, roundMoney } from "@/pricing/format";
import {
  COMPLEXITY_LABELS,
  PRICING_METHOD_LABELS,
  URGENCY_LABELS,
} from "@/pricing/labels";
import type {
  AddOnId,
  ChargeLine,
  QuoteCalculation,
  QuoteInput,
  ServiceConfig,
  WarningCode,
} from "@/pricing/types";

const CUSTOM_REVIEW_MESSAGE =
  "This project requires a personalized quotation. Submit your project details so we can review the scope and confirm the price.";

const MISSING_RATE_MESSAGE =
  "This service does not have a complete configured rate. A personalized quotation is required.";

function safeInteger(value: number, fallback = 1, minimum = 1): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.floor(value));
}

function warning(
  code: WarningCode,
  message: string,
  severity: "info" | "warning" = "warning"
) {
  return { code, message, severity } as const;
}

export function defaultQuoteInput(serviceId = ""): QuoteInput {
  return {
    serviceId,
    quantity: 1,
    variations: 1,
    complexity: "basic",
    contentStatus: "client-provided",
    photoStatus: "client-provided",
    urgency: "standard",
    extraRevisions: 0,
    addOns: {},
    discountType: "none",
    discountValue: 0,
  };
}

/**
 * Pure pricing calculation for a known service. Exported separately so the
 * quantity formula can be tested against synthetic included quantities too.
 */
export function calculateQuoteForService(
  service: ServiceConfig,
  input: QuoteInput
): QuoteCalculation {
  const warnings: QuoteCalculation["warnings"] = [];
  const quantityRequested = safeInteger(input.quantity);
  const variationsRequested = safeInteger(input.variations);
  const extraRevisions = safeInteger(input.extraRevisions, 0, 0);

  const includedQuantity = Math.max(0, service.includedQuantity);
  const quantityApplies = service.pricingMethod === "per-unit";
  const additionalQuantity = quantityApplies
    ? Math.max(0, quantityRequested - includedQuantity)
    : 0;
  const quantityCharges = roundMoney(additionalQuantity * service.unitRate);

  const additionalVariations = Math.max(0, variationsRequested - 1);
  const variationCharges = roundMoney(additionalVariations * service.unitRate);

  const requiresManualReview =
    service.pricingMethod === "custom" ||
    (service.baseFee <= 0 && service.unitRate <= 0);

  if (service.pricingMethod === "custom") {
    warnings.push(warning("custom-quote", CUSTOM_REVIEW_MESSAGE, "info"));
  } else if (service.baseFee <= 0 && service.unitRate <= 0) {
    warnings.push(warning("missing-rate", MISSING_RATE_MESSAGE));
  }

  if (service.pricingMethod === "fixed" && quantityRequested > 1) {
    warnings.push(
      warning(
        "fixed-quantity",
        "This is a fixed-price package, so the base fee is not multiplied by quantity. Additional items beyond the package may require a separate quotation."
      )
    );
  }

  if (input.urgency !== "standard") {
    warnings.push(
      warning(
        "urgency-availability",
        `${URGENCY_LABELS[input.urgency]} delivery is subject to availability and confirmation.`,
        "info"
      )
    );
  }

  // Custom-priced work must never be presented as an automatically confirmed amount.
  if (requiresManualReview) {
    return {
      service,
      pricingMethod: service.pricingMethod,
      complexity: input.complexity,
      contentStatus: input.contentStatus,
      photoStatus: input.photoStatus,
      urgency: input.urgency,
      requiresManualReview: true,
      reviewMessage:
        service.pricingMethod === "custom"
          ? CUSTOM_REVIEW_MESSAGE
          : MISSING_RATE_MESSAGE,
      quantity: {
        requested: quantityRequested,
        included: includedQuantity,
        additional: additionalQuantity,
        unitRate: service.unitRate,
        charge: 0,
        applies: quantityApplies,
      },
      variations: {
        requested: variationsRequested,
        included: 1,
        additional: additionalVariations,
        unitRate: service.unitRate,
        charge: 0,
      },
      includedRevisions: service.includedRevisions,
      extraRevisions,
      totalRevisions: service.includedRevisions + extraRevisions,
      baseFee: 0,
      quantityCharges: 0,
      complexityAdjustment: 0,
      contentPhotoCharges: 0,
      addOnCharges: 0,
      variationCharges: 0,
      extraRevisionCharges: 0,
      additionalServices: 0,
      urgencyFee: 0,
      subtotal: null,
      discountAmount: 0,
      total: null,
      lines: [],
      warnings,
    };
  }

  const baseFee = roundMoney(service.baseFee);
  const complexityAdjustment = roundMoney(service.complexity[input.complexity]);

  const contentPhotoLines: ChargeLine[] = [];
  let contentPhotoCharges = 0;

  if (input.contentStatus === "needs-copywriting") {
    const amount = ADD_ON_RATE.copywriting;
    contentPhotoCharges += amount;
    contentPhotoLines.push({
      id: "content-copywriting",
      group: "content",
      label: "Copywriting",
      description: "Copywriting support for the project",
      amount,
    });
  } else if (input.contentStatus === "needs-formatting") {
    const amount = ADD_ON_RATE.formatting;
    contentPhotoCharges += amount;
    contentPhotoLines.push({
      id: "content-formatting",
      group: "content",
      label: "Content Formatting",
      description: "Formatting client-provided content into the layout",
      amount,
    });
  }

  if (input.photoStatus === "needs-photo-editing") {
    if (service.coversPhotoEditing) {
      warnings.push(
        warning(
          "photo-included",
          "The selected service already includes photo editing, so no separate photo charge was added.",
          "info"
        )
      );
    } else {
      const amount = ADD_ON_RATE["photo-editing"];
      contentPhotoCharges += amount;
      contentPhotoLines.push({
        id: "content-photo-editing",
        group: "content",
        label: "Photo Editing",
        description: "Photo retouching and image preparation",
        amount,
      });
    }
  }

  contentPhotoCharges = roundMoney(contentPhotoCharges);

  const additionalLines: ChargeLine[] = [];

  if (additionalVariations > 0) {
    additionalLines.push({
      id: "additional-variations",
      group: "additional",
      label: "Additional Variations",
      description: `${additionalVariations} additional ${
        additionalVariations === 1 ? "variation or size" : "variations or sizes"
      } × ${formatCurrency(service.unitRate)} each`,
      amount: variationCharges,
    });
  }

  const extraRevisionCharges = roundMoney(
    extraRevisions * ADD_ON_RATE["extra-revisions"]
  );

  if (extraRevisions > 0) {
    additionalLines.push({
      id: "extra-revisions",
      group: "additional",
      label: "Extra Revisions",
      description: `${extraRevisions} additional ${
        extraRevisions === 1 ? "revision" : "revisions"
      } × ${formatCurrency(ADD_ON_RATE["extra-revisions"])} per revision`,
      amount: extraRevisionCharges,
    });
  }

  let addOnCharges = 0;

  for (const [rawId, rawQuantity] of Object.entries(input.addOns)) {
    const id = rawId as AddOnId;
    const addOn = ADD_ON_BY_ID.get(id);
    if (!addOn) continue;

    if (addOn.handledBy) {
      warnings.push(
        warning(
          "addon-covered",
          `${addOn.name} is already handled through your project selections, so it was not charged twice.`,
          "info"
        )
      );
      continue;
    }

    if (!addOn.publiclySelectable) continue;

    let quantity = Number(rawQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      if (rawQuantity !== undefined) {
        warnings.push(
          warning(
            "invalid-addon-quantity",
            `${addOn.name} was ignored because its quantity is not valid.`
          )
        );
      }
      continue;
    }

    quantity = Math.floor(quantity);
    if (addOn.scope === "project" && quantity > 1) {
      warnings.push(
        warning(
          "invalid-addon-quantity",
          `${addOn.name} is charged once per project; the quantity was adjusted to 1.`,
          "info"
        )
      );
      quantity = 1;
    }

    const amount = roundMoney(quantity * addOn.rate);
    addOnCharges += amount;
    additionalLines.push({
      id: `addon-${addOn.id}`,
      group: "additional",
      label: addOn.name,
      description:
        addOn.scope === "project"
          ? `Charged once per project at ${formatCurrency(addOn.rate)}`
          : `${quantity} ${
              quantity === 1 ? addOn.unitLabel : `${addOn.unitLabel}s`
            } × ${formatCurrency(addOn.rate)} per ${addOn.unitLabel}`,
      amount,
    });
  }

  addOnCharges = roundMoney(addOnCharges);

  const urgencyFee = roundMoney(
    input.urgency === "rush"
      ? service.rushFee
      : input.urgency === "express"
        ? service.expressFee
        : 0
  );

  const additionalServices = roundMoney(
    variationCharges + extraRevisionCharges + addOnCharges
  );

  const subtotal = roundMoney(
    baseFee +
      quantityCharges +
      complexityAdjustment +
      contentPhotoCharges +
      additionalServices +
      urgencyFee
  );

  const rawDiscount = Number(input.discountValue);
  let discountAmount = 0;

  if (input.discountType === "fixed") {
    if (!Number.isFinite(rawDiscount)) {
      warnings.push(
        warning(
          "invalid-fixed-discount",
          "The fixed discount is not a valid amount, so no discount was applied."
        )
      );
    } else if (rawDiscount < 0) {
      warnings.push(
        warning(
          "invalid-fixed-discount",
          "A fixed discount cannot be negative, so no discount was applied."
        )
      );
    } else {
      discountAmount = roundMoney(Math.min(subtotal, rawDiscount));
      if (rawDiscount > subtotal) {
        warnings.push(
          warning(
            "discount-capped",
            "The discount was capped at the subtotal so the quotation cannot become negative.",
            "info"
          )
        );
      }
    }
  } else if (input.discountType === "percentage") {
    if (!Number.isFinite(rawDiscount)) {
      warnings.push(
        warning(
          "invalid-percentage",
          "The discount percentage is not valid, so no discount was applied."
        )
      );
    } else {
      if (rawDiscount < 0 || rawDiscount > 100) {
        warnings.push(
          warning(
            "invalid-percentage",
            "The discount percentage must be between 0 and 100; it was limited to that range."
          )
        );
      }
      const percentage = Math.min(100, Math.max(0, rawDiscount));
      discountAmount = roundMoney((subtotal * percentage) / 100);
    }
  }

  discountAmount = roundMoney(Math.min(subtotal, Math.max(0, discountAmount)));
  const total = roundMoney(Math.max(0, subtotal - discountAmount));

  const quantityDescription =
    service.pricingMethod === "per-unit"
      ? additionalQuantity > 0
        ? `${additionalQuantity} additional ${
            additionalQuantity === 1 ? service.unitSingular : service.unitLabel
          } × ${formatCurrency(service.unitRate)} per ${service.unitSingular} (includes ${includedQuantity} ${
            includedQuantity === 1 ? service.unitSingular : service.unitLabel
          })`
        : `Included quantity covers the requested ${quantityRequested} ${
            quantityRequested === 1 ? service.unitSingular : service.unitLabel
          }`
      : "Fixed-price package: one package included; requested quantity is not multiplied. Additional items may require a separate quotation";

  const lines: ChargeLine[] = [
    {
      id: "base",
      group: "base",
      label: "Base Design Fee",
      description: `Selected service: ${service.name} (${PRICING_METHOD_LABELS[service.pricingMethod]})`,
      amount: baseFee,
    },
    {
      id: "quantity",
      group: "quantity",
      label: "Quantity Charges",
      description: quantityDescription,
      amount: quantityCharges,
    },
    {
      id: "complexity",
      group: "complexity",
      label: "Complexity Adjustment",
      description: `Complexity level: ${COMPLEXITY_LABELS[input.complexity]}`,
      amount: complexityAdjustment,
    },
    ...(contentPhotoLines.length > 0
      ? contentPhotoLines
      : [
          {
            id: "content",
            group: "content",
            label: "Content / Photo Charges",
            description: "No additional content or photo charges",
            amount: 0,
          } satisfies ChargeLine,
        ]),
    ...additionalLines,
  ];

  if (urgencyFee > 0) {
    lines.push({
      id: "urgency",
      group: "urgency",
      label:
        input.urgency === "rush" ? "Rush Fee" : "Express Fee",
      description: `${URGENCY_LABELS[input.urgency]} delivery (subject to availability)`,
      amount: urgencyFee,
    });
  } else {
    lines.push({
      id: "urgency",
      group: "urgency",
      label: "Rush / Express Fee",
      description: "Standard turnaround",
      amount: 0,
    });
  }

  if (discountAmount > 0) {
    lines.push({
      id: "discount",
      group: "discount",
      label: "Discount",
      description:
        input.discountType === "percentage"
          ? `${Math.min(100, Math.max(0, rawDiscount))}% discount`
          : "Fixed discount",
      amount: -discountAmount,
    });
  }

  return {
    service,
    pricingMethod: service.pricingMethod,
    complexity: input.complexity,
    contentStatus: input.contentStatus,
    photoStatus: input.photoStatus,
    urgency: input.urgency,
    requiresManualReview: false,
    reviewMessage: null,
    quantity: {
      requested: quantityRequested,
      included: includedQuantity,
      additional: additionalQuantity,
      unitRate: service.unitRate,
      charge: quantityCharges,
      applies: quantityApplies,
    },
    variations: {
      requested: variationsRequested,
      included: 1,
      additional: additionalVariations,
      unitRate: service.unitRate,
      charge: variationCharges,
    },
    includedRevisions: service.includedRevisions,
    extraRevisions,
    totalRevisions: service.includedRevisions + extraRevisions,
    baseFee,
    quantityCharges,
    complexityAdjustment,
    contentPhotoCharges,
    addOnCharges,
    variationCharges,
    extraRevisionCharges,
    additionalServices,
    urgencyFee,
    subtotal,
    discountAmount,
    total,
    lines,
    warnings,
  };
}

export function calculateQuote(input: QuoteInput): QuoteCalculation | null {
  const service = SERVICE_BY_ID.get(input.serviceId);
  if (!service) return null;
  return calculateQuoteForService(service, input);
}
