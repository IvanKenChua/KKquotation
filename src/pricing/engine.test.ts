import { describe, expect, it } from "vitest";
import { SERVICE_BY_ID } from "@/data/pricing";
import {
  calculateQuote,
  calculateQuoteForService,
  defaultQuoteInput,
} from "@/pricing/engine";
import { formatCurrency } from "@/pricing/format";
import type { QuoteInput, ServiceConfig } from "@/pricing/types";

function quote(serviceId: string, overrides: Partial<QuoteInput> = {}) {
  const result = calculateQuote({
    ...defaultQuoteInput(serviceId),
    ...overrides,
    serviceId,
  });
  if (!result) throw new Error(`Missing service ${serviceId}`);
  return result;
}

function service(id: string): ServiceConfig {
  const found = SERVICE_BY_ID.get(id);
  if (!found) throw new Error(`Missing service ${id}`);
  return found;
}

describe("pricing engine", () => {
  it("Scenario A: does not multiply a fixed-price base fee by quantity", () => {
    const result = quote("logo-design", { quantity: 5 });

    expect(result.baseFee).toBe(1000);
    expect(result.quantityCharges).toBe(0);
    expect(result.quantity.additional).toBe(0);
    expect(result.quantity.applies).toBe(false);
    expect(result.total).toBe(1025);
    expect(result.warnings.some((warning) => warning.code === "fixed-quantity")).toBe(
      true
    );
  });

  it("Scenario B: charges only units beyond the included quantity", () => {
    const result = quote("social-media-graphics", { quantity: 5 });

    expect(result.quantity.included).toBe(1);
    expect(result.quantity.additional).toBe(4);
    expect(result.quantity.unitRate).toBe(150);
    expect(result.quantityCharges).toBe(600);
    expect(result.baseFee).toBe(500);
    expect(result.total).toBe(1125);
  });

  it("Scenario C: adds no quantity charge when the request is within the included allowance", () => {
    const baseService = service("brochure-design");
    const result = calculateQuoteForService(
      { ...baseService, includedQuantity: 5 },
      { ...defaultQuoteInput(baseService.id), quantity: 3 }
    );

    expect(result.quantity.included).toBe(5);
    expect(result.quantity.additional).toBe(0);
    expect(result.quantityCharges).toBe(0);
    expect(result.total).toBe(425);
  });

  it("Scenario D: applies only the selected complexity adjustment", () => {
    const basic = quote("menu-design", { complexity: "basic" });
    const standard = quote("menu-design", { complexity: "standard" });
    const complex = quote("menu-design", { complexity: "complex" });

    expect(basic.complexityAdjustment).toBe(25);
    expect(standard.complexityAdjustment).toBe(100);
    expect(complex.complexityAdjustment).toBe(250);

    expect(basic.total).toBe(1025);
    expect(standard.total).toBe(1100);
    expect(complex.total).toBe(1250);
  });

  it("Scenario E: applies only the selected urgency fee", () => {
    const standard = quote("logo-design", { urgency: "standard" });
    const rush = quote("logo-design", { urgency: "rush" });
    const express = quote("logo-design", { urgency: "express" });

    expect(standard.urgencyFee).toBe(0);
    expect(rush.urgencyFee).toBe(250);
    expect(express.urgencyFee).toBe(1000);

    expect(rush.urgencyFee).not.toBe(250 + 1000);
    expect(express.total).toBe(2025);
  });

  it("Scenario F: bills add-on quantities at configured rates without duplicating", () => {
    const result = quote("social-media-graphics", {
      addOns: { mockups: 2, "image-sourcing": 1 },
      variations: 2,
      extraRevisions: 1,
    });

    expect(result.addOnCharges).toBe(300);
    expect(result.variationCharges).toBe(150);
    expect(result.extraRevisionCharges).toBe(100);
    expect(result.additionalServices).toBe(550);
    expect(result.total).toBe(1075);

    const mockupLine = result.lines.find((line) => line.id === "addon-mockups");
    expect(mockupLine?.amount).toBe(200);
    expect(mockupLine?.description).toContain(formatCurrency(100));
  });

  it("Scenario F: does not double-charge copywriting via status and add-on", () => {
    const result = quote("logo-design", {
      contentStatus: "needs-copywriting",
      addOns: { copywriting: 2 },
    });

    expect(result.contentPhotoCharges).toBe(100);
    expect(result.addOnCharges).toBe(0);
    expect(result.total).toBe(1125);
    expect(result.warnings.some((warning) => warning.code === "addon-covered")).toBe(
      true
    );
  });

  it("Scenario F: caps project-scoped add-ons at one", () => {
    const result = quote("logo-design", {
      addOns: { "editable-source-files": 3 },
    });

    expect(result.addOnCharges).toBe(100);
    expect(result.warnings.some((warning) => warning.code === "invalid-addon-quantity")).toBe(
      true
    );
  });

  it("Scenario G: applies fixed and percentage discounts", () => {
    const fixed = quote("logo-design", {
      discountType: "fixed",
      discountValue: 100,
    });
    expect(fixed.discountAmount).toBe(100);
    expect(fixed.total).toBe(925);

    const percentage = quote("logo-design", {
      discountType: "percentage",
      discountValue: 10,
    });
    expect(percentage.discountAmount).toBe(102.5);
    expect(percentage.total).toBe(922.5);

    const none = quote("logo-design");
    expect(none.discountAmount).toBe(0);
    expect(none.total).toBe(1025);
  });

  it("Scenario G: caps invalid or oversized discounts and never goes negative", () => {
    const overSubtotal = quote("logo-design", {
      discountType: "fixed",
      discountValue: 5000,
    });
    expect(overSubtotal.discountAmount).toBe(1025);
    expect(overSubtotal.total).toBe(0);
    expect(
      overSubtotal.warnings.some((warning) => warning.code === "discount-capped")
    ).toBe(true);

    const overPercentage = quote("logo-design", {
      discountType: "percentage",
      discountValue: 150,
    });
    expect(overPercentage.discountAmount).toBe(1025);
    expect(overPercentage.total).toBe(0);
    expect(
      overPercentage.warnings.some(
        (warning) => warning.code === "invalid-percentage"
      )
    ).toBe(true);

    const negative = quote("logo-design", {
      discountType: "fixed",
      discountValue: -50,
    });
    expect(negative.discountAmount).toBe(0);
    expect(negative.total).toBe(1025);
  });

  it("Scenario H: flags custom-price services for manual review without a total", () => {
    const result = quote("other-custom-design", {
      quantity: 3,
      complexity: "complex",
      addOns: { mockups: 1 },
    });

    expect(result.pricingMethod).toBe("custom");
    expect(result.requiresManualReview).toBe(true);
    expect(result.total).toBeNull();
    expect(result.subtotal).toBeNull();
    expect(result.lines).toHaveLength(0);
    expect(result.reviewMessage).toContain("personalized quotation");
    expect(result.warnings.some((warning) => warning.code === "custom-quote")).toBe(
      true
    );
  });

  it("does not double-charge photo editing on the Photo Editing service", () => {
    const result = quote("photo-editing", {
      quantity: 3,
      photoStatus: "needs-photo-editing",
    });

    expect(result.contentPhotoCharges).toBe(0);
    expect(result.warnings.some((warning) => warning.code === "photo-included")).toBe(
      true
    );
  });

  it("tracks included and extra revisions", () => {
    const result = quote("photo-editing", {
      extraRevisions: 2,
    });

    expect(result.includedRevisions).toBe(1);
    expect(result.extraRevisions).toBe(2);
    expect(result.totalRevisions).toBe(3);
    expect(result.extraRevisionCharges).toBe(200);
  });
});
