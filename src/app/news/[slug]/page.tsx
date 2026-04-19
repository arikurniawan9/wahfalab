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
  ArrowLeft,
  Clock,
  Home,
  Award,
  Heart,
  ImageIcon,
  Phone,
  ChevronDown,
  Briefcase,
  Scale
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getNewsBySlug } from "@/lib/actions/news";
import { notFound } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
  const newsItem = await getNewsBySlug(slug);

  if (!newsItem || (typeof newsItem === 'object' && newsItem.error)) {
    notFound();
  }

  const navbarMenus = Array.isArray(landingConfig?.navbar_menus)
    ? landingConfig.navbar_menus
    : JSON.parse((landingConfig?.navbar_menus as string) || "[]");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Dynamic Navigation */}
      <LandingHeader 
        companyProfile={companyProfile} 
        navbarMenus={navbarMenus} 
        user={user} 
        role={role} 
      />

      <main className="flex-1 pb-20">
        <article className="max-w-4xl mx-auto px-4 pt-12 md:pt-20">
          <Link href="/news" className="inline-flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Berita
          </Link>

          <div className="space-y-6 mb-12">
            <div className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {newsItem.category}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-emerald-950 uppercase tracking-tight leading-tight">
              {newsItem.title}
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-6">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {new Date(newsItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <div>{newsItem.view_count} Kali Dilihat</div>
            </div>
          </div>

          {newsItem.image_url && (
            <div className="aspect-video w-full rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl mb-12">
              <img src={newsItem.image_url} alt={newsItem.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-emerald max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg">
            <div dangerouslySetInnerHTML={{ __html: newsItem.content.replace(/\n/g, '<br />') }} />
          </div>

          {newsItem.show_tags && newsItem.tags?.length > 0 && (
            <div className="mt-16 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Tags</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {newsItem.tags.map((tag: string, i: number) => (
                  <span 
                    key={i} 
                    className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="bg-slate-900 py-12 md:py-20 mt-20">
        <div className="container mx-auto px-6 md:px-12 text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo-wahfalab.png" alt="Logo" fill className="object-contain brightness-0 invert" />
            </div>
            <span className="font-black text-xl tracking-tighter text-white uppercase">
              {companyProfile?.company_name || "WahfaLab"}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
            © 2026 {companyProfile?.company_name || "WahfaLab"} Indonesia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
