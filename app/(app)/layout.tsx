import { Nav, NavLink } from "@/components/Nav";
import { TabBar } from "@/components/TabBar";

/**
 * Chrome for the app screens (home/capture, /review, /inbox, /coverage,
 * /settings). Top nav on all sizes; floating tab bar on mobile. The route group
 * keeps the URLs unchanged (no "(app)" segment in the path); `/` is the home.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Nav>
        {/* Top links are desktop-only; the floating TabBar handles mobile nav. */}
        <div className="hidden items-center gap-5 md:flex">
          <NavLink href="/">Capture</NavLink>
          <NavLink href="/inbox">Inbox</NavLink>
          <NavLink href="/coverage">Coverage</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </div>
      </Nav>
      {/* Bottom padding clears the floating mobile bar + home-indicator inset. */}
      <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(6.5rem_+_env(safe-area-inset-bottom))] pt-6 md:pb-12">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
