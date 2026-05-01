"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, RefreshCw, ShieldCheck, LockKeyhole, KeyRound, Pencil, Save, X, History, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type StaffItem = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  phone: string | null;
  created_at: string;
};

const roleOptions = [
  { value: "admin", label: "Administrator" },
  { value: "operator", label: "Operator" },
  { value: "content_manager", label: "Content Manager" },
  { value: "field_officer", label: "Petugas Lapangan" },
  { value: "analyst", label: "Analis Laboratorium" },
  { value: "reporting", label: "Staff Reporting" },
  { value: "finance", label: "Keuangan" },
] as const;

const roleLabelMap = Object.fromEntries(roleOptions.map((opt) => [opt.value, opt.label])) as Record<string, string>;
const roleToneMap: Record<string, string> = {
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  operator: "bg-emerald-50 text-emerald-700 border-emerald-200",
  content_manager: "bg-sky-50 text-sky-700 border-sky-200",
  field_officer: "bg-amber-50 text-amber-700 border-amber-200",
  analyst: "bg-violet-50 text-violet-700 border-violet-200",
  reporting: "bg-indigo-50 text-indigo-700 border-indigo-200",
  finance: "bg-teal-50 text-teal-700 border-teal-200",
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function ActionIconButton({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" {...props} className={cn("h-8 w-8", className)} title={label} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function SuperadminStaffPage() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tempPassword, setTempPassword] = useState<Record<string, string>>({});
  const [showTempPassword, setShowTempPassword] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StaffItem>>({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = async (overridePage?: number) => {
    setLoading(true);
    const currentPage = overridePage ?? page;
    const query = new URLSearchParams({
      search: debouncedSearch,
      page: String(currentPage),
      limit: "10",
    }).toString();
    const res = await fetch(`/api/superadmin/staff?${query}`, { cache: "no-store" });
    const json = await res.json();
    setItems(json.items || []);
    setPagination(json.pagination || { page: currentPage, limit: 10, total: 0, totalPages: 1 });
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void load(1);
  }, [debouncedSearch]);

  const onReset = async (userId: string) => {
    const res = await fetch("/api/superadmin/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (res.ok) {
      setTempPassword((prev) => ({ ...prev, [userId]: json.tempPassword }));
      setShowTempPassword((prev) => ({ ...prev, [userId]: false }));
    } else {
      alert(json.error || "Gagal reset password");
    }
  };

  const onStartEdit = (item: StaffItem) => {
    setEditId(item.id);
    setEditData({
      full_name: item.full_name,
      email: item.email,
      role: item.role,
      phone: item.phone,
    });
  };

  const onSaveEdit = async () => {
    if (!editId) return;
    const res = await fetch("/api/superadmin/staff", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editId, ...editData }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Gagal update");
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === editId ? json.item : it)));
    setEditId(null);
    setEditData({});
  };

  const hasPrev = useMemo(() => page > 1, [page]);
  const hasNext = useMemo(() => page < pagination.totalPages, [page, pagination.totalPages]);

  const movePage = async (next: number) => {
    setPage(next);
    await load(next);
  };

  return (
    <div className="min-h-screen max-w-7xl space-y-6 bg-slate-50 p-4 md:p-8">
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-3 shadow-lg shadow-emerald-900/25">
            <Users className="h-6 w-6 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Superadmin Staff Control</h1>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Identity, role, and credential governance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-200/70 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">
            Total Staff: {pagination.total}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:text-emerald-600 hover:shadow-md"
            onClick={() => void load()}
            title="Refresh Data"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <TooltipProvider delayDuration={180}>
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl">
        <div className="flex flex-col items-center gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-6 md:flex-row">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email staff..."
              className="h-12 rounded-2xl border-slate-200 bg-white pl-12 text-sm font-bold shadow-sm transition-all focus-visible:ring-emerald-500"
            />
          </div>
          <Button onClick={() => void load(1)} className="h-12 rounded-2xl bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
            Cari
          </Button>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr className="text-left">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-200">Nama</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-200">Email</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-200">Role</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-200">Keamanan</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-14 text-center text-slate-500" colSpan={5}>Memuat data staff...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-slate-500" colSpan={5}>Data staff tidak ditemukan.</td>
                </tr>
              ) : (
                items.map((user, index) => (
                  <tr key={user.id} className={cn("border-b border-slate-100 transition-all hover:bg-emerald-50/40", index % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                    <td className="px-6 py-4">
                      {editId === user.id ? (
                        <Input value={editData.full_name || ""} onChange={(e) => setEditData((prev) => ({ ...prev, full_name: e.target.value }))} />
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900">{user.full_name || "-"}</p>
                          <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editId === user.id ? (
                        <Input value={editData.email || ""} onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))} />
                      ) : (
                        <span className="font-medium text-slate-700">{user.email || "-"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editId === user.id ? (
                        <select
                          value={editData.role || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, role: e.target.value }))}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase", roleToneMap[user.role] || "border-slate-200 bg-slate-100 text-slate-700")}>
                          <ShieldCheck className="h-3 w-3" />
                          {roleLabelMap[user.role] || user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                        <LockKeyhole className="h-3 w-3" />
                        Hash Disembunyikan
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
                        <ActionIconButton
                          variant="outline"
                          className="h-8 w-8 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          onClick={() => void onReset(user.id)}
                          label="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </ActionIconButton>
                        {editId === user.id ? (
                          <>
                            <ActionIconButton
                              className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => void onSaveEdit()}
                              label="Simpan"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </ActionIconButton>
                            <ActionIconButton
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => setEditId(null)}
                              label="Batal"
                            >
                              <X className="h-3.5 w-3.5" />
                            </ActionIconButton>
                          </>
                        ) : (
                          <ActionIconButton
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => onStartEdit(user)}
                            label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </ActionIconButton>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild size="icon" variant="outline" className="h-8 w-8" title="Histori Tugas" aria-label="Histori Tugas">
                              <Link href={`/superadmin/staff/history?userId=${user.id}`}>
                                <History className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>Histori Tugas</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <p className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Temp baru:{" "}
                          {tempPassword[user.id]
                            ? showTempPassword[user.id]
                              ? tempPassword[user.id]
                              : "••••••••••••"
                            : "-"}
                        </p>
                        <ActionIconButton
                          variant="outline"
                          className="h-7 w-7 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() =>
                            setShowTempPassword((prev) => ({
                              ...prev,
                              [user.id]: !prev[user.id],
                            }))
                          }
                          label={showTempPassword[user.id] ? "Sembunyikan Password" : "Tampilkan Password"}
                          disabled={!tempPassword[user.id]}
                        >
                          {showTempPassword[user.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </ActionIconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm md:flex-row md:items-center">
          <p className="font-semibold text-slate-600">Total {pagination.total} staff</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrev || loading} onClick={() => void movePage(page - 1)}>
              Sebelumnya
            </Button>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
              Halaman {page} / {pagination.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={!hasNext || loading} onClick={() => void movePage(page + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
      </TooltipProvider>
    </div>
  );
}
