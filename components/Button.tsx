import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // inverse block; hover inverts back to paper with ink border (§5.4)
  primary: "bg-inverse-bg text-inverse-fg border border-ink hover:bg-paper hover:text-ink",
  // paper bg, ink border; hover inverts to ink block
  ghost: "bg-paper text-ink border border-ink hover:bg-ink hover:text-paper",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-ui uppercase tracking-[0.12em] " +
  "text-[0.8125rem] leading-none px-5 py-3 border transition-colors duration-150 " +
  "select-none cursor-pointer disabled:pointer-events-none disabled:bg-transparent " +
  "disabled:text-ink-faint disabled:border-rule-faint disabled:shadow-none";

function label(children: ReactNode, bracket: boolean) {
  return bracket ? <>{"[ "}{children}{" ]"}</> : children;
}

type CommonProps = {
  variant?: Variant;
  bracket?: boolean;
  offset?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type LinkButtonProps = CommonProps & {
  href: string;
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const {
    variant = "primary",
    bracket = true,
    offset = false,
    className = "",
    children,
  } = props;

  const cls = `${BASE} ${VARIANTS[variant]} ${offset ? "cta-offset" : ""} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {label(children, bracket)}
      </Link>
    );
  }

  const { variant: _v, bracket: _b, offset: _o, className: _c, children: _ch, ...rest } =
    props as ButtonProps;
  return (
    <button className={cls} {...rest}>
      {label(children, bracket)}
    </button>
  );
}
