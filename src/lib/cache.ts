import { cache } from "react";
import { PrismaClient } from "../generated/prisma";

// Use a local prisma instance if global one is not updated yet
const prisma = globalThis.prisma as any || new PrismaClient();

/**
 * Cached profile fetch - reduces database queries
 * Cached per request using React's cache()
 * 
 * NOTE: This function must be called from Server Components only.
 * For client components, use the auth hook directly.
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
 * Cached landing page config - used on landing page
 */
export const getCachedLandingPageConfig = cache(async () => {
  try {
    let config = await prisma.landingPageConfig.findFirst();
    
    // If no config exists, create the initial singleton record
    if (!config) {
      config = await prisma.landingPageConfig.create({
        data: { id: "singleton" }
      });
    }
    
    return config;
  } catch (error: any) {
    console.error("Error fetching landing page config:", error);
    return null;
  }
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
  } catch (error: any) {
    // Check for Prisma initialization or connection error
    if (error.message?.includes('Can\'t reach database server') || 
        error.message?.includes('PrismaClientInitializationError') ||
        error.message?.includes('invocation in')) {
      // Throw a clean error that will be caught by error.tsx
      throw new Error('DATABASE_CONNECTION_ERROR: Can\'t reach database server.');
    }
    
    console.error("Non-connection error in getCachedCompanyProfile:", error);
    return null;
  }
});

/**
 * Global Redis Cache for Master Data
 */
import { redis } from "./redis";

const CACHE_TTL = 60 * 60; // 1 hour for master data in seconds

export async function getFromGlobalCache(key: string) {
  try {
    // Only attempt if redis is connected and ready
    if (redis.status !== "ready") return null;
    
    const data = await redis.get(key);
    if (data) return JSON.parse(data);
    return null;
  } catch (error) {
    // Silent fail for local dev without redis
    return null;
  }
}

export async function setToGlobalCache(key: string, data: any) {
  try {
    if (redis.status !== "ready") return;
    
    await redis.set(key, JSON.stringify(data), "EX", CACHE_TTL);
  } catch (error) {
    // Silent fail
  }
}

export async function invalidateGlobalCache(key?: string) {
  try {
    if (redis.status !== "ready") return;
    
    if (key) {
      await redis.del(key);
    } else {
      await redis.flushdb();
    }
  } catch (error) {
    // Silent fail
  }
}

/**
 * Cached services fetch - Used by Operator Dashboard
 */
export const getCachedAllServices = cache(async () => {
  const cacheKey = "all_services";
  const cached = await getFromGlobalCache(cacheKey);
  if (cached) return cached;

  try {
    const services = await prisma.service.findMany({
      include: { 
        category_ref: true,
        regulation_ref: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    const serialized = await import("@/lib/utils/serialize").then(m => m.serializeData(services));
    await setToGlobalCache(cacheKey, serialized);
    return serialized;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
});

/**
 * Cached categories fetch - Used by Operator Dashboard
 */
export const getCachedAllCategories = cache(async () => {
  const cacheKey = "all_categories";
  const cached = await getFromGlobalCache(cacheKey);
  if (cached) return cached;

  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
    const serialized = await import("@/lib/utils/serialize").then(m => m.serializeData(categories));
    await setToGlobalCache(cacheKey, serialized);
    return serialized;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
});
