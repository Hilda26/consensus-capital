import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "review" | "watch" | "caution";

const styles: Record<Variant, string> = {
  primary: "bg-pearl-aqua text-deep-navy",
  secondary: "border border-dusk-blue text-dusk-blue bg-transparent",
  review: "bg-deep-navy text-ivory-signal border border-pearl-aqua",
  watch: "bg-thistle text-deep-navy",
  caution: "border border-coral-caution text-coral-caution bg-transparent",
};

export function SignalTabButton({
  variant = "primary",
  children,
  className = "",
  ...rest
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`signal-tab font-display tracking-wide px-5 py-3 text-sm ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
