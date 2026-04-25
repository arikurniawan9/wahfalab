"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FlaskConical,
  MapPin,
  Settings,
  CreditCard,
  History,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/actions/auth";

type BottomNavItem = {
  icon: any;
  label: string;
  href: string;
  exact?: boolean;
};

const clientNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/dashboard" },
  { icon: FileText, label: "Pesanan", href: "/dashboard/orders" },
  { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
];

const fieldOfficerNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/field", exact: true },
  { icon: MapPin, label: "Sampling", href: "/field/assignments" },
  { icon: FileText, label: "Surat Tugas", href: "/field/travel-orders" },
  { icon: History, label: "Riwayat", href: "/field/history" },
];

const analystNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/analyst" },
  { icon: FlaskConical, label: "Analisis", href: "/analyst/jobs" },
  { icon: History, label: "Riwayat", href: "/analyst/history" },
];

const reportingNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/reporting" },
  { icon: FileText, label: "LHU", href: "/reporting/jobs" },
];

const operatorNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/operator", exact: true },
  { icon: FileText, label: "Penawaran", href: "/operator/quotations" },
  { icon: Briefcase, label: "Order", href: "/operator/jobs" },
  { icon: CreditCard, label: "Bayar", href: "/operator/payments" },
];

const financeNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/finance", exact: true },
  { icon: FileText, label: "Invoice", href: "/finance/invoices" },
  { icon: CreditCard, label: "Verifikasi", href: "/finance/payments" },
  { icon: History, label: "Transaksi", href: "/finance/transactions" },
  { icon: Wallet, label: "Kas", href: "/finance/settings/cash" },
];

function inferRoleFromPath(pathname: string): string | null {
  if (pathname.startsWith("/dashboard")) return "client";
  if (pathname.startsWith("/field")) return "field_officer";
  if (pathname.startsWith("/analyst")) return "analyst";
  if (pathname.startsWith("/reporting")) return "reporting";
  if (pathname.startsWith("/operator")) return "operator";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(() => inferRoleFromPath(pathname));
  const [isLoading, setIsLoading] = useState(() => !inferRoleFromPath(pathname));

  useEffect(() => {
    async function fetchRole() {
      try {
        const profile = await getProfile();
        setRole(profile?.role || null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRole();
  }, []);

  // Don't show BottomNav for admin
  if (isLoading || role === 'admin') return null;

  const navItems = role === 'field_officer'
    ? fieldOfficerNavItems
    : role === 'client'
      ? clientNavItems
      : role === 'operator'
        ? operatorNavItems
      : role === 'analyst'
        ? analystNavItems
        : role === 'reporting'
          ? reportingNavItems
          : role === 'finance'
            ? financeNavItems
            : [];

  if (navItems.length === 0) return null;
  const isDenseLayout = navItems.length >= 4;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="bg-emerald-950/90 backdrop-blur-lg border border-emerald-800 shadow-2xl rounded-2xl flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 transition-all duration-300",
                isDenseLayout ? "py-1.5 px-0.5" : "py-2 px-1"
              )}
            >
              {isActive && (
                <div className={cn(
                  "absolute bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]",
                  isDenseLayout ? "-top-1.5 w-6 h-0.5" : "-top-2 w-8 h-1"
                )} />
              )}
              <item.icon
                className={cn(
                  "transition-all duration-300",
                  isDenseLayout ? "h-5 w-5" : "h-6 w-6",
                  isActive ? "text-emerald-400 scale-110" : "text-emerald-500/50"
                )}
              />
              <span
                className={cn(
                  "mt-1 font-medium transition-all duration-300 leading-none",
                  isDenseLayout ? "text-[8px]" : "text-[10px]",
                  isActive ? "text-white opacity-100" : "text-emerald-100/40 opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
