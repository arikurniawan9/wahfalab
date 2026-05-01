import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type HistoryResponse = {
  user: { id: string; full_name: string | null; role: string };
  summary: {
    assignedSampling: number;
    completedSampling: number;
    assignedAnalystJobs: number;
    completedAnalystJobs: number;
    assignedReportingJobs: number;
    completedReportingJobs: number;
    handledPayments: number;
    recordedTransactions: number;
    createdQuotations: number;
    createdTravelOrders: number;
    totalTasks: number;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    status: string;
    date: string;
    details?: string[];
    files?: Array<{ label: string; url: string }>;
  }>;
};

function toServiceSummary(
  items: Array<{
    qty: number;
    parameter_snapshot: string | null;
    service: { name: string } | null;
    equipment: { name: string } | null;
  }>
) {
  if (!items || items.length === 0) return "Belum ada detail layanan";
  return items
    .slice(0, 4)
    .map((item) => {
      const base = item.service?.name || item.equipment?.name || "Item";
      const param = item.parameter_snapshot ? ` (${item.parameter_snapshot})` : "";
      return `${base} x${item.qty}${param}`;
    })
    .join(", ");
}

function toUploadedFiles(
  files: Array<{ label: string; url: string | null | undefined }>
) {
  return files
    .filter((f) => Boolean(f.url))
    .map((f) => ({ label: f.label, url: String(f.url) }));
}

async function loadHistory(id: string): Promise<HistoryResponse | null> {
  const user = await prisma.profile.findUnique({
    where: { id },
    select: { id: true, full_name: true, role: true },
  });

  if (!user) return null;

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
    prisma.samplingAssignment.count({ where: { field_officer_id: id, status: "completed" } }),
    prisma.jobOrder.count({ where: { analyst_id: id } }),
    prisma.jobOrder.count({ where: { analyst_id: id, status: { in: ["analysis_done", "completed", "paid"] } } }),
    prisma.jobOrder.count({ where: { reporting_id: id } }),
    prisma.jobOrder.count({ where: { reporting_id: id, status: { in: ["completed", "paid"] } } }),
    prisma.payment.count({ where: { handled_by: id } }),
    prisma.financialRecord.count({ where: { recorded_by: id } }),
    prisma.quotation.count({ where: { user_id: id } }),
    prisma.travelOrder.count({ where: { assignment: { field_officer_id: id } } }),
    prisma.samplingAssignment.findMany({
      where: { field_officer_id: id },
      take: 5,
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        status: true,
        updated_at: true,
        location: true,
        photos: true,
        signed_travel_order_url: true,
        job_order: {
          select: {
            tracking_code: true,
            quotation: {
              select: {
                items: {
                  select: {
                    qty: true,
                    parameter_snapshot: true,
                    service: { select: { name: true } },
                    equipment: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.jobOrder.findMany({
      where: { analyst_id: id },
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        status: true,
        created_at: true,
        tracking_code: true,
        certificate_url: true,
        quotation: {
          select: {
            items: {
              select: {
                qty: true,
                parameter_snapshot: true,
                service: { select: { name: true } },
                equipment: { select: { name: true } },
              },
            },
          },
        },
        lab_analysis: {
          select: {
            result_pdf_url: true,
            raw_data_url: true,
            analysis_notes: true,
          },
        },
      },
    }),
    prisma.jobOrder.findMany({
      where: { reporting_id: id },
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        status: true,
        created_at: true,
        tracking_code: true,
        certificate_url: true,
        quotation: {
          select: {
            items: {
              select: {
                qty: true,
                parameter_snapshot: true,
                service: { select: { name: true } },
                equipment: { select: { name: true } },
              },
            },
          },
        },
        lab_analysis: {
          select: {
            result_pdf_url: true,
            raw_data_url: true,
          },
        },
        lab_report: {
          select: {
            report_number: true,
          },
        },
      },
    }),
    prisma.payment.findMany({ where: { handled_by: id }, take: 5, orderBy: { updated_at: "desc" }, select: { id: true, payment_status: true, updated_at: true, invoice_number: true } }),
    prisma.financialRecord.findMany({ where: { recorded_by: id }, take: 5, orderBy: { updated_at: "desc" }, select: { id: true, type: true, updated_at: true, description: true } }),
    prisma.quotation.findMany({ where: { user_id: id }, take: 5, orderBy: { created_at: "desc" }, select: { id: true, status: true, created_at: true, quotation_number: true } }),
    prisma.travelOrder.findMany({ where: { assignment: { field_officer_id: id } }, take: 5, orderBy: { updated_at: "desc" }, select: { id: true, updated_at: true, document_number: true, destination: true, pdf_url: true } }),
  ]);

  const activities = [
    ...recentSampling.map((item: {
      id: string;
      job_order: { tracking_code: string; quotation: { items: Array<{ qty: number; parameter_snapshot: string | null; service: { name: string } | null; equipment: { name: string } | null }> } | null } | null;
      location: string;
      status: string;
      updated_at: Date;
      photos: unknown;
      signed_travel_order_url: string | null;
    }) => {
      const photoFiles = Array.isArray(item.photos)
        ? item.photos
            .map((photo: any, idx: number) => ({
              label: photo?.name ? `Foto ${idx + 1}: ${photo.name}` : `Foto sampling ${idx + 1}`,
              url: typeof photo?.url === "string" ? photo.url : null,
            }))
            .filter((p) => Boolean(p.url))
        : [];

      return {
        id: `sampling-${item.id}`,
        type: "sampling",
        title: item.job_order?.tracking_code || "Tugas sampling",
        subtitle: item.location || "-",
        status: item.status,
        date: item.updated_at,
        details: [
          `Lokasi: ${item.location || "-"}`,
          `Pekerjaan: ${toServiceSummary(item.job_order?.quotation?.items || [])}`,
        ],
        files: toUploadedFiles([
          { label: "Surat tugas ditandatangani", url: item.signed_travel_order_url },
          ...photoFiles,
        ]),
      };
    }),
    ...recentAnalystJobs.map((item: {
      id: string;
      tracking_code: string;
      status: string;
      created_at: Date;
      certificate_url: string | null;
      quotation: { items: Array<{ qty: number; parameter_snapshot: string | null; service: { name: string } | null; equipment: { name: string } | null }> } | null;
      lab_analysis: { result_pdf_url: string | null; raw_data_url: string | null; analysis_notes: string | null } | null;
    }) => ({
      id: `analysis-${item.id}`,
      type: "analysis",
      title: item.tracking_code,
      subtitle: "Proses analisis",
      status: item.status,
      date: item.created_at,
      details: [
        `Mengerjakan: ${toServiceSummary(item.quotation?.items || [])}`,
        item.lab_analysis?.analysis_notes ? `Catatan analis: ${item.lab_analysis.analysis_notes}` : "Catatan analis: -",
      ],
      files: toUploadedFiles([
        { label: "Hasil analisis (PDF)", url: item.lab_analysis?.result_pdf_url },
        { label: "Data mentah", url: item.lab_analysis?.raw_data_url },
        { label: "Sertifikat", url: item.certificate_url },
      ]),
    })),
    ...recentReportingJobs.map((item: {
      id: string;
      tracking_code: string;
      status: string;
      created_at: Date;
      certificate_url: string | null;
      quotation: { items: Array<{ qty: number; parameter_snapshot: string | null; service: { name: string } | null; equipment: { name: string } | null }> } | null;
      lab_analysis: { result_pdf_url: string | null; raw_data_url: string | null } | null;
      lab_report: { report_number: string } | null;
    }) => ({
      id: `report-${item.id}`,
      type: "reporting",
      title: item.tracking_code,
      subtitle: "Proses reporting",
      status: item.status,
      date: item.created_at,
      details: [
        `Mengerjakan: ${toServiceSummary(item.quotation?.items || [])}`,
        `No. Laporan: ${item.lab_report?.report_number || "-"}`,
      ],
      files: toUploadedFiles([
        { label: "Dokumen hasil analisis", url: item.lab_analysis?.result_pdf_url },
        { label: "Data mentah", url: item.lab_analysis?.raw_data_url },
        { label: "Sertifikat", url: item.certificate_url },
      ]),
    })),
    ...recentPayments.map((item: { id: string; invoice_number: string; payment_status: string; updated_at: Date }) => ({ id: `payment-${item.id}`, type: "payment", title: item.invoice_number, subtitle: "Penanganan pembayaran", status: item.payment_status, date: item.updated_at })),
    ...recentTransactions.map((item: { id: string; description: string; type: string; updated_at: Date }) => ({ id: `trx-${item.id}`, type: "finance", title: item.description, subtitle: "Pencatatan transaksi", status: item.type, date: item.updated_at })),
    ...recentQuotations.map((item: { id: string; quotation_number: string; status: string; created_at: Date }) => ({ id: `quo-${item.id}`, type: "quotation", title: item.quotation_number, subtitle: "Pembuatan penawaran", status: item.status, date: item.created_at })),
    ...recentTravelOrders.map((item: { id: string; document_number: string; destination: string; updated_at: Date; pdf_url: string | null }) => ({
      id: `travel-${item.id}`,
      type: "travel_order",
      title: item.document_number,
      subtitle: item.destination || "Surat tugas",
      status: "created",
      date: item.updated_at,
      details: [`Tujuan: ${item.destination || "-"}`],
      files: toUploadedFiles([{ label: "Dokumen surat tugas", url: item.pdf_url }]),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12)
    .map((item) => ({ ...item, date: item.date.toISOString() }));

  return {
    user,
    summary: {
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
    },
    activities,
  };
}

export default async function UserHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const adminProfile = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (adminProfile?.role !== "admin") redirect("/access-denied");
  const { id } = await params;
  const data = await loadHistory(id);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Histori Petugas</h1>
          <p className="text-sm text-slate-500">{data?.user.full_name || "-"} | {data?.user.role || "-"}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      {!data ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">User tidak ditemukan.</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Total Aktivitas" value={data.summary.totalTasks} />
            <Card title="Sampling Selesai" value={data.summary.completedSampling} />
            <Card title="Analisis Selesai" value={data.summary.completedAnalystJobs} />
            <Card title="Reporting Selesai" value={data.summary.completedReportingJobs} />
            <Card title="Pembayaran Ditangani" value={data.summary.handledPayments} />
            <Card title="Transaksi Dicatat" value={data.summary.recordedTransactions} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Aktivitas Terbaru</p>
            </div>
            <div className="space-y-2">
              {data.activities.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
              ) : (
                        data.activities.map((item) => (
                          <div key={item.id} className="flex items-start justify-between rounded-lg border border-slate-100 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                              <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                              {item.details && item.details.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.details.map((detail, idx) => (
                                    <p key={`${item.id}-detail-${idx}`} className="text-xs text-slate-600">
                                      {detail}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.files && item.files.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {item.files.map((file, idx) => (
                                    <a
                                      key={`${item.id}-file-${idx}`}
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                                    >
                                      {file.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="ml-3 text-right">
                      <Badge variant="outline" className="mb-1 border-slate-200 text-[10px] uppercase">
                        {item.status}
                      </Badge>
                      <p className="text-[11px] text-slate-500">{format(new Date(item.date), "dd MMM yyyy, HH:mm")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
