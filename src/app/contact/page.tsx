import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  getCachedLandingPageConfig, 
  getCachedCompanyProfile, 
  getCachedProfile 
} from "@/lib/cache";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Award,
  Heart,
  ImageIcon,
  Newspaper,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Briefcase,
  Scale
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthNav } from "../auth-nav";
import { MobileNav } from "@/components/layout/MobileNav";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactForm } from "@/components/layout/ContactForm";

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role: string | null = null;
  if (user) {
    const profileApi = await getCachedProfile();
    const profile = await profileApi.getProfileByUserId(user.id);
    role = profile?.role || null;
  }

  const companyProfile = await getCachedCompanyProfile();

  const getDashboardHref = () => {
    if (role === "admin") return "/admin";
    if (role === "operator") return "/operator";
    if (role === "content_manager") return "/content-manager";
    return "/dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Standard Navigation */}
      <header className="px-4 md:px-6 lg:px-12 h-20 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
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
            <Link className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2" href="/">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <Link className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2" href="/#features">
              <Award className="h-3.5 w-3.5" /> Keunggulan
            </Link>
            <Link className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all hidden lg:flex items-center gap-2" href="/#commitment">
              <Heart className="h-3.5 w-3.5" /> Komitmen
            </Link>
            <Link className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2" href="/#portfolio">
              <Briefcase className="h-3.5 w-3.5" /> Mitra
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2 outline-none cursor-pointer">
                  Lainnya <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-emerald-100 shadow-2xl">
                {[
                  { href: "/legality", icon: Scale, label: "Legalitas" },
                  { href: "/gallery", icon: ImageIcon, label: "Galeri" },
                  { href: "/contact", icon: Phone, label: "Kontak" },
                  { href: "/news", icon: Newspaper, label: "News" }
                ].map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors">
                      <item.icon className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-2 pl-2 border-l border-slate-100">
              <AuthNav initialUser={user} initialRole={role} />
            </div>
          </div>

          <MobileNav user={user} role={role} dashboardHref={getDashboardHref()} />
        </nav>
      </header>

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-emerald-950 text-white py-20 md:py-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-400 rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-block rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">
                Hubungi Kami
              </div>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tight leading-none mb-8">
                Mari Bicara <br />
                <span className="text-emerald-400">Solusi Lingkungan</span>
              </h1>
              <p className="text-emerald-100/80 text-lg font-medium leading-relaxed px-6">
                Kami siap membantu kebutuhan pengujian laboratorium dan konsultasi lingkungan Anda.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="space-y-6 text-center md:text-left">
                <h2 className="text-3xl font-black text-emerald-900 uppercase tracking-tight">Informasi Kontak</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Kunjungi kantor kami atau hubungi kami melalui kanal komunikasi berikut untuk respon yang lebih cepat.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 group">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Alamat Kantor</h4>
                    <p className="text-slate-600 font-bold leading-relaxed max-w-sm">
                      {companyProfile?.address || "Jl. Raya Cianjur No. 123, Jawa Barat"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 group">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Telepon & WhatsApp</h4>
                    <p className="text-slate-600 font-bold leading-relaxed">
                      {companyProfile?.phone || "-"} / {companyProfile?.whatsapp || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 group">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Email Resmi</h4>
                    <p className="text-slate-600 font-bold leading-relaxed">
                      {companyProfile?.email || "info@wahfalab.com"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 text-center md:text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Media Sosial Kami</h4>
                <div className="flex justify-center md:justify-start gap-4">
                  {[Instagram, Facebook, Twitter, Globe].map((Icon, i) => (
                    <button key={i} className="p-4 rounded-full bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all">
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form Component (Client) */}
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="py-12 border-t bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 {companyProfile?.company_name || "WahfaLab"} Indonesia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
