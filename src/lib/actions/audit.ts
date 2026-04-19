"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { serializeData } from "@/lib/utils/serialize";

/**
 * Get current user profile and role
 */
async function getProfile() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return await prisma.profile.findUnique({
    where: { email: session.user.email },
  });
}

/**
 * Fetch Audit Logs with filtering and pagination
 */
export async function getAuditLogsAction(params: {
  page?: number;
  limit?: number;
  user_email?: string;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      throw new Error("Unauthorized: Only admins can access audit logs");
    }

    const { 
      page = 1, 
      limit = 50, 
      user_email, 
      entity_type, 
      action, 
      date_from, 
      date_to 
    } = params;
    
    const skip = (page - 1) * limit;

    const where: any = {};
    if (user_email) where.user_email = { contains: user_email, mode: 'insensitive' };
    if (entity_type && entity_type !== 'all') where.entity_type = entity_type;
    if (action && action !== 'all') where.action = action;
    
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) {
        const toDate = new Date(date_to);
        toDate.setHours(23, 59, 59, 999);
        where.created_at.lte = toDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      logs: serializeData(logs),
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Fetch audit logs error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch audit logs",
    };
  }
}

/**
 * Get distinct filter values for the UI
 */
export async function getAuditFilterValues() {
  try {
    const [entityTypes, actions] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ['entity_type'],
        select: { entity_type: true },
      }),
      prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
      }),
    ]);

    return {
      success: true,
      entityTypes: entityTypes.map((e: any) => e.entity_type),
      actions: actions.map((a: any) => a.action),
    };
  } catch (error) {
    return { success: false, entityTypes: [], actions: [] };
  }
}
