"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogIn, UserPlus } from "lucide-react";

interface AuthNavProps {
  initialUser: any;
  initialRole: string | null;
}

export function AuthNav({ initialUser, initialRole }: AuthNavProps) {
  const getDashboardHref = () => {
    if (initialRole === "admin") return "/admin";
    if (initialRole === "operator") return "/operator";
    if (initialRole === "content_manager") return "/content-manager";
    return "/dashboard";
  };

  if (initialUser) {
    return (
      <Link href={getDashboardHref()}>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-5 transition-all hover:scale-105 active:scale-95 border-none">
          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" className="text-emerald-700 hover:bg-emerald-50 rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-5 transition-all">
          <LogIn className="mr-2 h-4 w-4" />
          Masuk
        </Button>
      </Link>
      <Link href="/register" className="hidden sm:block">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-5 transition-all hover:scale-105 active:scale-95 border-none">
          <UserPlus className="mr-2 h-4 w-4" />
          Daftar
        </Button>
      </Link>
    </div>
  );
}
