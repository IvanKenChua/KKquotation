import { ArrowUpRight, Facebook, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { business, hasEmail, hasFacebook } from "@/config/business";

export function Footer() {
  return (
    <footer className="site-footer no-print">
      <div className="container-kk">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo showTagline />
            <p>
              A design pricing calculator for a freelance design practice.
              Every idea deserves a canvas.
            </p>
          </div>

          <nav className="site-footer__nav" aria-label="Footer navigation">
            <a href="#services">Services</a>
            <a href="#calculator">Calculator</a>
            <a href="#quotation">Quotation</a>
            <a href="#top">Back to top</a>
          </nav>

          <div className="site-footer__contact">
            <p className="eyebrow">Contact</p>
            {hasEmail && (
              <a href={`mailto:${business.email}`}>
                <Mail size={15} aria-hidden="true" />
                {business.email}
              </a>
            )}
            {hasFacebook && (
              <a
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={15} aria-hidden="true" />
                Facebook
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            )}
            <span>{business.location}</span>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            {business.name} · Design pricing calculator. Estimates are subject
            to scope confirmation.
          </p>
          <p>No account, payment, or personal information is required to view an estimate.</p>
        </div>
      </div>
    </footer>
  );
}
