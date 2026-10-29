import { parseIsoDate, todayIso } from "@/pricing/format";
import type { ClientDetails, QuoteInput } from "@/pricing/types";

export type ClientErrors = Partial<Record<keyof ClientDetails, string>>;

export interface PricingErrors {
  quantity?: string;
  variations?: string;
  extraRevisions?: string;
  discountValue?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED = /^[+\d\s().-]+$/;

export function validateClientDetails(details: ClientDetails): ClientErrors {
  const errors: ClientErrors = {};
  const fullName = details.fullName.trim();

  if (fullName.length < 2) {
    errors.fullName = "Please enter your full name (at least 2 characters).";
  } else if (fullName.length > 80) {
    errors.fullName = "Please keep your name under 80 characters.";
  }

  if (details.businessName.trim().length > 100) {
    errors.businessName = "Please keep the business or brand name under 100 characters.";
  }

  const email = details.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address, or leave this blank.";
  } else if (email.length > 254) {
    errors.email = "Please use a shorter email address.";
  }

  const phone = details.contactNumber.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (!PHONE_ALLOWED.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.contactNumber =
        "Please enter a valid contact number, or leave this blank.";
    }
  }

  const projectTitle = details.projectTitle.trim();
  if (projectTitle.length < 3) {
    errors.projectTitle = "Please give your project a short title.";
  } else if (projectTitle.length > 120) {
    errors.projectTitle = "Please keep the project title under 120 characters.";
  }

  if (details.projectDescription.trim().length > 2000) {
    errors.projectDescription = "Please keep the project description under 2,000 characters.";
  }

  if (details.preferredDeadline) {
    const deadline = parseIsoDate(details.preferredDeadline);
    if (!deadline) {
      errors.preferredDeadline = "Please choose a valid date.";
    } else if (details.preferredDeadline < todayIso()) {
      errors.preferredDeadline = "Please choose today or a future date.";
    }
  }

  if (details.notes.trim().length > 1500) {
    errors.notes = "Please keep additional notes under 1,500 characters.";
  }

  if (details.specialInstructions.trim().length > 1500) {
    errors.specialInstructions =
      "Please keep special instructions under 1,500 characters.";
  }

  return errors;
}

export function validatePricingInput(input: QuoteInput): PricingErrors {
  const errors: PricingErrors = {};

  if (!Number.isFinite(input.quantity) || input.quantity < 1) {
    errors.quantity = "Quantity must be at least 1.";
  } else if (input.quantity > 999) {
    errors.quantity = "For quantities above 999, please request a custom quotation.";
  }

  if (!Number.isFinite(input.variations) || input.variations < 1) {
    errors.variations = "Please enter at least one variation or size.";
  } else if (input.variations > 99) {
    errors.variations = "For more than 99 variations, please request a custom quotation.";
  }

  if (!Number.isFinite(input.extraRevisions) || input.extraRevisions < 0) {
    errors.extraRevisions = "Extra revisions cannot be negative.";
  } else if (input.extraRevisions > 99) {
    errors.extraRevisions = "For more than 99 extra revisions, please request a custom quotation.";
  }

  if (input.discountType === "fixed") {
    if (!Number.isFinite(input.discountValue) || input.discountValue < 0) {
      errors.discountValue = "Enter a fixed discount of zero or more.";
    }
  }

  if (input.discountType === "percentage") {
    if (
      !Number.isFinite(input.discountValue) ||
      input.discountValue < 0 ||
      input.discountValue > 100
    ) {
      errors.discountValue = "Enter a percentage between 0 and 100.";
    }
  }

  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
