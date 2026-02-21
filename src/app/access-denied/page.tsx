"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AccessDeniedPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) setRole(profile.role);
      }
    };
    getProfile();
  }, [supabase]);

  const getDashboardPath = () => {
    switch (role) {
      case "admin": return "/admin";
      case "operator": return "/operator";
      case "field_officer": return "/field";
      case "client": return "/dashboard";
      default: return "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto border-2 border-red-100 shadow-xl shadow-red-100/50">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-red-50">
            <Lock className="h-4 w-4 text-red-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Akses Ditolak</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Maaf, Anda tidak memiliki otoritas untuk mengakses halaman ini. Halaman ini khusus untuk peran yang berbeda.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-4">
          <div className="flex flex-col gap-3">
            <Link href={getDashboardPath()}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl shadow-lg shadow-emerald-100 font-bold transition-all active:scale-95">
                <Home className="mr-2 h-4 w-4" /> Kembali ke Dashboard Saya
              </Button>
            </Link>
            
            <Link href="/login">
              <Button variant="ghost" className="w-full h-12 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Login dengan Akun Lain
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">
          WahfaLab Security System
        </p>
      </div>
    </div>
  );
}
