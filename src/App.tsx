import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight, Compass, Info } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileSummaryBar } from "@/components/MobileSummaryBar";
import { PriceSummary } from "@/components/PriceSummary";
import { ProjectForm } from "@/components/ProjectForm";
import { QuotePreview } from "@/components/QuotePreview";
import { RequestDialog } from "@/components/RequestDialog";
import { ServicePicker } from "@/components/ServicePicker";
import { EMPTY_CLIENT_DETAILS } from "@/data/pricing";
import { useCopy } from "@/hooks/useCopy";
import {
  hasErrors,
  validateClientDetails,
  validatePricingInput,
} from "@/lib/validation";
import { calculateQuote, defaultQuoteInput } from "@/pricing/engine";
import {
  buildQuotation,
  buildShareText,
  createQuotationMeta,
} from "@/pricing/quote";
import type {
  AddOnId,
  ClientDetails,
  QuoteInput,
  ServiceConfig,
} from "@/pricing/types";

const FIELD_IDS: Record<string, string> = {
  fullName: "client-fullName",
  businessName: "client-businessName",
  email: "client-email",
  contactNumber: "client-contactNumber",
  projectTitle: "client-projectTitle",
  projectDescription: "client-projectDescription",
  preferredDeadline: "client-preferredDeadline",
  notes: "client-notes",
  specialInstructions: "client-specialInstructions",
  quantity: "service-quantity",
  variations: "service-variations",
  extraRevisions: "service-extra-revisions",
  discountValue: "discount-value",
};

function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      element.focus({ preventScroll: true });
    }
  }, 450);
}

function firstErrorId(errors: Record<string, string | undefined>): string | null {
  const key = Object.keys(errors).find((field) => Boolean(errors[field]));
  if (!key) return null;
  return FIELD_IDS[key] ?? null;
}

function App() {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [input, setInput] = useState<QuoteInput>(() => defaultQuoteInput());
  const [details, setDetails] = useState<ClientDetails>(EMPTY_CLIENT_DETAILS);
  const [meta] = useState(() => createQuotationMeta());
  const [showErrors, setShowErrors] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [mobileSummaryDismissed, setMobileSummaryDismissed] = useState(false);
  const { copied, copy } = useCopy();

  const calculation = useMemo(
    () =>
      selectedServiceId ? calculateQuote({ ...input, serviceId: selectedServiceId }) : null,
    [input, selectedServiceId]
  );

  const quotation = useMemo(
    () => (calculation ? buildQuotation(calculation, details, meta) : null),
    [calculation, details, meta]
  );

  const clientErrors = useMemo(
    () => validateClientDetails(details),
    [details]
  );
  const pricingErrors = useMemo(() => validatePricingInput(input), [input]);

  const handleSelectService = (service: ServiceConfig) => {
    if (service.id === selectedServiceId) {
      scrollToId("calculator");
      return;
    }
    setSelectedServiceId(service.id);
    setInput(defaultQuoteInput(service.id));
    setShowErrors(false);
    setMobileSummaryDismissed(false);
  };

  const handleInputChange = (patch: Partial<QuoteInput>) => {
    setInput((current) => {
      if (patch.discountType !== undefined) {
        return {
          ...current,
          ...patch,
          discountValue:
            patch.discountType === "none" ? 0 : current.discountValue,
        };
      }
      return { ...current, ...patch };
    });
  };

  const handleDetailsChange = (patch: Partial<ClientDetails>) => {
    setDetails((current) => ({ ...current, ...patch }));
  };

  const handleToggleAddOn = (id: AddOnId) => {
    setInput((current) => {
      const nextAddOns = { ...current.addOns };
      if ((nextAddOns[id] ?? 0) > 0) {
        delete nextAddOns[id];
      } else {
        nextAddOns[id] = 1;
      }
      return { ...current, addOns: nextAddOns };
    });
  };

  const handleAddOnQuantity = (id: AddOnId, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity || 1));
    setInput((current) => ({
      ...current,
      addOns: { ...current.addOns, [id]: safeQuantity },
    }));
  };

  const validateBeforeRequest = (): boolean => {
    setShowErrors(true);
    const combinedErrors = { ...clientErrors, ...pricingErrors };
    if (hasErrors(combinedErrors)) {
      const id = firstErrorId(combinedErrors);
      if (id) window.setTimeout(() => scrollToId(id), 50);
      return false;
    }
    return true;
  };

  const handleRequest = () => {
    if (!quotation) return;
    if (!validateBeforeRequest()) return;
    setRequestOpen(true);
  };

  const handlePrint = useCallback(() => {
    if (!quotation) return;
    setShowErrors(true);
    if (hasErrors(clientErrors)) {
      const id = firstErrorId(clientErrors);
      if (id) scrollToId(id);
      return;
    }
    window.print();
  }, [clientErrors, quotation]);

  const handleCopy = () => {
    if (quotation) void copy(buildShareText(quotation));
  };

  const handlePrintFromDialog = () => {
    setRequestOpen(false);
    window.setTimeout(() => window.print(), 120);
  };

  const handleReview = () => scrollToId("quotation");
  const handleChangeService = () => scrollToId("services");

  return (
    <div
      className={`app-shell ${calculation ? "has-mobile-summary" : ""}`.trim()}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content">
        <Hero />

        <ServicePicker
          selectedServiceId={selectedServiceId}
          onSelect={handleSelectService}
        />

        <section
          id="calculator"
          className="calculator-section section-pad no-print"
          aria-labelledby="calculator-title"
        >
          <div className="container-kk">
            <div className="section-heading">
              <div>
                <p className="eyebrow text-teal-dark">02 — Configure your project</p>
                <h2 id="calculator-title" className="section-title">
                  Build the <span className="serif-accent">quotation.</span>
                </h2>
              </div>
              <p className="section-heading__copy">
                Set the scope, content needs, and timeline. The price summary
                updates instantly, and nothing is final until the project is
                reviewed.
              </p>
            </div>

            {calculation && selectedServiceId ? (
              <div className="calculator-grid">
                <ProjectForm
                  service={calculation.service}
                  calculation={calculation}
                  input={input}
                  details={details}
                  clientErrors={clientErrors}
                  pricingErrors={pricingErrors}
                  showErrors={showErrors}
                  onInputChange={handleInputChange}
                  onDetailsChange={handleDetailsChange}
                  onToggleAddOn={handleToggleAddOn}
                  onAddOnQuantityChange={handleAddOnQuantity}
                  onRequest={handleRequest}
                  onReview={handleReview}
                  onChangeService={handleChangeService}
                />
                <div className="summary-column">
                  <div className="summary-sticky">
                    <PriceSummary
                      calculation={calculation}
                      onReview={handleReview}
                      onRequest={handleRequest}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="calculator-empty">
                <span className="calculator-empty__icon" aria-hidden="true">
                  <Compass size={24} />
                </span>
                <div>
                  <h3>Start with a design service</h3>
                  <p>
                    Pick the closest match above. You can change the service at
                    any time before requesting your quotation.
                  </p>
                </div>
                <a href="#services" className="btn btn--green btn--md">
                  Browse services
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
            )}

            <div className="pricing-note">
              <Info size={15} aria-hidden="true" />
              <p>
                Fixed-price services are not multiplied by quantity. Per-unit
                services only charge for units beyond the included quantity.
                Custom-price projects require a personal review before any price
                is confirmed.
              </p>
            </div>
          </div>
        </section>

        <QuotePreview
          quotation={quotation}
          copied={copied}
          onCopy={handleCopy}
          onPrint={handlePrint}
          onRequest={handleRequest}
        />
      </main>

      <Footer />

      {calculation && !mobileSummaryDismissed && (
        <MobileSummaryBar
          calculation={calculation}
          onReview={handleReview}
          onDismiss={() => setMobileSummaryDismissed(true)}
        />
      )}

      <RequestDialog
        open={requestOpen}
        quotation={quotation}
        onClose={() => setRequestOpen(false)}
        onPrint={handlePrintFromDialog}
      />
    </div>
  );
}

export default App;
