"use client";

import {
  BarChart3,
  CalendarRange,
  CreditCard,
  House,
  Landmark,
  Menu,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Target,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { QuickAdd } from "@/components/forms/quick-add";
import type { AppUser, HouseholdSummary } from "@/lib/queries/households";

const items = [
  { href: "/", label: "Início", mobileLabel: "Início", icon: House },
  {
    href: "/lancamentos",
    label: "Lançamentos",
    mobileLabel: "Lanç.",
    icon: ReceiptText,
  },
  {
    href: "/orcamento",
    label: "Orçamento",
    mobileLabel: "Orç.",
    icon: BarChart3,
  },
  {
    href: "/mercado",
    label: "Mercado",
    mobileLabel: "Mercado",
    icon: ShoppingBasket,
  },
  {
    href: "/cartoes",
    label: "Cartões",
    mobileLabel: "Cartões",
    icon: CreditCard,
  },
  {
    href: "/planejamento",
    label: "Planejamento",
    mobileLabel: "Planej.",
    icon: CalendarRange,
  },
  {
    href: "/contas",
    label: "Contas",
    mobileLabel: "Contas",
    icon: Landmark,
  },
  { href: "/metas", label: "Metas", mobileLabel: "Metas", icon: Target },
  {
    href: "/configuracoes",
    label: "Configurações",
    mobileLabel: "Ajustes",
    icon: Settings,
  },
] as const;

export function AppShell({
  children,
  user,
  household,
}: {
  children: ReactNode;
  user: AppUser;
  household: HouseholdSummary;
}) {
  const path = usePathname();
  const memberNames = household.members.map((member) => member.name);
  const familyLabel =
    memberNames.length <= 2
      ? memberNames.join(" & ")
      : `${memberNames[0]} + ${memberNames.length - 1}`;
  const isActive = (href: string) =>
    href === "/" ? path === href : path.startsWith(href);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Brunnel Finanças">
          <span className="brand-mark">
            <WalletCards size={20} />
          </span>
          <span>
            Brunnel<span>Finanças</span>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "nav-link active" : "nav-link"}
            >
              <Icon size={18} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user.initials}</span>
          <div>
            <strong>{familyLabel || household.name}</strong>
            <span>{household.name}</span>
          </div>
          <Menu size={18} aria-hidden />
        </div>
      </aside>
      <main className="main">
        <header className="mobile-header">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <WalletCards size={18} />
            </span>
            <span>Brunnel</span>
          </Link>
          <Link href="/configuracoes" className="avatar">
            {user.initials}
          </Link>
        </header>
        {children}
      </main>
      <div className="desktop-quick">
        <QuickAdd />
      </div>
      <nav className="bottom-nav" aria-label="Navegação principal móvel">
        {items.slice(0, 2).map(({ href, label, mobileLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={isActive(href) ? "active" : ""}
          >
            <Icon size={21} aria-hidden />
            <span>{mobileLabel}</span>
          </Link>
        ))}
        <QuickAdd mobile nav />
        {items.slice(2, 4).map(({ href, label, mobileLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={isActive(href) ? "active" : ""}
          >
            <Icon size={21} aria-hidden />
            <span>{mobileLabel}</span>
          </Link>
        ))}
        <Link
          href="/configuracoes"
          className={isActive("/configuracoes") ? "active" : ""}
        >
          <Menu size={21} />
          <span>Mais</span>
        </Link>
      </nav>
    </div>
  );
}
