import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import {
  CATEGORY_BLURB,
  SERVICES,
  SERVICE_CATEGORIES,
} from "@/data/pricing";
import {
  PRICING_METHOD_LABELS,
  pricingMethodDetail,
} from "@/pricing/labels";
import type { ServiceCategory, ServiceConfig } from "@/pricing/types";

type Filter = ServiceCategory | "All";

type ServicePickerProps = {
  selectedServiceId: string | null;
  onSelect: (service: ServiceConfig) => void;
};

const FILTERS: Filter[] = ["All", ...SERVICE_CATEGORIES];

export function ServicePicker({
  selectedServiceId,
  onSelect,
}: ServicePickerProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SERVICES.filter((service) => {
      const matchesCategory = filter === "All" || service.category === filter;
      if (!matchesCategory) return false;
      if (!normalized) return true;
      const haystack = [
        service.name,
        service.description,
        service.category,
        PRICING_METHOD_LABELS[service.pricingMethod],
        ...(service.searchTerms ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filter, query]);

  return (
    <section
      id="services"
      className="section-pad services-section no-print"
      aria-labelledby="services-title"
    >
      <div className="container-kk">
        <div className="section-heading">
          <div>
            <p className="eyebrow text-teal-dark">01 — Select a service</p>
            <h2 id="services-title" className="section-title">
              What are we <span className="serif-accent">making?</span>
            </h2>
          </div>
          <p className="section-heading__copy">
            Choose from the design services currently offered. Every card shows
            the pricing method and how the package is structured — select one to
            open its project settings.
          </p>
        </div>

        <div className="service-toolbar">
          <div className="service-search">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="service-search" className="sr-only">
              Search design services
            </label>
            <input
              id="service-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by service, e.g. logo, menu, slides…"
              autoComplete="off"
            />
          </div>

          <div className="service-filters" role="group" aria-label="Filter by category">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip ${filter === item ? "is-active" : ""}`}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="service-results" aria-live="polite">
          <p>
            <SlidersHorizontal size={14} aria-hidden="true" />
            {filtered.length} {filtered.length === 1 ? "service" : "services"}
            {filter !== "All" ? ` in ${filter}` : ""}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </p>
          {selectedServiceId && (
            <a href="#calculator" className="service-results__link">
              Continue to project settings
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="service-grid">
            {filtered.map((service) => {
              const selected = selectedServiceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  className={`service-card ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(service)}
                >
                  <span className="service-card__top">
                    <span className="service-card__category">
                      {service.category}
                    </span>
                    {selected && (
                      <span className="service-card__check" aria-hidden="true">
                        <Check size={13} />
                      </span>
                    )}
                  </span>
                  <span className="service-card__name">{service.name}</span>
                  <span className="service-card__description">
                    {service.description}
                  </span>
                  <span className="service-card__meta">
                    <span className="method-badge">
                      {PRICING_METHOD_LABELS[service.pricingMethod]}
                    </span>
                    <span>{service.includedRevisions} revisions included</span>
                  </span>
                  <span className="service-card__footer">
                    <span>{pricingMethodDetail(service.pricingMethod)}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <SearchX size={22} />
            </span>
            <h3>No services match that search</h3>
            <p>
              Try a different keyword or choose another category. You can also
              select “Other Custom Design” for a project outside the list.
            </p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <p className="services-note">
          {CATEGORY_BLURB["Presentation & Custom"]} and other specialist work
          can be scoped through “Other Custom Design”. Rates are confirmed after
          the project scope is reviewed.
        </p>
      </div>
    </section>
  );
}
