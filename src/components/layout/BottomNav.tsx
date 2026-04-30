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
  Wallet,
  Menu,
  Building2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/actions/auth";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  adminMenuItems,
  analystMenuItems,
  fieldOfficerMenuItems,
  financeMenuItems,
  operatorMenuItems,
  reportingMenuItems,
} from "./Sidebar";

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
  { icon: LayoutDashboard, label: "Beranda", href: "/reporting", exact: true },
  { icon: FileText, label: "Antrean", href: "/reporting/jobs" },
  { icon: AlertCircle, label: "Direct", href: "/reporting/direct-requests" },
  { icon: BookOpen, label: "Baku", href: "/reporting/regulations" },
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

const adminNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Beranda", href: "/admin", exact: true },
  { icon: FileText, label: "Penawaran", href: "/admin/quotations" },
  { icon: Briefcase, label: "Order", href: "/admin/jobs" },
  { icon: Building2, label: "Keuangan", href: "/admin/finance" },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  if (isLoading) return null;

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
            : role === 'admin'
              ? adminNavItems
              : [];

  const menuGroups = role === 'admin'
    ? adminMenuItems()
    : role === 'operator'
      ? operatorMenuItems
      : role === 'field_officer'
        ? fieldOfficerMenuItems
        : role === 'analyst'
          ? analystMenuItems
          : role === 'reporting'
            ? reportingMenuItems
            : role === 'finance'
              ? financeMenuItems()
              : [];

  if (navItems.length === 0) return null;
  const primaryItems = navItems.slice(0, 4);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <nav className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-900/15 rounded-2xl flex items-center justify-around p-1.5">
        {primaryItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-w-0 rounded-xl py-2 px-1 transition-all duration-300 active:scale-95",
                isActive ? "bg-emerald-50" : "hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-400"
              )}>
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <span
                className={cn(
                  "mt-1 max-w-full truncate text-[9px] font-black uppercase tracking-tight leading-none transition-colors",
                  isActive ? "text-emerald-700" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-w-0 rounded-xl py-2 px-1 transition-all duration-300 active:scale-95",
                isMenuOpen ? "bg-emerald-50" : "hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                isMenuOpen ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-400"
              )}>
                <Menu className="h-4.5 w-4.5" />
              </span>
              <span className={cn(
                "mt-1 max-w-full truncate text-[9px] font-black uppercase tracking-tight leading-none transition-colors",
                isMenuOpen ? "text-emerald-700" : "text-slate-400"
              )}>
                Menu
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[82vh] rounded-t-3xl border-slate-200 bg-white p-0 shadow-2xl"
            showCloseButton={false}
          >
            <SheetHeader className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SheetTitle className="text-sm font-black uppercase tracking-tight text-slate-900">
                    Menu Navigasi
                  </SheetTitle>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {role?.replace("_", " ") || "Dashboard"}
                  </p>
                </div>
                <SheetClose asChild>
                  <button className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 active:scale-95">
                    Tutup
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>

            <div className="overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {role === "client" ? (
                <div className="grid grid-cols-1 gap-2">
                  {clientNavItems.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3 transition-all active:scale-[0.98]",
                            isActive ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white"
                          )}
                        >
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight text-slate-700">
                            {item.label}
                          </span>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-5">
                  {menuGroups.map((group: any) => (
                    <section key={group.id} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <group.icon className="h-3.5 w-3.5 text-emerald-600" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {group.group}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item: any) => {
                          const isActive = item.exact
                            ? pathname === item.href
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);

                          return (
                            <SheetClose asChild key={item.href}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all active:scale-[0.98]",
                                  isActive ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white hover:bg-slate-50"
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                    isActive ? "bg-emerald-600 text-white" : item.bgColor || "bg-slate-100"
                                  )}>
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : item.color || "text-slate-500")} />
                                  </div>
                                  <span className="truncate text-xs font-black uppercase tracking-tight text-slate-700">
                                    {item.label}
                                  </span>
                                </div>
                                {isActive && (
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                                )}
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
