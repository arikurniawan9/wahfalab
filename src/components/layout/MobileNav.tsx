"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  Home, 
  Award, 
  Briefcase, 
  Heart, 
  Scale, 
  ImageIcon, 
  Phone, 
  Newspaper,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Clock,
  Beaker,
  FlaskConical,
  Microscope,
  TestTubeDiagonal,
  ListTree
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  user: any;
  role: string | null;
  dashboardHref: string;
  navbarMenus: any[];
}

const ICON_MAP: Record<string, any> = {
  Home, Award, Briefcase, Heart, Scale, ImageIcon, Phone, Newspaper,
  ShieldCheck, Clock, Beaker, FlaskConical, Microscope, TestTubeDiagonal, ListTree
};

export function MobileNav({ user, role, dashboardHref, navbarMenus }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Mobile Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
      >
        <span className="text-[10px] font-black uppercase tracking-widest pl-1">Menu</span>
        <Menu className="h-5 w-5" />
      </button>

      {/* Full Screen Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in slide-in-from-right-5 duration-300">
          {/* Header Mobile Menu - Fixed at top */}
          <div className="flex items-center justify-between px-6 h-20 border-b bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <img src="/logo-wahfalab.png" alt="Logo" className="h-6 w-auto" />
              </div>
              <span className="font-black text-emerald-900 uppercase tracking-tighter">WahfaLab</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 active:scale-90 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-8 space-y-10 pb-20">
              {/* Dynamic Menus */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
                  Navigasi
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {navbarMenus.map((menu, idx) => {
                    const IconComp = ICON_MAP[menu.icon] || Home;
                    
                    if (menu.is_dropdown) {
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                            <div className="p-2.5 rounded-xl bg-white shadow-sm text-emerald-600">
                              <IconComp className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-black uppercase text-emerald-900">{menu.label}</span>
                          </div>
                          <div className="pl-6 space-y-2 border-l-2 border-emerald-100 ml-8">
                            {(menu.sub_menus || []).map((sub: any, sIdx: number) => {
                              const SubIcon = ICON_MAP[sub.icon] || IconComp;
                              return (
                                <Link 
                                  key={sIdx} 
                                  href={sub.href}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 active:bg-emerald-50 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <SubIcon className="h-4 w-4 text-emerald-600/70" />
                                    <span className="text-xs font-bold text-slate-600">{sub.label}</span>
                                  </div>
                                  <ChevronRight className="h-3 w-3 text-slate-300" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link 
                        key={idx} 
                        href={menu.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent active:bg-emerald-50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-white shadow-sm text-emerald-600">
                            <IconComp className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-bold text-emerald-950">{menu.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
                  Akses Member
                </h4>
                {user ? (
                  <Link href={dashboardHref} onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3">
                      <LayoutDashboard className="h-5 w-5" /> Buka Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full h-16 bg-emerald-950 hover:bg-black rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3">
                      <LogIn className="h-5 w-5" /> Login Member <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Version Info */}
              <div className="text-center pt-4">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                  © 2026 WahfaLab Indonesia — v1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
