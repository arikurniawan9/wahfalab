"use client";

import { useState } from "react";
import { DatabaseBackup, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SuperadminBackupPage() {
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purgeResult, setPurgeResult] = useState("");
  const [purging, setPurging] = useState(false);

  const doRestore = async () => {
    try {
      const parsed = JSON.parse(payload);
      if (!confirmRestore) {
        setResult("Centang konfirmasi restore penuh sebelum melanjutkan.");
        return;
      }
      const res = await fetch("/api/superadmin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, __confirm_full_restore__: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Restore gagal");
      setResult("Restore berhasil dijalankan.");
    } catch (error: any) {
      setResult(error.message || "Restore gagal");
    }
  };

  const doPurgeExceptSuperadmin = async () => {
    try {
      setPurging(true);
      setPurgeResult("");
      const res = await fetch("/api/superadmin/backup/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: purgeConfirmText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal hapus data");
      setPurgeResult(json.message || "Purge selesai.");
    } catch (error: any) {
      setPurgeResult(error.message || "Gagal hapus data");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen max-w-7xl mx-auto space-y-6">
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900 rounded-2xl shadow-lg">
            <DatabaseBackup className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Backup & Restore Center</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">Export multi-format dan restore lintas environment</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-50/80 border-b border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Quick Export</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <a className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 flex items-center gap-2" href="/api/superadmin/backup/export?format=json">
              <Download className="h-4 w-4 text-emerald-600" /> Export JSON
            </a>
            <a className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 flex items-center gap-2" href="/api/superadmin/backup/export?format=csv">
              <Download className="h-4 w-4 text-emerald-600" /> Export CSV Bundle
            </a>
            <a className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 flex items-center gap-2" href="/api/superadmin/backup/export?format=sql">
              <Download className="h-4 w-4 text-emerald-600" /> Export SQL
            </a>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-sm font-black uppercase tracking-wider text-slate-700">Restore Dari JSON</p>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
              <Upload className="h-4 w-4 text-emerald-600" />
              Pilih File JSON
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFileName(file.name);
                  file.text().then((text) => setPayload(text)).catch(() => setResult("Gagal membaca file"));
                }}
              />
            </label>
            {fileName && <p className="text-xs text-slate-500">File: {fileName}</p>}
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="min-h-64 font-mono text-xs rounded-2xl"
              placeholder="Paste isi file JSON backup di sini..."
            />
            <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest" onClick={() => void doRestore()}>
              Jalankan Restore
            </Button>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={confirmRestore} onChange={(e) => setConfirmRestore(e.target.checked)} />
              Saya paham restore akan menimpa data saat ini
            </label>
            {result && <p className="text-sm text-slate-600">{result}</p>}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-sm font-black uppercase tracking-wider text-slate-700">Export Per Tabel</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["profiles", "quotations", "job_orders", "invoices", "payments", "financial_records"].map((table) => (
                <div key={table} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-600">{table}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <a className="rounded border px-2 py-1 text-xs hover:bg-slate-50" href={`/api/superadmin/backup/export?format=json&table=${table}`}>JSON</a>
                    <a className="rounded border px-2 py-1 text-xs hover:bg-slate-50" href={`/api/superadmin/backup/export?format=csv&table=${table}`}>CSV</a>
                    <a className="rounded border px-2 py-1 text-xs hover:bg-slate-50" href={`/api/superadmin/backup/export?format=sql&table=${table}`}>SQL</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-rose-100 bg-rose-50/40 p-6">
          <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-3">
            <p className="text-sm font-black uppercase tracking-wider text-rose-700">Danger Zone</p>
            <p className="text-sm text-slate-700">
              Hapus semua data aplikasi dan sisakan akun superadmin saja. Aksi ini permanen.
            </p>
            <p className="text-xs font-semibold text-rose-700">
              Ketik persis: <span className="font-black">DELETE_ALL_EXCEPT_SUPERADMIN</span>
            </p>
            <Textarea
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              className="min-h-16 rounded-xl bg-white text-xs"
              placeholder="DELETE_ALL_EXCEPT_SUPERADMIN"
            />
            <Button
              onClick={() => void doPurgeExceptSuperadmin()}
              disabled={purging || purgeConfirmText !== "DELETE_ALL_EXCEPT_SUPERADMIN"}
              className="h-11 rounded-xl bg-rose-600 font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-60"
            >
              {purging ? "Memproses..." : "Hapus Semua Kecuali Superadmin"}
            </Button>
            {purgeResult && <p className="text-sm text-slate-700">{purgeResult}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
