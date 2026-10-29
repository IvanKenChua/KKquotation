type LogoProps = {
  className?: string;
  showTagline?: boolean;
};

export function Logo({ className = "", showTagline = false }: LogoProps) {
  return (
    <span className={`brand-lockup ${className}`.trim()}>
      <img
        src="/brand/kenvas-wordmark.svg"
        alt="KENVAS KREATIVE"
        className="brand-lockup__wordmark"
        width="842"
        height="168"
      />
      <span className="brand-lockup__sub" aria-hidden="true">
        KREATIVE
      </span>
      {showTagline && (
        <span className="brand-lockup__tagline">
          Every idea deserves a canvas.
        </span>
      )}
    </span>
  );
}
