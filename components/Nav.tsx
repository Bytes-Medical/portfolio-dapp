import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Top bar (§5.4): wordmark `byte portfolio` lowercase Courier Prime on the left;
 * caller supplies the right-side links/CTA as children.
 */
export function Nav({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-ink">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 max-w-5xl">
        <Link
          href="/"
          className="flex items-center gap-2 font-typed lowercase text-[1.05rem] leading-none tracking-tight text-ink"
        >
          <span aria-hidden="true" className="text-accent">
            ▪
          </span>
          byte portfolio
        </Link>
        {children ? (
          <nav className="flex items-center gap-3 sm:gap-5">{children}</nav>
        ) : null}
      </div>
    </header>
  );
}

/** A plain uppercase chrome link for the nav right side. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted hover:text-ink"
    >
      {children}
    </Link>
  );
}
