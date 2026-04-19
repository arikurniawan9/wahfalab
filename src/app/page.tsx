import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Beaker,
  ShieldCheck,
  Clock,
  FlaskConical,
  Microscope,
  ArrowRight,
  TestTubeDiagonal,
  Award,
  Briefcase,
  Scale,
  ImageIcon,
  Phone,
  Newspaper,
  ChevronDown,
  Home,
  Heart
} from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getCachedLandingPageConfig,
  getCachedCompanyProfile
} from "@/lib/cache";
import { AuthNav } from "./auth-nav";
import { HeroSlider } from "@/components/layout/HeroSlider";
import { PortfolioGrid } from "@/components/layout/PortfolioGrid";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/MobileNav";
import { LandingHeader } from "@/components/layout/LandingHeader";

const ICON_MAP: Record<string, any> = {
  Beaker,
  ShieldCheck,
  Clock,
  FlaskConical,
  Microscope,
  TestTubeDiagonal,
  Award,
  Briefcase,
  Scale,
  ImageIcon,
  Phone,
  Newspaper,
  Home
};

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user || null;

  let role: string | null = null;
  if (user?.email) {
    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
      select: { role: true }
    });
    role = profile?.role || null;
  }

  const companyProfile = await getCachedCompanyProfile();
  const landingConfig = await getCachedLandingPageConfig();

  const getDashboardHref = () => {
    if (role === "admin") return "/admin";
    if (role === "operator") return "/operator";
    if (role === "content_manager") return "/content-manager";
    if (role === "analyst") return "/analyst";
    if (role === "field_officer") return "/field";
    if (role === "finance") return "/finance";
    if (role === "reporting") return "/reporting";
    return "/dashboard";
  };

  // Safe parsing for features
  const features = Array.isArray(landingConfig?.features) 
    ? landingConfig.features 
    : JSON.parse((landingConfig?.features as string) || "[]");

  // Safe parsing for banners
  const banners = Array.isArray(landingConfig?.banners)
    ? landingConfig.banners
    : JSON.parse((landingConfig?.banners as string) || "[]");

  // Safe parsing for portfolio
  const portfolio = Array.isArray(landingConfig?.portfolio)
    ? landingConfig.portfolio
    : JSON.parse((landingConfig?.portfolio as string) || "[]");

  // Safe parsing for navbar menus
  const navbarMenus = Array.isArray(landingConfig?.navbar_menus)
    ? landingConfig.navbar_menus
    : JSON.parse((landingConfig?.navbar_menus as string) || "[]");

  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Dynamic Navigation */}
      <LandingHeader 
        companyProfile={companyProfile} 
        navbarMenus={navbarMenus} 
        user={user} 
        role={role} 
      />

      <main className="flex-1">
        {/* Hero Section */}
        {banners.length > 0 ? (
          <HeroSlider 
            banners={banners} 
            ctaLink={user ? getDashboardHref() : (landingConfig?.hero_cta_link || "/login")}
            ctaText={user ? "Buka Dashboard" : (landingConfig?.hero_cta_text || "Mulai Penawaran")}
          />
        ) : (
          <section className="w-full py-20 md:py-32 bg-emerald-50/20 relative overflow-hidden">
            <div className="container px-6 md:px-12 mx-auto relative z-10">
              <div className="grid gap-12 lg:grid-cols-2 items-center">
                <div className="space-y-8 text-center lg:text-left">
                  <div className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest shadow-sm">
                    ISO 17025 Accredited
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-emerald-950 uppercase tracking-tight leading-[1.1]">
                    {landingConfig?.hero_title || "Solusi Terpercaya untuk Analisis Lingkungan"}
                  </h1>
                  <p className="max-w-xl text-slate-500 text-base md:text-lg font-medium leading-relaxed mx-auto lg:mx-0">
                    {landingConfig?.hero_description || "Menyediakan layanan laboratorium profesional dengan akurasi tinggi dan hasil yang cepat."}
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                    <Link href={user ? getDashboardHref() : (landingConfig?.hero_cta_link || "/login")}>
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10">
                        {user ? "Dashboard" : "Mulai Sekarang"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/catalog">
                      <Button variant="outline" size="lg" className="h-14 px-8 text-xs font-black uppercase tracking-widest rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        Lihat Katalog
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="hidden lg:flex relative aspect-square bg-white rounded-[3rem] shadow-2xl border border-emerald-50 items-center justify-center p-12 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <div className="relative w-48 h-64 border-4 border-slate-200 rounded-b-3xl rounded-t-xl overflow-hidden flex flex-col justify-end">
                      <div className="w-full bg-emerald-400/20 animate-[wave_4s_ease-in-out_infinite]" style={{ height: "65%" }}>
                        <div className="w-full h-2 bg-emerald-500/30 rounded-full" />
                      </div>
                    </div>
                    <FlaskConical className="absolute top-0 left-0 h-16 w-16 text-emerald-500 animate-bounce" />
                    <Microscope className="absolute bottom-4 right-0 h-20 w-20 text-emerald-600 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="w-full py-24 md:py-40 bg-white">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">Layanan Unggulan</span>
              <h2 className="text-3xl md:text-4xl font-black text-emerald-950 uppercase tracking-tight leading-none">
                Mengapa Memilih WahfaLab?
              </h2>
              <p className="text-slate-500 text-sm md:text-base font-medium">
                Kami berkomitmen memberikan layanan terbaik dengan standar internasional.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature: any, index: number) => {
                const IconComponent = ICON_MAP[feature.icon] || ShieldCheck;
                return (
                  <div key={index} className="group relative p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5">
                    <div className="mb-8 p-4 rounded-2xl bg-white shadow-sm text-emerald-600 w-fit group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight mb-4 group-hover:text-emerald-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="w-full py-24 md:py-40 bg-slate-50/50">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="space-y-4 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Portofolio Kami</span>
                <h2 className="text-3xl md:text-4xl font-black text-emerald-950 uppercase tracking-tight leading-none">
                  {landingConfig?.portfolio_title || "Mitra Industri & Klien Kami"}
                </h2>
                <p className="text-slate-500 text-sm md:text-base font-medium">
                  {landingConfig?.portfolio_description || "Telah dipercaya oleh berbagai instansi pemerintah dan perusahaan swasta nasional."}
                </p>
              </div>
              <Link href="/catalog" className="shrink-0">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-emerald-200 text-emerald-700 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
                  Lihat Katalog Layanan
                </Button>
              </Link>
            </div>
            
            <PortfolioGrid 
              portfolio={portfolio} 
              title={landingConfig?.portfolio_title || undefined}
              description={landingConfig?.portfolio_description || undefined}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 md:py-32">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="relative rounded-[4rem] bg-emerald-900 p-12 md:p-24 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <div className="absolute -top-24 -right-24 w-96 h-94 bg-emerald-500 rounded-full blur-[120px] opacity-20" />
              <div className="absolute -bottom-24 -left-24 w-96 h-94 bg-emerald-400 rounded-full blur-[120px] opacity-20" />
              
              <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                  Siap Melakukan Pengujian & & Analisis Bersama Kami?
                </h2>
                <p className="text-emerald-100/70 text-lg font-medium leading-relaxed italic">
                  "Solusi pengujian laboratorium yang akurat, cepat, dan terpercaya untuk kebutuhan industri Anda."
                </p>
                <div className="flex flex-wrap justify-center gap-6 pt-4">
                  <Link href="/contact">
                    <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 h-16 px-12 rounded-3xl font-black uppercase tracking-widest shadow-xl">
                      Konsultasi Gratis
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" size="lg" className="h-16 px-12 rounded-3xl border-emerald-500/30 text-white font-black uppercase tracking-widest hover:bg-emerald-800">
                      Daftar Akun
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Standard Footer */}
      <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
        <div className="container px-6 md:px-12 mx-auto">
          <div className="grid gap-12 lg:grid-cols-4">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image src="/logo-wahfalab.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-emerald-950 uppercase">
                  WahfaLab
                </span>
              </div>
              <p className="max-w-md text-slate-500 text-sm font-medium leading-relaxed">
                Laboratorium pengujian lingkungan dan industri terkemuka di Indonesia. Berkomitmen pada akurasi data dan kepuasan pelanggan melalui teknologi terkini.
              </p>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors">
                  <span className="font-black text-xs uppercase">In</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors">
                  <span className="font-black text-xs uppercase">Ig</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors">
                  <span className="font-black text-xs uppercase">Fb</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Halaman</h4>
              <ul className="space-y-4">
                {['Home', 'Keunggulan', 'Portofolio', 'Berita'].map((item) => (
                  <li key={item}>
                    <Link href={item === 'Home' ? '/' : `/#${item.toLowerCase()}`} className="text-slate-500 text-sm font-bold hover:text-emerald-600 transition-colors uppercase tracking-widest">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Kontak</h4>
              <div className="space-y-4 text-slate-500 text-sm font-medium">
                <p className="flex items-start gap-3">
                  <span className="font-black text-emerald-600 uppercase text-[10px]">A:</span>
                  Jl. Lab Industri No. 123, Jakarta, Indonesia
                </p>
                <p className="flex items-center gap-3">
                  <span className="font-black text-emerald-600 uppercase text-[10px]">T:</span>
                  +62 21 1234 5678
                </p>
                <p className="flex items-center gap-3">
                  <span className="font-black text-emerald-600 uppercase text-[10px]">E:</span>
                  info@wahfalab.co.id
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8">
              <Link href="/privacy" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Syarat & Ketentuan</Link>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              © 2026 WahfaLab Indonesia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
