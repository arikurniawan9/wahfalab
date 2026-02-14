"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Beaker, 
  ShieldCheck, 
  Clock, 
  FlaskConical, 
  Microscope, 
  ArrowRight,
  TestTubeDiagonal
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <img src="/logo-wahfalab.png" alt="WahfaLab Logo" className="h-10 w-auto" />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#services">
            Layanan
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#about">
            Tentang Kami
          </Link>
          <Link href="/login">
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Daftar
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50 relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
          
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 mb-2 animate-bounce">
                    ISO 17025 Accredited
                  </div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-slate-900">
                    Solusi Terpercaya untuk <br />
                    <span className="text-blue-600">Analisis Kimia & Lingkungan</span>
                  </h1>
                  <p className="max-w-[600px] text-slate-500 md:text-xl">
                    WahfaLab menyediakan layanan laboratorium profesional dengan akurasi tinggi dan hasil yang cepat. Mendukung kebutuhan industri Anda dengan standar internasional.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                  <Link href="/(admin)/quotations/create">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg">
                      Mulai Penawaran <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Lihat Katalog
                  </Button>
                </div>
              </div>

              {/* Lab Animation Component */}
              <div className="relative flex items-center justify-center">
                <div className="w-full aspect-square bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center overflow-hidden border border-blue-50">
                  <div className="relative w-64 h-64">
                    {/* Animated Beaker */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-48 border-4 border-slate-300 rounded-b-2xl rounded-t-lg overflow-hidden flex flex-col justify-end">
                      <div className="w-full bg-blue-400/30 animate-[wave_3s_ease-in-out_infinite]" style={{ height: '60%' }}>
                         <div className="w-full h-2 bg-blue-500/40 rounded-full" />
                      </div>
                    </div>
                    {/* Floating Icons */}
                    <FlaskConical className="absolute top-0 left-0 h-12 w-12 text-blue-500 animate-bounce delay-100" />
                    <Microscope className="absolute bottom-10 right-0 h-16 w-16 text-indigo-500 animate-pulse" />
                    <TestTubeDiagonal className="absolute top-1/4 right-1/4 h-10 w-10 text-cyan-500 animate-[spin_4s_linear_infinite]" />
                    <div className="absolute top-1/2 left-0 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-slate-900">Mengapa Memilih WahfaLab?</h2>
                <p className="max-w-[900px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Kami mengutamakan kualitas, kecepatan, dan integritas dalam setiap pengujian.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-200 transition-all">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Terakreditasi</h3>
                <p className="text-slate-500 text-center text-sm leading-relaxed">
                  Metode pengujian kami sesuai dengan standar regulasi nasional dan internasional (ISO/IEC 17025).
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-200 transition-all">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Clock className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Hasil Cepat</h3>
                <p className="text-slate-500 text-center text-sm leading-relaxed">
                  Kami memahami urgensi bisnis Anda. Proses analisis dilakukan secara efisien tanpa mengurangi akurasi.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-200 transition-all">
                <div className="p-3 bg-cyan-100 rounded-full">
                  <Beaker className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold">Layanan Lengkap</h3>
                <p className="text-slate-500 text-center text-sm leading-relaxed">
                  Mulai dari pengujian air, udara, tanah, hingga kalibrasi alat industri di satu tempat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-slate-50">
        <p className="text-xs text-slate-500">© 2026 WahfaLab. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Syarat & Ketentuan
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Kebijakan Privasi
          </Link>
        </nav>
      </footer>

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
