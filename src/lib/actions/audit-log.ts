"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity_type?: string;
}) {
  const { page = 1, limit = 10, search, action, entity_type } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { user_email: { contains: search, mode: "insensitive" } },
              { action: { contains: search, mode: "insensitive" } },
              { entity_type: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      action ? { action } : {},
      entity_type ? { entity_type } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
