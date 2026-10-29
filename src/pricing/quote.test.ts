import { describe, expect, it } from "vitest";
import { calculateQuote, defaultQuoteInput } from "@/pricing/engine";
import { formatCurrency } from "@/pricing/format";
import {
  buildQuotation,
  buildQuotationMailto,
  buildShareText,
  createQuotationMeta,
  generateQuotationNumber,
} from "@/pricing/quote";
import type { ClientDetails, QuoteCalculation, QuotationMeta } from "@/pricing/types";

const details: ClientDetails = {
  fullName: "Alex Rivera",
  businessName: "Northline Coffee",
  email: "client@example.com",
  contactNumber: "0917 000 0000",
  projectTitle: "Northline Coffee campaign",
  projectDescription: "A five-graphic campaign set for a coffee brand launch.",
  preferredDeadline: "2026-12-15",
  notes: "Please keep the brand colours.",
  specialInstructions: "Include the brand mark.",
};

const meta: QuotationMeta = {
  quotationNumber: "KK-20261030-TEST",
  quotationDate: "2026-10-30",
  validUntil: "2026-11-13",
};

function socialCalculation(): QuoteCalculation {
  const result = calculateQuote({
    ...defaultQuoteInput("social-media-graphics"),
    quantity: 5,
    variations: 2,
    complexity: "standard",
    contentStatus: "needs-copywriting",
    photoStatus: "needs-photo-editing",
    urgency: "rush",
    extraRevisions: 1,
    addOns: { mockups: 1 },
    discountType: "fixed",
    discountValue: 100,
  });
  if (!result) throw new Error("Missing quote calculation");
  return result;
}

describe("client quotation", () => {
  it("Scenario I: matches the pricing engine breakdown, explanations, and total", () => {
    const calculation = socialCalculation();
    const quotation = buildQuotation(calculation, details, meta);

    expect(quotation.total).toBe(calculation.total);
    expect(quotation.total).toBe(1850);
    expect(quotation.quotationNumber).toBe("KK-20261030-TEST");
    expect(quotation.quotationDate).toBe("2026-10-30");
    expect(quotation.validUntil).toBe("2026-11-13");

    expect(quotation.lines.find((line) => line.id === "base")?.amount).toBe(500);
    expect(quotation.lines.find((line) => line.id === "quantity")?.amount).toBe(600);
    expect(quotation.lines.find((line) => line.id === "quantity")?.description).toContain(
      "4 additional graphics"
    );
    expect(quotation.lines.find((line) => line.id === "quantity")?.description).toContain(
      formatCurrency(150)
    );
    expect(quotation.lines.find((line) => line.id === "complexity")?.amount).toBe(50);
    expect(
      quotation.lines.find((line) => line.id === "content-copywriting")?.amount
    ).toBe(100);
    expect(
      quotation.lines.find((line) => line.id === "content-photo-editing")?.amount
    ).toBe(100);
    expect(quotation.lines.find((line) => line.id === "addon-mockups")?.amount).toBe(
      100
    );
    expect(quotation.lines.find((line) => line.id === "additional-variations")?.amount).toBe(
      150
    );
    expect(quotation.lines.find((line) => line.id === "extra-revisions")?.amount).toBe(
      100
    );
    expect(quotation.lines.find((line) => line.id === "urgency")?.amount).toBe(250);
    expect(quotation.lines.find((line) => line.id === "discount")?.amount).toBe(-100);

    expect(quotation.specifications).toEqual(
      expect.arrayContaining([
        { label: "Service", value: "Social Media Graphics" },
        { label: "Design complexity", value: "Standard" },
        { label: "Content status", value: "Needs copywriting" },
        { label: "Photo status", value: "Needs photo editing" },
        { label: "Urgency", value: "Rush" },
      ])
    );
    expect(
      quotation.specifications.find((specification) => specification.label === "Quantity")
        ?.value
    ).toContain("4 additional beyond the 1 included");
    expect(quotation.isEstimate).toBe(true);
    expect(quotation.scopeDisclaimer).toContain("Printing, production");
    expect(quotation.estimateDisclaimer).toContain("not a confirmed booking");
    expect(quotation.paymentTerms).toBe("50% deposit, 50% upon completion");
  });

  it("Scenario H: builds a manual-review quotation without a total", () => {
    const calculation = calculateQuote({
      ...defaultQuoteInput("other-custom-design"),
      quantity: 1,
    });
    if (!calculation) throw new Error("Missing quote calculation");

    const quotation = buildQuotation(calculation, details, meta);

    expect(quotation.requiresManualReview).toBe(true);
    expect(quotation.total).toBeNull();
    expect(quotation.lines).toHaveLength(0);
    expect(quotation.reviewMessage).toContain("personalized quotation");
    expect(quotation.estimatedTurnaround).toBe("Confirmed after scope review");
  });

  it("generates a shareable text summary with dynamic line items", () => {
    const quotation = buildQuotation(socialCalculation(), details, meta);
    const text = buildShareText(quotation);

    expect(text).toContain("KENVAS KREATIVE");
    expect(text).toContain("KK-20261030-TEST");
    expect(text).toContain("Northline Coffee campaign");
    expect(text).toContain("Quantity Charges");
    expect(text).toContain(formatCurrency(1850));
    expect(text).toContain("50% deposit, 50% upon completion");
    expect(text).toContain("not a confirmed booking");
  });

  it("generates quotation references in the expected format", () => {
    const reference = generateQuotationNumber(new Date(2026, 9, 30));
    expect(reference).toMatch(/^KK-20261030-[A-Z2-9]{4}$/);
  });

  it("creates a 14-day validity window", () => {
    const quotationMeta = createQuotationMeta(new Date(2026, 9, 30));
    expect(quotationMeta.quotationDate).toBe("2026-10-30");
    expect(quotationMeta.validUntil).toBe("2026-11-13");
  });

  it("Scenario J: builds a prefilled email draft without auto-sending", () => {
    const quotation = buildQuotation(socialCalculation(), details, meta);
    const mailto = buildQuotationMailto(quotation, "kenvaskreative@gmail.com");
    const [address, query = ""] = mailto.split("?");
    const params = new URLSearchParams(query);
    const subject = params.get("subject") ?? "";
    const body = params.get("body") ?? "";

    expect(address).toBe("mailto:kenvaskreative@gmail.com");
    expect(subject).toContain("Quotation request KK-20261030-TEST");
    expect(subject).toContain("Northline Coffee campaign");
    expect(body).toContain("I would like to request the following design quotation");
    expect(body).toContain("not a confirmed booking");
    expect(body).toContain("KK-20261030-TEST");
    expect(body).toContain("Client email: client@example.com");
  });
});
