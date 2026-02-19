"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, FlaskConical, Shield, Zap, Leaf, Eye, EyeOff } from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-16">
          <div className="flex items-center gap-3">
            <img src="/logo-wahfalab.png" alt="WahfaLab Logo" className="h-12 w-auto" />
            <span className="text-2xl font-bold text-white font-[family-name:var(--font-montserrat)]">
              WahfaLab
            </span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Selamat Datang Kembali
              </h1>
              <p className="text-emerald-100 text-lg leading-relaxed">
                Kelola pesanan dan hasil analisis laboratorium Anda dengan mudah dan efisien.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Data Terjamin Aman</h3>
                  <p className="text-emerald-100 text-sm">Sistem keamanan tingkat tinggi untuk melindungi data Anda</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Proses Cepat</h3>
                  <p className="text-emerald-100 text-sm">Akses hasil analisis secara real-time dan efisien</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ramah Lingkungan</h3>
                  <p className="text-emerald-100 text-sm">Digitalisasi proses untuk mengurangi penggunaan kertas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-emerald-200 text-sm">
            © 2025 WahfaLab. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/20 p-8 animate-slide-in-left">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/logo-wahfalab.png" alt="Logo" className="h-12 w-auto" />
            <span className="text-xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)]">
              WahfaLab
            </span>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-2">
              <div className="hidden lg:flex items-center justify-center mb-2">
                <img src="/logo-wahfalab.png" alt="WahfaLab Logo" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-emerald-900">
                Login
              </CardTitle>
              <CardDescription className="text-slate-500 text-base">
                Masukkan email dan password untuk masuk ke akun Anda
              </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
              <CardContent className="space-y-5 pt-6">
                {error && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="nama@perusahaan.com" 
                      className="pl-10 h-12 focus-visible:ring-emerald-500 focus-visible:border-emerald-500" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10 h-12 focus-visible:ring-emerald-500 focus-visible:border-emerald-500" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold shadow-lg shadow-emerald-200" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <ChemicalLoader size="sm" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Masuk <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
                <div className="text-center text-sm text-slate-500">
                  Belum punya akun?{" "}
                  <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                    Daftar Sekarang
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
