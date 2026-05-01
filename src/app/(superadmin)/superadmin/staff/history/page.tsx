"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, RefreshCw, FileText, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type HistoryItem = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_email: string | null;
  user_role: string | null;
  created_at: string;
};

type StaffSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  _count: {
    analyst_jobs: number;
    reporting_jobs: number;
    payments_handled: number;
    recorded_transactions: number;
    quotations: number;
  };
};

type RecentJob = {
  id: string;
  tracking_code: string;
  status: string;
  created_at: string;
  notes: string | null;
  certificate_url: string | null;
  analyst_id: string | null;
  reporting_id: string | null;
  lab_analysis: {
    result_pdf_url: string | null;
    raw_data_url: string | null;
  } | null;
};

export default function SuperadminStaffHistoryPage() {
  const params = useSearchParams();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [staffSummary, setStaffSummary] = useState<StaffSummary | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(params.get("userId") || "");

  const load = async () => {
    setLoading(true);
    const q = new URLSearchParams({ userId, page: "1", limit: "20" }).toString();
    const res = await fetch(`/api/superadmin/staff/history?${q}`, { cache: "no-store" });
    const json = await res.json();
    setItems(json.items || []);
    setStaffSummary(json.staffSummary || null);
    setRecentJobs(json.recentJobs || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen max-w-7xl mx-auto space-y-6">
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900 rounded-2xl shadow-lg">
            <History className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Histori Manajemen Staff</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">Audit trail dan rekap pekerjaan petugas</p>
          </div>
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white border-slate-200 shadow-sm" onClick={() => void load()}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex gap-3 items-center">
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filter ID staff (opsional)" className="h-11 rounded-xl" />
          <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => void load()}>
            Terapkan
          </Button>
        </div>

        {staffSummary && (
          <div className="grid gap-3 p-6 md:grid-cols-5">
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Analis Jobs</p><p className="text-xl font-black text-slate-900">{staffSummary._count.analyst_jobs}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Reporting Jobs</p><p className="text-xl font-black text-slate-900">{staffSummary._count.reporting_jobs}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Payments</p><p className="text-xl font-black text-slate-900">{staffSummary._count.payments_handled}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Transaksi</p><p className="text-xl font-black text-slate-900">{staffSummary._count.recorded_transactions}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Quotations</p><p className="text-xl font-black text-slate-900">{staffSummary._count.quotations}</p></div>
          </div>
        )}

        <div className="px-6 pb-6">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Detail Job Terakhir</h3>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada job untuk staff ini.</p>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">{job.tracking_code}</p>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold uppercase text-emerald-700">{job.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(job.created_at).toLocaleString("id-ID")}</p>
                  {job.notes && <p className="mt-2 text-sm text-slate-700">{job.notes}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.certificate_url && <a className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-slate-50" href={job.certificate_url} target="_blank" rel="noopener noreferrer"><FileText className="h-3 w-3" /> Sertifikat</a>}
                    {job.lab_analysis?.result_pdf_url && <a className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-slate-50" href={job.lab_analysis.result_pdf_url} target="_blank" rel="noopener noreferrer"><FileText className="h-3 w-3" /> Laporan PDF</a>}
                    {job.lab_analysis?.raw_data_url && <a className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-slate-50" href={job.lab_analysis.raw_data_url} target="_blank" rel="noopener noreferrer"><FileImage className="h-3 w-3" /> Data Mentah</a>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-x-auto bg-white border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50">
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-5 font-bold text-slate-700">Waktu</th>
                <th className="px-6 py-5 font-bold text-slate-700">Aksi</th>
                <th className="px-6 py-5 font-bold text-slate-700">Entity</th>
                <th className="px-6 py-5 font-bold text-slate-700">User Email</th>
                <th className="px-6 py-5 font-bold text-slate-700">Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-10 text-slate-500" colSpan={5}>Memuat histori...</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-6 py-10 text-slate-500" colSpan={5}>Belum ada histori staff.</td></tr>
              ) : items.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 text-slate-700">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{log.action}</td>
                  <td className="px-6 py-4 text-slate-700">{log.entity_type} / {log.entity_id || "-"}</td>
                  <td className="px-6 py-4 text-slate-700">{log.user_email || "-"}</td>
                  <td className="px-6 py-4 text-slate-700">{log.user_role || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
