export type PricingMethod = "fixed" | "per-unit" | "custom";

export type Complexity = "basic" | "standard" | "complex";

export type ContentStatus =
  | "client-provided"
  | "needs-copywriting"
  | "needs-formatting";

export type PhotoStatus = "client-provided" | "needs-photo-editing";

export type Urgency = "standard" | "rush" | "express";

export type DiscountType = "none" | "fixed" | "percentage";

export type ServiceCategory =
  | "Brand & Identity"
  | "Social & Digital"
  | "Print & Editorial"
  | "Events & Personal"
  | "Merchandise & Apparel"
  | "Presentation & Custom";

export type UnitType =
  | "package"
  | "graphic"
  | "page"
  | "slide"
  | "image"
  | "project";

export type AddOnId =
  | "copywriting"
  | "photo-editing"
  | "image-sourcing"
  | "multiple-design-sizes"
  | "extra-revisions"
  | "additional-concepts"
  | "mockups"
  | "editable-source-files"
  | "other-custom-services"
  | "formatting";

export type HandledBy =
  | "content-status"
  | "photo-status"
  | "extra-revisions"
  | "variations";

export interface ServiceConfig {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  pricingMethod: PricingMethod;
  unitType: UnitType;
  /** Plural unit used in copy, e.g. "graphics". */
  unitLabel: string;
  /** Singular unit used in copy, e.g. "graphic". */
  unitSingular: string;
  quantityLabel: string;
  baseFee: number;
  unitRate: number;
  includedQuantity: number;
  includedRevisions: number;
  complexity: Record<Complexity, number>;
  rushFee: number;
  expressFee: number;
  /** The service already includes photo editing, so the photo status must not re-charge it. */
  coversPhotoEditing?: boolean;
  searchTerms?: string[];
}

export interface AddOnConfig {
  id: AddOnId;
  name: string;
  description: string;
  rate: number;
  /** Label for one billable unit of this add-on. */
  unitLabel: string;
  scope: "project" | "unit";
  /** When set, the add-on is priced through a dedicated form field instead of a second control. */
  handledBy?: HandledBy;
  /** Whether the public add-on picker should offer this line. */
  publiclySelectable: boolean;
}

export interface AddOnSelection {
  id: AddOnId;
  quantity: number;
}

export interface QuoteInput {
  serviceId: string;
  quantity: number;
  variations: number;
  complexity: Complexity;
  contentStatus: ContentStatus;
  photoStatus: PhotoStatus;
  urgency: Urgency;
  extraRevisions: number;
  addOns: Partial<Record<AddOnId, number>>;
  discountType: DiscountType;
  discountValue: number;
}

export type WarningCode =
  | "fixed-quantity"
  | "custom-quote"
  | "missing-rate"
  | "addon-covered"
  | "discount-capped"
  | "invalid-percentage"
  | "invalid-fixed-discount"
  | "invalid-addon-quantity"
  | "photo-included"
  | "urgency-availability";

export interface PricingWarning {
  code: WarningCode;
  severity: "info" | "warning";
  message: string;
}

export interface ChargeLine {
  id: string;
  group:
    | "base"
    | "quantity"
    | "complexity"
    | "content"
    | "additional"
    | "urgency"
    | "discount";
  label: string;
  description: string;
  amount: number;
}

export interface QuantityBreakdown {
  requested: number;
  included: number;
  additional: number;
  unitRate: number;
  charge: number;
  applies: boolean;
}

export interface VariationBreakdown {
  requested: number;
  included: number;
  additional: number;
  unitRate: number;
  charge: number;
}

export interface QuoteCalculation {
  service: ServiceConfig;
  pricingMethod: PricingMethod;
  complexity: Complexity;
  contentStatus: ContentStatus;
  photoStatus: PhotoStatus;
  urgency: Urgency;
  /** True when the automatic estimate cannot be shown as a reliable price. */
  requiresManualReview: boolean;
  reviewMessage: string | null;
  quantity: QuantityBreakdown;
  variations: VariationBreakdown;
  includedRevisions: number;
  extraRevisions: number;
  totalRevisions: number;
  baseFee: number;
  quantityCharges: number;
  complexityAdjustment: number;
  contentPhotoCharges: number;
  addOnCharges: number;
  variationCharges: number;
  extraRevisionCharges: number;
  additionalServices: number;
  urgencyFee: number;
  subtotal: number | null;
  discountAmount: number;
  total: number | null;
  lines: ChargeLine[];
  warnings: PricingWarning[];
}

export interface ClientDetails {
  fullName: string;
  businessName: string;
  email: string;
  contactNumber: string;
  projectTitle: string;
  projectDescription: string;
  preferredDeadline: string;
  notes: string;
  specialInstructions: string;
}

export interface QuotationMeta {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
}

export interface QuotationSpecification {
  label: string;
  value: string;
}

export interface QuotationDocument {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  client: ClientDetails;
  service: ServiceConfig;
  specifications: QuotationSpecification[];
  lines: ChargeLine[];
  total: number | null;
  isEstimate: boolean;
  requiresManualReview: boolean;
  reviewMessage: string | null;
  estimatedTurnaround: string;
  includedRevisions: number;
  totalRevisions: number;
  paymentTerms: string;
  notes: string;
  specialInstructions: string;
  scopeDisclaimer: string;
  estimateDisclaimer: string;
}
