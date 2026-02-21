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
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/actions/auth";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/admin" },
  { icon: FileText, label: "Penawaran", href: "/admin/quotations" },
  { icon: MapPin, label: "Sampling", href: "/admin/sampling" },
  { icon: Wrench, label: "Sewa Alat", href: "/admin/equipment" },
  { icon: Settings, label: "Pengaturan", href: "/admin/settings/company" },
];

const operatorNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/operator" },
  { icon: FileText, label: "Penawaran", href: "/operator/quotations" },
  { icon: FileText, label: "Progress", href: "/operator/jobs" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/dashboard" },
  { icon: FileText, label: "Pesanan", href: "/dashboard/orders" },
];

const fieldOfficerNavItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/field" },
  { icon: FileText, label: "Assignment", href: "/field/assignments" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const profile = await getProfile();
      setRole(profile?.role || null);
    }
    fetchRole();
  }, []);

  const navItems = role === 'admin'
    ? adminNavItems
    : role === 'operator'
      ? operatorNavItems
      : role === 'field_officer'
        ? fieldOfficerNavItems
        : role === 'client'
          ? clientNavItems
          : []; // Don't show any menu if role is null/unknown

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
