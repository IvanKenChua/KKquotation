import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";

const links = [
  { href: "#services", label: "Services" },
  { href: "#calculator", label: "Calculator" },
  { href: "#quotation", label: "Quotation" },
];

export function Header() {
  return (
    <header className="site-header no-print">
      <div className="container-kk site-header__inner">
        <a
          href="#top"
          className="brand-link"
          aria-label="KENVAS KREATIVE — back to top"
        >
          <Logo />
          <span className="brand-link__divider" aria-hidden="true" />
          <span className="brand-link__label">Design Pricing Calculator</span>
        </a>

        <nav className="header-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#services" className="btn btn--green btn--sm header-cta">
          <span className="header-cta__full">Create Quotation</span>
          <span className="header-cta__short">Quote</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
