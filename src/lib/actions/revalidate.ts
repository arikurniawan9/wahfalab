"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Utility ini digunakan untuk mereset cache halaman Next.js.
 * Harus dipanggil setiap kali Content Manager menyimpan perubahan (Banners, Berita, dsb)
 * sehingga halaman depan (Landing Page) langsung terupdate tanpa perlu reload build.
 */

export async function revalidateLandingPage() {
  revalidatePath("/"); // Halaman Utama
  revalidatePath("/news"); // Halaman Daftar Berita
  revalidatePath("/gallery"); // Halaman Galeri
  revalidatePath("/contact"); // Halaman Kontak
  
  // Jika menggunakan fetch tags
  // revalidateTag("landing-config");
  // revalidateTag("news-list");

  return { success: true, timestamp: Date.now() };
}

export async function revalidateNewsArticle(slug: string) {
  revalidatePath(`/news/${slug}`);
  revalidatePath("/news");
  return { success: true, timestamp: Date.now() };
}
