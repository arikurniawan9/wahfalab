"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronDown, 
  Home, 
  Award, 
  Briefcase, 
  Heart, 
  Scale, 
  ImageIcon, 
  Phone, 
  Newspaper,
  ShieldCheck,
  Clock,
  Beaker,
  FlaskConical,
  Microscope,
  TestTubeDiagonal,
  ListTree
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthNav } from "@/app/auth-nav";
import { MobileNav } from "./MobileNav";

const ICON_MAP: Record<string, any> = {
  Home, Award, Briefcase, Heart, Scale, ImageIcon, Phone, Newspaper,
  ShieldCheck, Clock, Beaker, FlaskConical, Microscope, TestTubeDiagonal, ListTree
};

interface LandingHeaderProps {
  companyProfile: any;
  navbarMenus: any[];
  user: any;
  role: string | null;
}

export function LandingHeader({ companyProfile, navbarMenus, user, role }: LandingHeaderProps) {
  const getDashboardHref = () => {
    if (role === "admin") return "/admin";
    if (role === "operator") return "/operator";
    if (role === "content_manager") return "/content-manager";
    return "/dashboard";
  };

  return (
    <header className="px-4 md:px-6 lg:px-12 h-20 flex items-center border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50">
      <Link className="flex items-center justify-center gap-2 md:gap-3 cursor-pointer group shrink-0" href="/">
        <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
          {companyProfile?.logo_url ? (
            <Image src={companyProfile.logo_url} alt="Logo" fill className="object-contain" priority />
          ) : (
            <Image src="/logo-wahfalab.png" alt="Logo" fill className="object-contain" priority />
          )}
        </div>
        <span className="font-black text-lg md:text-xl tracking-tighter text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase truncate max-w-[120px] md:max-w-none">
          {companyProfile?.company_name || "WahfaLab"}
        </span>
      </Link>

      <nav className="ml-auto flex gap-2 items-center">
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navbarMenus.map((menu, idx) => {
            const IconComp = ICON_MAP[menu.icon] || Home;
            
            if (menu.is_dropdown) {
              return (
                <DropdownMenu key={idx}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2 outline-none cursor-pointer">
                      <IconComp className="h-3.5 w-3.5" /> {menu.label} <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-emerald-100 shadow-2xl">
                    {(menu.sub_menus || []).map((sub: any, sIdx: number) => {
                      const SubIcon = ICON_MAP[sub.icon] || IconComp;
                      return (
                        <DropdownMenuItem key={sIdx} asChild>
                          <Link href={sub.href} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors">
                            <SubIcon className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{sub.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link 
                key={idx} 
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2" 
                href={menu.href}
              >
                <IconComp className="h-3.5 w-3.5" /> {menu.label}
              </Link>
            );
          })}

          <div className="ml-2 pl-2 border-l border-slate-100">
            <AuthNav initialUser={user} initialRole={role} />
          </div>
        </div>

        <MobileNav user={user} role={role} dashboardHref={getDashboardHref()} />
      </nav>
    </header>
  );
}
