import { NavLink } from "./nav-link";

export type NavItem = { href: string; label: string };

/** The header links; `currentPath` is `null` while the current URL is not known yet. */
export function NavLinks({ items, currentPath }: { items: readonly NavItem[]; currentPath: string | null }) {
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink href={item.href} isCurrent={item.href === currentPath}>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
