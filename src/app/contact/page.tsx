import React from "react";
import { 
  getCachedLandingPageConfig, 
  getCachedCompanyProfile, 
  getCachedProfile 
} from "@/lib/cache";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram,
  Facebook,
  Twitter,
  Globe
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/layout/ContactForm";
import { LandingHeader } from "@/components/layout/LandingHeader";

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
  const landingConfig = await getCachedLandingPageConfig();

  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      <LandingHeader 
        companyProfile={companyProfile} 
        navbarMenus={landingConfig?.navbar_menus as any[] || []} 
        user={user} 
        role={role} 
      />

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
