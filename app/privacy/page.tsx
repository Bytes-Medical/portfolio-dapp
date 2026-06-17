import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Privacy statement · byte portfolio",
  description:
    "How Byte Portfolio handles your data: local-first storage, client-side redaction, and exactly what is sent off your device.",
};

const UPDATED = "14 June 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule-faint py-7">
      <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
        {title}
      </h2>
      <div className="mt-3 space-y-3 font-typed text-[0.9375rem] leading-relaxed text-ink">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <Nav>
        <Button href="/" className="!px-4 !py-2">
          Open app
        </Button>
      </Nav>

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Privacy statement
        </p>
        <h1 className="mt-2 font-typed text-[1.625rem] leading-tight text-ink">
          What leaves your device — and what doesn&apos;t.
        </h1>
        <p className="mt-2 font-ui text-[0.75rem] text-ink-faint">
          Last updated {UPDATED}
        </p>

        {/* Plain-language summary in an inverse block */}
        <div className="mt-6 border border-ink bg-inverse-bg p-5 text-inverse-fg">
          <p className="font-typed text-[1rem] leading-relaxed">
            Byte Portfolio is built privacy-first. Your entries are stored only on
            your device. There is no account and no sign-in. Patient details are
            scrubbed on your device before anything is sent, and you confirm what
            is sent. We can&apos;t see your patients — by design.
          </p>
        </div>

        <Section title="What we store">
          <p>
            Everything lives locally in your browser (IndexedDB). Saved entries
            contain only redacted text, the curriculum mapping, and your drafted
            reflection. There is no account, no sign-in, and no server-side
            database — we never receive or store your entries. Clearing your
            browser data, or using “Clear all local data” in Settings, removes
            everything.
          </p>
        </Section>

        <Section title="Redaction comes first">
          <p>
            Before any note is sent for mapping, identifiers (names, ages, dates,
            NHS numbers, postcodes, phone numbers and more) are scrubbed on your
            device. You review the result at a confirm gate and can redact more or
            restore false positives. The mapping request cannot run until you
            confirm. Only the redacted text is ever sent.
          </p>
          <p className="text-ink-muted">
            Automated detection is not perfect — that is why the human confirm
            step is mandatory, and why you should never type or say more than the
            reflection needs.
          </p>
        </Section>

        <Section title="What is sent for mapping (OpenAI)">
          <p>
            To suggest a curriculum mapping and draft your entry, the redacted
            text is sent to OpenAI&apos;s API through our server, which holds the
            API key and does not log request contents. No identifiers are
            included. Your use of this feature is subject to OpenAI&apos;s API
            data-use terms; review them if you need assurances for clinical use.
          </p>
        </Section>

        <Section title="Voice dictation (ElevenLabs)">
          <p>
            Typing keeps everything on your device. If you use voice dictation,
            your microphone audio is streamed to ElevenLabs to be transcribed —
            so for voice, audio does leave your device, before redaction. We do
            not record or store that audio; the transcribed text still passes
            through the same redaction gate before anything is mapped.
          </p>
          <p className="text-ink-muted">
            For the most sensitive notes, prefer typing. If you adopt voice for
            clinical use, confirm ElevenLabs&apos; data-retention and processing
            terms first.
          </p>
        </Section>

        <Section title="No accounts">
          <p>
            There are no accounts and no sign-in. The app runs entirely on your
            device — there is nothing to log into and no profile on our servers.
          </p>
        </Section>

        <Section title="No tracking">
          <p>
            There are no analytics, advertising, or third-party trackers. We do
            not build a profile of you.
          </p>
        </Section>

        <Section title="Your control">
          <p>
            Your data stays on your device and under your control. You can edit or
            delete any entry, and wipe all local data at any time from Settings.
          </p>
        </Section>

        <Section title="Important: this is a drafting aid">
          <p>
            Byte Portfolio is a drafting aid, not an official ePortfolio and not
            medical or legal advice. You are responsible for ensuring every
            reflection is properly anonymised and for what you paste into Kaizen
            or any other system. Suggested mappings and drafts must be reviewed
            before use.
          </p>
        </Section>

        <Section title="Changes & contact">
          <p>
            We may update this statement as the product evolves; material changes
            will be reflected in the “last updated” date. Questions? Contact the
            owner, Dr Akanimoh Osutuk.
          </p>
        </Section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/">Start capturing</Button>
          <Button href="/" variant="ghost">
            Back home
          </Button>
        </div>
      </main>

      <footer className="border-t border-ink">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-8 font-ui text-[0.75rem] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-typed lowercase text-[0.9375rem] text-ink">
            byte portfolio
          </span>
          <span>A drafting aid, not an official ePortfolio.</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
