"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
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
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const prof = await getProfile();
        if (!prof || (prof.role !== "reporting" && prof.role !== "admin" && prof.role !== "operator")) {
          router.push("/login");
          return;
        }
        setProfile(prof);
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title="Staff Reporting" 
          subtitle="Kelola pelaporan hasil uji"
          profile={profile} 
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-24 md:pb-0">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
