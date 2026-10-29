import { ArrowDown, ArrowUpRight, Check } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose a service",
    text: "Start with the design category that best matches what you need.",
  },
  {
    number: "02",
    title: "Set the scope",
    text: "Add quantities, complexity, content needs, and any extras.",
  },
  {
    number: "03",
    title: "Review the quotation",
    text: "See a transparent breakdown, then print it or send it to us.",
  },
];

export function Hero() {
  return (
    <section id="top" className="hero texture-paper no-print">
      <div className="hero__wash" aria-hidden="true" />
      <div className="hero__mark" aria-hidden="true">
        <img src="/brand/kenvas-mark.svg" alt="" />
      </div>

      <div className="container-kk hero__inner">
        <div className="hero__copy">
          <p className="eyebrow text-teal-dark">Design pricing calculator</p>
          <h1 className="display hero__title">
            Let&apos;s bring your{" "}
            <span className="serif-accent hero__accent">ideas</span>{" "}
            to life.
          </h1>
          <p className="hero__lede">
            Tell us about your project and get a personalized design quotation
            based on your selected services, requirements, and turnaround time.
          </p>

          <div className="hero__actions">
            <a href="#services" className="btn btn--green btn--lg">
              Calculate My Quote
              <ArrowDown size={17} aria-hidden="true" />
            </a>
            <a href="#quotation" className="btn btn--outline btn--lg">
              View quotation format
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <p className="hero__note">
            <Check size={14} aria-hidden="true" />
            Transparent pricing. Clear project scope. No obligation.
          </p>
        </div>

        <aside className="hero__panel" aria-label="How the calculator works">
          <div className="hero__panel-head">
            <p className="eyebrow">How it works</p>
            <span className="hero__panel-badge">No account needed</span>
          </div>

          <ol className="hero__steps">
            {steps.map((step) => (
              <li key={step.number} className="hero__step">
                <span className="hero__step-number">{step.number}</span>
                <span>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="hero__panel-foot">
            <span>Every idea deserves a canvas.</span>
            <span>Estimate only · confirmed after review</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
