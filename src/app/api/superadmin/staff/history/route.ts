import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperadminEmail } from "@/lib/superadmin";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireSuperadminEmail();
    const params = request.nextUrl.searchParams;
    const userId = params.get("userId") || "";
    const page = Math.max(1, Number(params.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, Number(params.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ entity_type: "user" }, { entity_type: "profile" }],
    };

    if (userId) {
      where.AND = [{ OR: [{ user_id: userId }, { entity_id: userId }] }];
    }

    const [logs, total, staffSummary, recentJobs] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          entity_type: true,
          entity_id: true,
          user_email: true,
          user_role: true,
          created_at: true,
          metadata: true,
        },
      }),
      prisma.auditLog.count({ where }),
      userId
        ? prisma.profile.findUnique({
            where: { id: userId },
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
              _count: {
                select: {
                  analyst_jobs: true,
                  reporting_jobs: true,
                  payments_handled: true,
                  recorded_transactions: true,
                  quotations: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      userId
        ? prisma.jobOrder.findMany({
            where: {
              OR: [{ analyst_id: userId }, { reporting_id: userId }],
            },
            take: 8,
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              tracking_code: true,
              status: true,
              created_at: true,
              notes: true,
              certificate_url: true,
              analyst_id: true,
              reporting_id: true,
              lab_analysis: {
                select: {
                  result_pdf_url: true,
                  raw_data_url: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      items: logs,
      staffSummary,
      recentJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
