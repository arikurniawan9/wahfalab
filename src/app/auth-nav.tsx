"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface AuthNavProps {
  initialUser: any;
  initialRole: string | null;
}

export function AuthNav({ initialUser, initialRole }: AuthNavProps) {
  const getDashboardHref = () => {
    if (initialRole === "admin") return "/admin";
    if (initialRole === "operator") return "/operator";
    return "/dashboard";
  };

  if (initialUser) {
    return (
      <Link href={getDashboardHref()}>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100">
          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50">
          Login
        </Button>
      </Link>
      <Link href="/register" className="hidden sm:block">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Daftar
        </Button>
      </Link>
    </>
  );
}
