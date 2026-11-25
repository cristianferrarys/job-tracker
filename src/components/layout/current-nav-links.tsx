"use client";

import { usePathname } from "next/navigation";
import { NavLinks, type NavItem } from "./nav-links";

/** Header links that highlight the current page. Suspends on dynamic routes until the URL is known. */
export function CurrentNavLinks({ items }: { items: readonly NavItem[] }) {
  return <NavLinks items={items} currentPath={usePathname()} />;
}
