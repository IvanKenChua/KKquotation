import type {
  Complexity,
  ContentStatus,
  DiscountType,
  PhotoStatus,
  PricingMethod,
  Urgency,
} from "@/pricing/types";

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  basic: "Basic",
  standard: "Standard",
  complex: "Complex",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  "client-provided": "Client-provided",
  "needs-copywriting": "Needs copywriting",
  "needs-formatting": "Needs formatting",
};

export const PHOTO_STATUS_LABELS: Record<PhotoStatus, string> = {
  "client-provided": "Client-provided",
  "needs-photo-editing": "Needs photo editing",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  standard: "Standard",
  rush: "Rush",
  express: "Express",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  none: "No discount",
  fixed: "Fixed amount",
  percentage: "Percentage",
};

export const PRICING_METHOD_LABELS: Record<PricingMethod, string> = {
  fixed: "Fixed price",
  "per-unit": "Per unit",
  custom: "Custom quotation",
};

export function pricingMethodDetail(method: PricingMethod): string {
  switch (method) {
    case "fixed":
      return "One package, one base fee";
    case "per-unit":
      return "Base fee plus billable units";
    case "custom":
      return "Priced after scope review";
    default:
      return "";
  }
}

export function complexityDescription(complexity: Complexity): string {
  switch (complexity) {
    case "basic":
      return "Straightforward layout and minimal custom detail.";
    case "standard":
      return "More tailored composition, typography, or visual treatment.";
    case "complex":
      return "Layered, highly custom, or detail-heavy design requirements.";
    default:
      return "";
  }
}

export function urgencyDescription(urgency: Urgency): string {
  switch (urgency) {
    case "standard":
      return "Normal scheduling after scope confirmation.";
    case "rush":
      return "Priority scheduling. Subject to availability.";
    case "express":
      return "Shortest available schedule. Subject to availability.";
    default:
      return "";
  }
}

export function contentStatusDescription(status: ContentStatus): string {
  switch (status) {
    case "client-provided":
      return "You will provide final copy and content.";
    case "needs-copywriting":
      return "We prepare or refine the project copy.";
    case "needs-formatting":
      return "You provide the copy; we format it into the layout.";
    default:
      return "";
  }
}

export function photoStatusDescription(
  status: PhotoStatus,
  coversPhotoEditing: boolean
): string {
  if (coversPhotoEditing) {
    return "Photo editing is already part of the selected service.";
  }
  switch (status) {
    case "client-provided":
      return "You will provide ready-to-use images.";
    case "needs-photo-editing":
      return "We retouch or prepare an image for the design.";
    default:
      return "";
  }
}
