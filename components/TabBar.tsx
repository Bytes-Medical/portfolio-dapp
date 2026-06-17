"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/capture", label: "Capture" },
  { href: "/inbox", label: "Inbox" },
  { href: "/coverage", label: "Coverage" },
  { href: "/settings", label: "Settings" },
];

/**
 * Mobile bottom tab bar (§6). The primary action everywhere is Capture.
 * Hidden on desktop (md+), where the top nav carries navigation.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-ink bg-paper md:hidden">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-center border-t-2 py-3 font-ui uppercase text-[0.6875rem] tracking-[0.12em] ${
              active
                ? "border-accent bg-ink text-paper"
                : "border-transparent text-ink-muted"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
