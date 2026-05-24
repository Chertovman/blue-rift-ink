import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type BaseProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

type LinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type RetroButtonProps = LinkProps | ButtonProps;

function isLinkProps(props: RetroButtonProps): props is LinkProps {
  return "href" in props && typeof props.href === "string";
}

const variantClass = {
  primary:
    "border-cyan-200 bg-cyan-200 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.32)] hover:bg-white active:scale-[0.98]",
  secondary:
    "border-slate-500/60 bg-slate-950/30 text-slate-100 hover:border-fuchsia-200 hover:bg-fuchsia-200 hover:text-slate-950 active:scale-[0.98]",
};

function getClasses(variant: "primary" | "secondary", className: string) {
  return [
    "inline-flex min-h-11 items-center justify-center rounded-md border px-5 font-mono text-sm font-black uppercase transition duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200",
    variantClass[variant],
    className,
  ].join(" ");
}

export function RetroButton(props: RetroButtonProps) {
  const { variant = "primary", className = "" } = props;
  const classes = getClasses(variant, className);

  if (isLinkProps(props)) {
    const { children: linkChildren, variant: _variant, className: _className, ...linkProps } = props;

    return (
      <Link {...linkProps} className={classes}>
        {linkChildren}
      </Link>
    );
  }

  const { children: buttonChildren, variant: _variant, className: _className, ...buttonProps } = props;

  return (
    <button {...buttonProps} className={classes}>
      {buttonChildren}
    </button>
  );
}
