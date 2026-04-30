"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { requireActionRole } from "@/lib/actions/action-guard";

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity_type?: string;
}) {
  await requireActionRole(["admin"]);

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

export async function getAuditLogStats() {
  await requireActionRole(["admin"]);

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const [totalToday, totalAll, activeUser, commonAction] = await Promise.all([
    prisma.auditLog.count({
      where: {
        created_at: {
          gte: todayStart,
        },
      },
    }),
    prisma.auditLog.count(),
    prisma.auditLog.groupBy({
      by: ["user_email"],
      _count: {
        user_email: true,
      },
      orderBy: {
        _count: {
          user_email: "desc",
        },
      },
      take: 1,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 1,
    }),
  ]);

  return {
    totalToday,
    totalAll,
    activeUser: activeUser[0]?.user_email || "N/A",
    commonAction: commonAction[0]?.action || "N/A",
  };
}
