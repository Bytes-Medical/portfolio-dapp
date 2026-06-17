"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Capture" },
  { href: "/inbox", label: "Inbox" },
  { href: "/coverage", label: "Coverage" },
  { href: "/settings", label: "Settings" },
];

/**
 * Floating bottom nav for the native/mobile app. A detached carbon-copy bar with
 * the signature offset-shadow, floating clear of the iOS home indicator via the
 * safe-area inset. Hidden on desktop (md+), where the top nav carries navigation.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav className="cta-offset pointer-events-auto mx-auto flex w-[calc(100%-2rem)] max-w-md divide-x divide-rule-faint border border-ink bg-paper">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[3.25rem] flex-1 items-center justify-center font-ui uppercase text-[0.625rem] tracking-[0.1em] transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink-muted active:bg-accent-weak active:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
