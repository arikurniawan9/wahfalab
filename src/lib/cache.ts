import { cache } from "react";
import prisma from "@/lib/prisma";

/**
 * Cached profile fetch - reduces database queries
 * Cached per request using React's cache()
 * 
 * NOTE: This function must be called from Server Components only.
 * For client components, use the auth hook or Supabase client directly.
 */
export const getCachedProfile = cache(async () => {
  // This should only be called from server components
  // The caller is responsible for getting the user ID
  return {
    getProfileByUserId: async (userId: string) => {
      return await prisma.profile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          full_name: true,
          company_name: true,
          role: true,
          created_at: true,
        },
      });
    }
  };
});

/**
 * Cached company profile - used across multiple layouts
 * Cached per request using React's cache()
 */
export const getCachedCompanyProfile = cache(async () => {
  try {
    const company = await prisma.companyProfile.findFirst({
      select: {
        id: true,
        company_name: true,
        logo_url: true,
        address: true,
        phone: true,
        whatsapp: true,
        email: true,
        website: true,
        tagline: true,
        npwp: true,
        created_at: true,
        updated_at: true,
      },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
});
