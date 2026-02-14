"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  FlaskConical, 
  LogOut, 
  Menu,
  ChevronLeft,
  Settings,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/actions/auth";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/admin" },
  { icon: FileText, label: "Penawaran Harga", href: "/admin/quotations" },
  { icon: Tag, label: "Kategori Layanan", href: "/admin/categories" },
  { icon: FlaskConical, label: "Katalog Layanan", href: "/admin/services" },
  { icon: Users, label: "Data Pengguna", href: "/admin/users" },
];

const operatorMenuItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/operator" },
  { icon: FileText, label: "Pekerjaan Lab", href: "/operator/jobs" },
];

const clientMenuItems = [
  { icon: LayoutDashboard, label: "Beranda", href: "/dashboard" },
  { icon: FileText, label: "Riwayat Pesanan", href: "/dashboard/orders" },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRole() {
      const profile = await getProfile();
      setRole(profile?.role || null);
    }
    fetchRole();
  }, []);

  const menuItems = role === 'admin' 
    ? adminMenuItems 
    : role === 'operator' 
      ? operatorMenuItems 
      : clientMenuItems;

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-8 flex items-center gap-3", isCollapsed && "px-4 justify-center")}>
        <img src="/logo-wahfalab.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
        {!isCollapsed && <span className="text-xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>WahfaLab</span>}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
              pathname === item.href 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? item.label : ""}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-white" : "text-emerald-400 group-hover:text-emerald-200")} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-3 mt-auto border-t border-emerald-800 pt-4">
        <form action={logout}>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-800 group",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3">Keluar</span>}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-emerald-950 text-white transition-all duration-300 border-r border-emerald-900 sticky top-0 h-screen",
          isCollapsed ? "w-20" : "w-64",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-900 z-50 shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
        <NavContent />
      </aside>
    </>
  );
}
