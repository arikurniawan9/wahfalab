"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { getProfile } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import { ChemicalLoader } from "@/components/ui";

export default function ReportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await getProfile();
        if (!profile || (profile.role !== "reporting" && profile.role !== "admin" && profile.role !== "operator")) {
          router.push("/login");
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <ChemicalLoader />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
