import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status: string;
  date: Date;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminProfile = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const target = await prisma.profile.findUnique({
      where: { id },
      select: { id: true, full_name: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [
      assignedSampling,
      completedSampling,
      assignedAnalystJobs,
      completedAnalystJobs,
      assignedReportingJobs,
      completedReportingJobs,
      handledPayments,
      recordedTransactions,
      createdQuotations,
      createdTravelOrders,
      recentSampling,
      recentAnalystJobs,
      recentReportingJobs,
      recentPayments,
      recentTransactions,
      recentQuotations,
      recentTravelOrders,
    ] = await Promise.all([
      prisma.samplingAssignment.count({ where: { field_officer_id: id } }),
      prisma.samplingAssignment.count({
        where: { field_officer_id: id, status: "completed" },
      }),
      prisma.jobOrder.count({ where: { analyst_id: id } }),
      prisma.jobOrder.count({
        where: { analyst_id: id, status: { in: ["analysis_done", "completed", "paid"] } },
      }),
      prisma.jobOrder.count({ where: { reporting_id: id } }),
      prisma.jobOrder.count({
        where: { reporting_id: id, status: { in: ["completed", "paid"] } },
      }),
      prisma.payment.count({ where: { handled_by: id } }),
      prisma.financialRecord.count({ where: { recorded_by: id } }),
      prisma.quotation.count({ where: { user_id: id } }),
      prisma.travelOrder.count({
        where: { assignment: { field_officer_id: id } },
      }),
      prisma.samplingAssignment.findMany({
        where: { field_officer_id: id },
        take: 5,
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          status: true,
          updated_at: true,
          location: true,
          job_order: { select: { tracking_code: true } },
        },
      }),
      prisma.jobOrder.findMany({
        where: { analyst_id: id },
        take: 5,
        orderBy: { created_at: "desc" },
        select: { id: true, status: true, created_at: true, tracking_code: true },
      }),
      prisma.jobOrder.findMany({
        where: { reporting_id: id },
        take: 5,
        orderBy: { created_at: "desc" },
        select: { id: true, status: true, created_at: true, tracking_code: true },
      }),
      prisma.payment.findMany({
        where: { handled_by: id },
        take: 5,
        orderBy: { updated_at: "desc" },
        select: { id: true, payment_status: true, updated_at: true, invoice_number: true },
      }),
      prisma.financialRecord.findMany({
        where: { recorded_by: id },
        take: 5,
        orderBy: { updated_at: "desc" },
        select: { id: true, type: true, updated_at: true, description: true },
      }),
      prisma.quotation.findMany({
        where: { user_id: id },
        take: 5,
        orderBy: { created_at: "desc" },
        select: { id: true, status: true, created_at: true, quotation_number: true },
      }),
      prisma.travelOrder.findMany({
        where: { assignment: { field_officer_id: id } },
        take: 5,
        orderBy: { updated_at: "desc" },
        select: { id: true, updated_at: true, document_number: true, destination: true },
      }),
    ]);

    const activities: ActivityItem[] = [
      ...recentSampling.map((item: {
        id: string;
        status: string;
        updated_at: Date;
        location: string;
        job_order: { tracking_code: string } | null;
      }) => ({
        id: `sampling-${item.id}`,
        type: "sampling",
        title: item.job_order?.tracking_code || "Tugas sampling",
        subtitle: item.location || "-",
        status: item.status,
        date: item.updated_at,
      })),
      ...recentAnalystJobs.map((item: {
        id: string;
        status: string;
        created_at: Date;
        tracking_code: string;
      }) => ({
        id: `analysis-${item.id}`,
        type: "analysis",
        title: item.tracking_code,
        subtitle: "Proses analisis",
        status: item.status,
        date: item.created_at,
      })),
      ...recentReportingJobs.map((item: {
        id: string;
        status: string;
        created_at: Date;
        tracking_code: string;
      }) => ({
        id: `report-${item.id}`,
        type: "reporting",
        title: item.tracking_code,
        subtitle: "Proses reporting",
        status: item.status,
        date: item.created_at,
      })),
      ...recentPayments.map((item: {
        id: string;
        payment_status: string;
        updated_at: Date;
        invoice_number: string;
      }) => ({
        id: `payment-${item.id}`,
        type: "payment",
        title: item.invoice_number,
        subtitle: "Penanganan pembayaran",
        status: item.payment_status,
        date: item.updated_at,
      })),
      ...recentTransactions.map((item: {
        id: string;
        type: string;
        updated_at: Date;
        description: string;
      }) => ({
        id: `trx-${item.id}`,
        type: "finance",
        title: item.description,
        subtitle: "Pencatatan transaksi",
        status: item.type,
        date: item.updated_at,
      })),
      ...recentQuotations.map((item: {
        id: string;
        status: string;
        created_at: Date;
        quotation_number: string;
      }) => ({
        id: `quo-${item.id}`,
        type: "quotation",
        title: item.quotation_number,
        subtitle: "Pembuatan penawaran",
        status: item.status,
        date: item.created_at,
      })),
      ...recentTravelOrders.map((item: {
        id: string;
        updated_at: Date;
        document_number: string;
        destination: string;
      }) => ({
        id: `travel-${item.id}`,
        type: "travel_order",
        title: item.document_number,
        subtitle: item.destination || "Surat tugas",
        status: "created",
        date: item.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    const summary = {
      assignedSampling,
      completedSampling,
      assignedAnalystJobs,
      completedAnalystJobs,
      assignedReportingJobs,
      completedReportingJobs,
      handledPayments,
      recordedTransactions,
      createdQuotations,
      createdTravelOrders,
      totalTasks:
        assignedSampling +
        assignedAnalystJobs +
        assignedReportingJobs +
        handledPayments +
        recordedTransactions +
        createdQuotations +
        createdTravelOrders,
    };

    return NextResponse.json({
      user: target,
      summary,
      activities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load history" },
      { status: 500 }
    );
  }
}
