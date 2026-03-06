"use server";

import prisma from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getAdminDashboardStats() {
  const now = new Date();
  
  // 1. Tren Penawaran 6 Bulan Terakhir
  const monthlyQuotations = await Promise.all(
    Array.from({ length: 6 }).map(async (_, i) => {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const count = await prisma.quotation.count({
        where: {
          created_at: {
            gte: start,
            lte: end,
          },
        },
      });
      
      return {
        name: format(date, "MMM"),
        total: count,
      };
    })
  );

  // 2. Distribusi Status Job Order
  const jobStatusDistribution = await prisma.jobOrder.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  // 3. Statistik Ringkas
  const [totalCustomers, totalQuotations, totalJobs, totalRevenue] = await Promise.all([
    prisma.profile.count({ where: { role: 'client' } }),
    prisma.quotation.count(),
    prisma.jobOrder.count(),
    prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "paid",
      },
    }),
  ]);

  return {
    quotationTrend: monthlyQuotations.reverse(),
    jobStatus: jobStatusDistribution.map((item) => ({
      name: item.status.replace(/_/g, " "),
      value: item._count.id,
    })),
    summary: {
      totalCustomers,
      totalQuotations,
      totalJobs,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
    },
  };
}
