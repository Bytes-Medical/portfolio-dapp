import type { ReactNode } from "react";

/** Standard screen heading: small uppercase eyebrow + Courier Prime title. */
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-typed text-[1.625rem] leading-tight text-ink">
        {title}
      </h1>
      {children ? (
        <p className="mt-2 max-w-xl font-ui text-[0.875rem] text-ink-muted">
          {children}
        </p>
      ) : null}
    </div>
  );
}
