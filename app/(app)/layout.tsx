import { Nav, NavLink } from "@/components/Nav";
import { TabBar } from "@/components/TabBar";

/**
 * Chrome for the app screens (/capture, /review, /inbox, /coverage, /settings).
 * Top nav on all sizes; bottom tab bar on mobile. The route group keeps the
 * §6 URLs unchanged (no "(app)" segment in the path).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Nav>
        {/* Top links are desktop-only; the bottom TabBar handles mobile nav. */}
        <div className="hidden items-center gap-5 md:flex">
          <NavLink href="/capture">Capture</NavLink>
          <NavLink href="/inbox">Inbox</NavLink>
          <NavLink href="/coverage">Coverage</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </div>
      </Nav>
      {/* pad bottom for the fixed mobile tab bar */}
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-12">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
