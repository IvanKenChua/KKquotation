import { describe, expect, it } from "vitest";
import { validateClientDetails, validatePricingInput } from "@/lib/validation";
import { defaultQuoteInput } from "@/pricing/engine";
import { addDaysIso, todayIso } from "@/pricing/format";

describe("client detail validation", () => {
  const validClient = {
    fullName: "Ivan Ken Chua",
    businessName: "Kenvas Kreative",
    email: "",
    contactNumber: "",
    projectTitle: "New logo",
    projectDescription: "",
    preferredDeadline: addDaysIso(todayIso(), 10),
    notes: "",
    specialInstructions: "",
  };

  it("accepts a minimal valid client with optional fields blank", () => {
    expect(validateClientDetails(validClient)).toEqual({});
  });

  it("requires a name and project title", () => {
    const errors = validateClientDetails({
      ...validClient,
      fullName: "",
      projectTitle: "",
    });
    expect(errors.fullName).toBeTruthy();
    expect(errors.projectTitle).toBeTruthy();
  });

  it("rejects malformed optional email and phone values", () => {
    const errors = validateClientDetails({
      ...validClient,
      email: "not-an-email",
      contactNumber: "call me",
    });
    expect(errors.email).toBeTruthy();
    expect(errors.contactNumber).toBeTruthy();
  });

  it("rejects a deadline in the past", () => {
    const errors = validateClientDetails({
      ...validClient,
      preferredDeadline: "2020-01-01",
    });
    expect(errors.preferredDeadline).toBeTruthy();
  });
});

describe("pricing input validation", () => {
  it("rejects invalid quantity and percentage values", () => {
    const errors = validatePricingInput({
      ...defaultQuoteInput("logo-design"),
      quantity: 0,
      variations: 0,
      discountType: "percentage",
      discountValue: 150,
    });

    expect(errors.quantity).toBeTruthy();
    expect(errors.variations).toBeTruthy();
    expect(errors.discountValue).toBeTruthy();
  });

  it("accepts valid discount values", () => {
    const errors = validatePricingInput({
      ...defaultQuoteInput("logo-design"),
      discountType: "fixed",
      discountValue: 100,
    });
    expect(errors).toEqual({});
  });
});
