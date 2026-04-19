import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getCachedLandingPageConfig,
  getCachedCompanyProfile
} from "@/lib/cache";
import prisma from "@/lib/prisma";
import {
  Newspaper, 
  ArrowRight,
  ChevronRight,
  Clock,
  Home,
  Award,
  Briefcase,
  Heart,
  ImageIcon,
  Scale,
  Phone,
  ChevronDown,
  Calendar
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getPublishedNews } from "@/lib/actions/news";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LandingHeader } from "@/components/layout/LandingHeader";

export default async function NewsPage() {
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
  const news = await getPublishedNews();

  const navbarMenus = Array.isArray(landingConfig?.navbar_menus)
    ? landingConfig.navbar_menus
    : JSON.parse((landingConfig?.navbar_menus as string) || "[]");

  const featuredNews = Array.isArray(news) && news.length > 0 ? news[0] : null;
  const otherNews = Array.isArray(news) && news.length > 1 ? news.slice(1) : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30 font-[family-name:var(--font-geist-sans)]">
      {/* Dynamic Navigation */}
      <LandingHeader 
        companyProfile={companyProfile} 
        navbarMenus={navbarMenus} 
        user={user} 
        role={role} 
      />

      <main className="flex-1">
        {/* Simple Header - Compact Content */}
        <div className="bg-white border-b relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-emerald-50/30 to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 md:px-12 py-10 md:py-14 relative z-10">
            <div className="max-w-2xl space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-black text-emerald-700 uppercase tracking-widest shadow-sm mx-auto md:mx-0">
                <Newspaper className="h-2.5 w-2.5" />
                News & Update
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-emerald-950 uppercase tracking-tight leading-tight">
                Informasi <br />
                <span className="text-emerald-500 font-black">Terkini WahfaLab</span>
              </h1>
              <div className="h-1 w-16 bg-emerald-500 rounded-full mx-auto md:mx-0" />
            </div>
          </div>
        </div>

        {/* Featured News Section - Compact Content */}
        {featuredNews && (
          <section className="container mx-auto px-6 md:px-12 -mt-8 md:-mt-12 relative z-20">
            <Link href={`/news/${featuredNews.slug}`} className="group block">
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-emerald-900/5 border-4 border-white grid grid-cols-1 lg:grid-cols-5 transition-all duration-500 hover:shadow-emerald-900/15 hover:-translate-y-1">
                <div className="lg:col-span-2 aspect-[16/10] lg:aspect-auto relative overflow-hidden">
                  {featuredNews.image_url ? (
                    <img 
                      src={featuredNews.image_url} 
                      alt={featuredNews.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <Newspaper className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Terbaru
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-3 p-8 md:p-12 flex flex-col justify-center space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      <span>{featuredNews.category}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(featuredNews.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-emerald-950 uppercase tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                      {featuredNews.title}
                    </h2>
                    {featuredNews.show_tags && featuredNews.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {featuredNews.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200/50">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2">
                      {featuredNews.content.replace(/<[^>]*>?/gm, '')}
                    </p>
                  </div>
                  <div className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest group-hover:gap-1.5 transition-all">
                    Selengkapnya <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Other News Grid - Compact Content */}
        <section className="py-12 md:py-20 container mx-auto px-6 md:px-12">
          {otherNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {otherNews.map((item: any) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="group">
                  <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-emerald-100 shadow-lg shadow-slate-200/30 hover:shadow-emerald-900/10 transition-all duration-500 hover:-translate-y-1">
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                          <Newspaper className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md border border-emerald-500/20">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <h2 className="text-sm font-black text-emerald-900 uppercase tracking-tight leading-snug mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {item.title}
                      </h2>
                      {item.show_tags && item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.tags.map((tag: string, i: number) => (
                            <span key={i} className="text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100/50">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-slate-500 text-[11px] font-medium line-clamp-2 leading-relaxed mb-6 italic opacity-80">
                        {item.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                      </p>
                      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                        Selengkapnya <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : !featuredNews && (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <Newspaper className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Belum ada berita yang tersedia</p>
            </div>
          )}
        </section>
      </main>

      <footer className="py-12 md:py-20 border-t bg-white">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 WahfaLab Indonesia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
