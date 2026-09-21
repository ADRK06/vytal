import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const GLASS_CLASSES =
  "group relative isolate overflow-hidden rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 font-sans text-sm font-medium tracking-wide text-text backdrop-blur-[18px] transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-[0.98]";

function Glow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(94,234,212,0.35),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(255,122,89,0.28),transparent_55%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
    />
  );
}

type LiquidGlassLinkProps = { href: string; children: ReactNode; className?: string } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className"
>;

type LiquidGlassButtonProps = { href?: undefined; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

export function LiquidGlassButton({
  children,
  className = "",
  href,
  ...props
}: LiquidGlassLinkProps | LiquidGlassButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={`${GLASS_CLASSES} ${className}`}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        <Glow />
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${GLASS_CLASSES} ${className}`}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <Glow />
      {children}
    </button>
  );
}
