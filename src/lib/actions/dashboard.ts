"use server";

import prisma from "@/lib/prisma";
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  startOfMonth,
  endOfDay,
  endOfMonth,
} from "date-fns";

type DashboardActivity = {
  id: string;
  type: "quotation" | "job";
  title: string;
  subtitle: string;
  amount: number;
  formattedAmount?: string;
  timestamp: Date;
  formattedTime: string;
  status: string;
  avatar: null;
  metadata: {
    items?: number;
    stage?: string;
  };
};

type DashboardAttention = {
  pendingApprovals: number;
  quotationsToFollowUp: number;
  unscheduledJobs: number;
  total: number;
};

type DashboardTodayScheduleItem = {
  id: string;
  scheduledDate: Date;
  trackingCode: string;
  customerName: string;
  location: string;
  fieldOfficer: string;
};

export type AdminDashboardData = {
  summary: {
    totalQuotations: number;
    activeOrders: number;
    totalUsers: number;
    totalRevenue: number;
  };
  growthPercentage: number;
  weeklyStats: {
    quotations: number[];
    jobs: number[];
  };
  quotationTrend: Array<{
    name: string;
    total: number;
  }>;
  jobStatus: Array<{
    name: string;
    value: number;
  }>;
  activityFeed: DashboardActivity[];
  attention: DashboardAttention;
  todaysSchedule: DashboardTodayScheduleItem[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins}m yang lalu`;
  if (diffHours < 24) return `${diffHours}j yang lalu`;
  if (diffDays < 7) return `${diffDays}h yang lalu`;

  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function toSeriesByDay(dates: Date[], weekStart: Date) {
  const result = new Array(7).fill(0);
  for (const value of dates) {
    const dayIndex = Math.floor(
      (startOfDay(value).getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (dayIndex >= 0 && dayIndex < 7) {
      result[dayIndex] += 1;
    }
  }
  return result;
}

function toActivityFeed(
  quotations: Array<{
    id: string;
    quotation_number: string;
    total_amount: unknown;
    status: string;
    created_at: Date;
    profile: { full_name: string | null; company_name: string | null } | null;
    _count: { items: number };
  }>,
  jobs: Array<{
    id: string;
    tracking_code: string;
    status: string;
    created_at: Date;
    quotation: {
      profile: { full_name: string | null; company_name: string | null } | null;
    } | null;
  }>
): DashboardActivity[] {
  const quotationActivities: DashboardActivity[] = quotations.map((q) => {
    const amount = Number(q.total_amount || 0);
    return {
      id: q.id,
      type: "quotation",
      title: q.quotation_number,
      subtitle: q.profile?.company_name || q.profile?.full_name || "-",
      amount,
      formattedAmount: formatCurrency(amount),
      timestamp: new Date(q.created_at),
      formattedTime: formatRelativeTime(new Date(q.created_at)),
      status: q.status,
      avatar: null,
      metadata: {
        items: q._count.items || 0,
      },
    };
  });

  const jobActivities: DashboardActivity[] = jobs.map((j) => ({
    id: j.id,
    type: "job",
    title: j.tracking_code,
    subtitle: j.quotation?.profile?.company_name || j.quotation?.profile?.full_name || "-",
    amount: 0,
    formattedAmount: undefined,
    timestamp: new Date(j.created_at),
    formattedTime: formatRelativeTime(new Date(j.created_at)),
    status: j.status,
    avatar: null,
    metadata: {
      stage: j.status,
    },
  }));

  return [...quotationActivities, ...jobActivities]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

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
    jobStatus: jobStatusDistribution.map((item: any) => ({
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

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const weekStart = startOfDay(subDays(now, 6));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const monthlyQuotationPromises = Array.from({ length: 6 }).map(async (_, i) => {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const total = await prisma.quotation.count({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      name: format(date, "MMM"),
      total,
    };
  });

  const [
    totalQuotations,
    activeOrders,
    totalUsers,
    totalRevenue,
    quotationsThisMonth,
    quotationsLastMonth,
    quotationTrendRaw,
    jobStatusDistribution,
    recentQuotations,
    recentJobOrders,
    quotationDatesThisWeek,
    jobDatesThisWeek,
    pendingApprovalRequests,
    sentQuotations,
    unscheduledJobs,
    todaysSamplingAssignments,
  ] = await Promise.all([
    prisma.quotation.count(),
    prisma.jobOrder.count({
      where: {
        status: {
          in: ["sampling", "analysis", "reporting"],
        },
      },
    }),
    prisma.profile.count({
      where: { role: "client" },
    }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: "paid" },
    }),
    prisma.quotation.count({
      where: {
        created_at: { gte: currentMonthStart },
      },
    }),
    prisma.quotation.count({
      where: {
        created_at: {
          gte: lastMonthStart,
          lt: currentMonthStart,
        },
      },
    }),
    Promise.all(monthlyQuotationPromises),
    prisma.jobOrder.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.quotation.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        quotation_number: true,
        total_amount: true,
        status: true,
        created_at: true,
        profile: {
          select: {
            full_name: true,
            company_name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.jobOrder.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        tracking_code: true,
        status: true,
        created_at: true,
        quotation: {
          select: {
            profile: {
              select: {
                full_name: true,
                company_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.quotation.findMany({
      where: {
        created_at: { gte: weekStart },
      },
      select: {
        created_at: true,
      },
    }),
    prisma.jobOrder.findMany({
      where: {
        created_at: { gte: weekStart },
      },
      select: {
        created_at: true,
      },
    }),
    prisma.approvalRequest.count({
      where: { status: "pending" },
    }),
    prisma.quotation.count({
      where: { status: "sent" },
    }),
    prisma.jobOrder.count({
      where: {
        status: "scheduled",
        sampling_assignment: null,
      },
    }),
    prisma.samplingAssignment.findMany({
      where: {
        scheduled_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { scheduled_date: "asc" },
      take: 5,
      select: {
        id: true,
        scheduled_date: true,
        location: true,
        field_officer: {
          select: {
            full_name: true,
          },
        },
        job_order: {
          select: {
            id: true,
            tracking_code: true,
            quotation: {
              select: {
                profile: {
                  select: {
                    full_name: true,
                    company_name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const growthPercentage =
    quotationsLastMonth > 0
      ? Math.round(((quotationsThisMonth - quotationsLastMonth) / quotationsLastMonth) * 100)
      : quotationsThisMonth > 0
        ? 100
        : 0;

  const activityFeed = toActivityFeed(recentQuotations, recentJobOrders);
  const weeklyStats = {
    quotations: toSeriesByDay(
      quotationDatesThisWeek.map((q: { created_at: Date }) => new Date(q.created_at)),
      weekStart
    ),
    jobs: toSeriesByDay(
      jobDatesThisWeek.map((j: { created_at: Date }) => new Date(j.created_at)),
      weekStart
    ),
  };

  const attention = {
    pendingApprovals: pendingApprovalRequests,
    quotationsToFollowUp: sentQuotations,
    unscheduledJobs,
  };

  return {
    summary: {
      totalQuotations,
      activeOrders,
      totalUsers,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
    },
    growthPercentage,
    weeklyStats,
    quotationTrend: quotationTrendRaw.reverse(),
    jobStatus: jobStatusDistribution.map((item: { status: string; _count: { id: number } }) => ({
      name: item.status.replace(/_/g, " "),
      value: item._count.id,
    })),
    activityFeed,
    attention: {
      ...attention,
      total:
        attention.pendingApprovals +
        attention.quotationsToFollowUp +
        attention.unscheduledJobs,
    },
    todaysSchedule: todaysSamplingAssignments.map((item: {
      id: string;
      scheduled_date: Date;
      location: string;
      field_officer: { full_name: string | null };
      job_order: {
        tracking_code: string;
        quotation: {
          profile: { full_name: string | null; company_name: string | null } | null;
        } | null;
      };
    }) => ({
      id: item.id,
      scheduledDate: item.scheduled_date,
      trackingCode: item.job_order.tracking_code,
      customerName:
        item.job_order.quotation?.profile?.company_name ||
        item.job_order.quotation?.profile?.full_name ||
        "-",
      location: item.location,
      fieldOfficer: item.field_officer.full_name || "-",
    })),
  };
}
