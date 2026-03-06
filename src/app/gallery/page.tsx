import React from "react";
import { 
  getCachedLandingPageConfig, 
  getCachedCompanyProfile, 
  getCachedProfile 
} from "@/lib/cache";
import { 
  Camera
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default async function GalleryPage() {
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

  const gallery = Array.isArray(landingConfig?.gallery)
    ? landingConfig.gallery
    : JSON.parse((landingConfig?.gallery as string) || "[]");

  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      <LandingHeader 
        companyProfile={companyProfile} 
        navbarMenus={landingConfig?.navbar_menus as any[] || []} 
        user={user} 
        role={role} 
      />

      <main className="container mx-auto px-6 md:px-12 py-16 md:py-24 flex-1">
        {/* Intro */}
        <div className="max-w-3xl mb-20 space-y-6 text-center md:text-left">
          <div className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
            Visual WahfaLab
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-emerald-950 uppercase tracking-tight leading-none">
            Fasilitas & <br />
            <span className="text-emerald-500 font-black">Kegiatan Kami</span>
          </h2>
          <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
            Dokumentasi lengkap aktivitas laboratorium dan operasional lapangan tim profesional WahfaLab.
          </p>
          <div className="h-1.5 w-24 bg-emerald-500 rounded-full mx-auto md:mx-0" />
        </div>

        {/* Gallery Grid */}
        {gallery.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-10 space-y-10">
            {gallery.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="relative break-inside-avoid rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl shadow-slate-200/50 group transition-all duration-700 hover:-translate-y-2 hover:shadow-emerald-900/20"
              >
                <img 
                  src={item.image_url} 
                  alt={item.caption} 
                  className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                  <div className="inline-block w-fit rounded-lg bg-emerald-500 px-3 py-1 text-[9px] font-black text-white uppercase tracking-widest mb-4 shadow-lg">
                    {item.category}
                  </div>
                  <p className="text-white font-bold text-sm leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Camera className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada foto dalam koleksi</p>
          </div>
        )}
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
