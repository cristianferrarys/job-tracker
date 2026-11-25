import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClassName, type ButtonVariant } from "./button-styles";

type ButtonLinkProps = { href: string; children: ReactNode; variant?: ButtonVariant };

/** Navigation link that looks like a button (e.g. "Add application", "Cancel"). */
export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName(variant)}>
      {children}
    </Link>
  );
}
