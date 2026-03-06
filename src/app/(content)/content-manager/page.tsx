import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Image as ImageIcon,
  Newspaper,
  UserCircle,
  MessageSquare,
  ArrowRight,
  ListTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import prisma from "@/lib/prisma";

// Revalidate 0 memastikan dashboard selalu menampilkan data fresh
export const revalidate = 0;

export default async function ContentManagerDashboard() {
  // Ambil statistik secara paralel untuk efisiensi
  const [config, newsCount, unreadMessages] = await Promise.all([
    prisma.landingPageConfig.findUnique({ where: { id: "singleton" } }),
    prisma.news.count(),
    prisma.contactMessage.count({ where: { is_read: false } }),
  ]);

  const bannersCount = config?.banners ? (config.banners as any[]).length : 0;
  const galleryCount = config?.gallery ? (config.gallery as any[]).length : 0;
  const menusCount = config?.navbar_menus ? (config.navbar_menus as any[]).length : 0;

  return (
    <div className="p-4 md:p-10 space-y-10 pb-24 md:pb-10">
      <div>
        <h1 className="text-3xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
          Content Manager
        </h1>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
          Pusat kendali konten landing page dan informasi publik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Inbox Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500 relative">
                <MessageSquare className="h-8 w-8" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadMessages}
                  </span>
                )}
              </div>
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Pesan Masuk</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Kontak Website</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Lihat dan balas pesan yang dikirim oleh pengunjung melalui form kontak di landing page.
            </p>
            <Link href="/content-manager/messages">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Cek Kotak Masuk <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Data Home Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">{bannersCount}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Banners</p>
              </div>
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Data Home</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Hero, Banners & Keunggulan</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Kelola teks judul utama, slideshow banner, dan fitur unggulan perusahaan.
            </p>
            <Link href="/content-manager/home">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Kelola Home <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Manajemen Menu Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500">
                <ListTree className="h-8 w-8" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">{menusCount}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Menu Navigasi</p>
              </div>
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Manajemen Menu</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Navigasi Utama & Dropdown</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Kelola struktur link di navbar, buat menu dropdown, dan atur navigasi secara dinamis.
            </p>
            <Link href="/content-manager/menus">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Atur Menu <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* News Section Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500">
                <Newspaper className="h-8 w-8" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">{newsCount}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Artikel</p>
              </div>
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Berita / News</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Artikel & Publikasi</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Pusat publikasi artikel berita, pengumuman, dan update terbaru dari WahfaLab.
            </p>
            <Link href="/content-manager/news">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Kelola Berita <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Gallery Section Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500">
                <ImageIcon className="h-8 w-8" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">{galleryCount}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Foto</p>
              </div>
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Galeri & Media</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Foto Fasilitas & Dokumentasi</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Kelola koleksi foto untuk menampilkan kualitas laboratorium dan kegiatan lapangan Anda.
            </p>
            <Link href="/content-manager/gallery">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Buka Galeri <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Company Profile Card */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2.5rem] group hover:border-emerald-200 transition-all duration-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
            <div className="p-4 bg-white rounded-3xl shadow-sm text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-500">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="pt-4">
              <CardTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Profil Perusahaan</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Kontak, Alamat & Logo</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Atur informasi dasar perusahaan seperti nama, alamat, nomor telepon, dan logo yang muncul di header/footer.
            </p>
            <Link href="/content-manager/profile">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 group/btn transition-all">
                Edit Profil <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
