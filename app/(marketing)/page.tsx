import Link from "next/link";
import { Button } from "@/components/Button";
import { FormRow } from "@/components/FormRow";
import { HeroHeadline } from "@/components/HeroHeadline";
import { Nav, NavLink } from "@/components/Nav";

const YEAR = 2026;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
      {children}
    </p>
  );
}

function Rule() {
  return <div className="border-t border-rule-faint" aria-hidden="true" />;
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* 7.1 Nav */}
      <Nav>
        <div className="hidden items-center gap-5 sm:flex">
          <NavLink href="#how">How it works</NavLink>
          <NavLink href="/privacy">Privacy</NavLink>
        </div>
        <Button href="/capture" className="!px-4 !py-2">
          Open app
        </Button>
      </Nav>

      <main className="mx-auto w-full max-w-3xl px-4">
        {/* 7.2 Hero */}
        <section className="py-16 sm:py-24">
          <HeroHeadline
            text="You saw something worth keeping."
            className="text-[2rem] leading-[1.25] sm:text-[var(--t-hero)]"
          />
          <p className="mt-8 max-w-xl font-ui text-ink-muted text-[0.9375rem] leading-relaxed">
            Capture a clinical learning moment by voice or text in a minute. Byte
            Portfolio maps it to RCPCH Progress+ and drafts the entry. You review
            and paste it into Kaizen.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/capture" offset>
              Capture a moment
            </Button>
            <Button href="#how" variant="ghost">
              See how it works
            </Button>
          </div>
        </section>

        <Rule />

        {/* 7.3 The problem */}
        <section className="py-14">
          <Eyebrow>The problem</Eyebrow>
          <div className="mt-6 max-w-xl space-y-3">
            <FormRow label="The moment" value="3am, on take" />
            <FormRow label="The portfolio" value="a desk you'll reach in 4 days" />
            <FormRow label="The result" value="great work, unlogged" />
          </div>
          <p className="mt-6 max-w-xl font-ui text-[0.875rem] text-ink-muted leading-relaxed">
            Under-logging isn&apos;t a motivation problem. It&apos;s friction and
            timing. Byte Portfolio removes both.
          </p>
        </section>

        <Rule />

        {/* 7.4 How it works */}
        <section id="how" className="scroll-mt-20 py-14">
          <Eyebrow>How it works</Eyebrow>
          <ol className="mt-8 space-y-8">
            {[
              {
                n: "01",
                t: "Speak",
                d: "Talk or type for a minute while it's fresh.",
              },
              {
                n: "02",
                t: "Map",
                d: "It proposes the Progress+ domain, outcome and key capability.",
              },
              {
                n: "03",
                t: "Keep",
                d: "Review, accept, and paste into Kaizen.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-5">
                <span className="font-typed text-[1.625rem] leading-none text-ink-faint">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-ui uppercase tracking-[0.12em] text-[0.8125rem] text-ink">
                    {step.t}
                  </h3>
                  <p className="mt-2 max-w-md font-typed text-[0.9375rem] text-ink-muted">
                    {step.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 7.5 Privacy panel — inverse block (the trust headline) */}
        <section id="privacy" className="scroll-mt-20 py-14">
          <div className="border border-ink bg-inverse-bg p-6 text-inverse-fg sm:p-8">
            <Eyebrow>
              <span className="text-paper/70">Privacy</span>
            </Eyebrow>
            <p className="mt-4 max-w-xl font-typed text-[1.0625rem] leading-relaxed">
              What you type never leaves your device. Patient details are scrubbed
              on your phone before anything is sent for mapping, and entries live
              locally — we can&apos;t see your patients.
            </p>
            <p className="mt-4 max-w-xl font-typed text-[0.9375rem] leading-relaxed text-paper/70">
              If you dictate, audio is transcribed by ElevenLabs, so voice does
              leave your device — but the same redaction step still runs before
              anything is mapped. Prefer typing for the most sensitive notes.
            </p>
            <Link
              href="/privacy"
              className="mt-5 inline-block font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-paper underline underline-offset-4 hover:text-accent"
            >
              Read the full privacy statement →
            </Link>
          </div>
        </section>

        <Rule />

        {/* 7.6 Who it's for */}
        <section className="py-14">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <p className="mt-6 max-w-xl font-typed text-[0.9375rem] text-ink leading-relaxed">
            Paediatric trainees on RCPCH Progress+ (ST1–ST7), plus SAS and MTI
            doctors. Expandable to other colleges.
          </p>
        </section>

        <Rule />

        {/* 7.7 Ecosystem */}
        <section className="py-14">
          <p className="font-typed text-[0.9375rem] text-ink-muted">
            Part of the Bytes family, alongside Bytes Teaching.
          </p>
        </section>

        <Rule />

        {/* 7.8 Final CTA */}
        <section className="py-16">
          <HeroHeadline
            text="Log it before you lose it."
            className="text-[1.625rem] leading-tight"
          />
          <div className="mt-8">
            <Button href="/capture" offset>
              Start capturing
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8 font-ui text-[0.75rem] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-typed lowercase text-[0.9375rem] text-ink">
            byte portfolio
          </span>
          <span className="max-w-md leading-relaxed">
            A drafting aid, not an official ePortfolio. Reflections must be
            anonymised.
          </span>
          <Link
            href="/privacy"
            className="uppercase tracking-[0.1em] underline underline-offset-4 hover:text-ink"
          >
            Privacy
          </Link>
          <span>© {YEAR}</span>
        </div>
      </footer>
    </div>
  );
}
