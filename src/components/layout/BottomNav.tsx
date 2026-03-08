"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  FlaskConical,
  MapPin,
  Settings,
  Wrench,
  CreditCard,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/actions/auth";

const clientNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/dashboard" },
  { icon: FileText, label: "Pesanan", href: "/dashboard/orders" },
  { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
];

const fieldOfficerNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/field" },
  { icon: FileText, label: "Tugas", href: "/field/assignments" },
  { icon: History, label: "Riwayat", href: "/field/history" },
];

const analystNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/analyst" },
  { icon: FlaskConical, label: "Analisis", href: "/analyst/jobs" },
  { icon: History, label: "Riwayat", href: "/analyst/history" },
];

const reportingNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/reporting" },
  { icon: FileText, label: "LHU", href: "/reporting/jobs" },
];

const financeNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/finance" },
  { icon: CreditCard, label: "Invoice", href: "/finance/payments" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Don't show BottomNav for admin and operator
  if (isLoading || role === 'admin' || role === 'operator') return null;

  const navItems = role === 'field_officer'
    ? fieldOfficerNavItems
    : role === 'client'
      ? clientNavItems
      : role === 'analyst'
        ? analystNavItems
        : role === 'reporting'
          ? reportingNavItems
          : role === 'finance'
            ? financeNavItems
            : [];

  if (navItems.length === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="bg-emerald-950/90 backdrop-blur-lg border border-emerald-800 shadow-2xl rounded-2xl flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-1 flex-1 transition-all duration-300"
            >
              {isActive && (
                <div className="absolute -top-2 w-8 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              )}
              <item.icon
                className={cn(
                  "h-6 w-6 transition-all duration-300",
                  isActive ? "text-emerald-400 scale-110" : "text-emerald-500/50"
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-all duration-300",
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
