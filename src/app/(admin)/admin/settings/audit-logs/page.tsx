"use client";

import React from "react";
import { DataTable, SearchInput, Pagination, EmptyState, TableSkeleton } from "@/components/ui";
import { useCrud } from "@/hooks";
import { getAuditLogs } from "@/lib/actions/audit-log";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { AuditLog } from "@/generated/prisma";

export default function AuditLogsPage() {
  const fetchAuditLogsWrapper = async (page?: number, limit?: number, search?: string) => {
    const result = await getAuditLogs({ page, limit, search });
    return {
      items: result.data,
      total: result.meta.total,
      pages: result.meta.totalPages,
    };
  };

  const {
    data,
    loading,
    page,
    setPage,
    pages,
    search,
    setSearch,
  } = useCrud<AuditLog>({
    fetchFn: fetchAuditLogsWrapper,
    messages: {
      loading: "Memuat data audit log...",
    },
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "update": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delete": return "bg-red-100 text-red-800 border-red-200";
      case "login": return "bg-purple-100 text-purple-800 border-purple-200";
      case "logout": return "bg-slate-100 text-slate-800 border-slate-200";
      case "update_status": return "bg-amber-100 text-amber-800 border-amber-200";
      case "update_role": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const columns = [
    {
      key: "created_at",
      header: "Waktu",
      cell: (item: AuditLog) => (
        <span className="text-sm whitespace-nowrap">
          {format(new Date(item.created_at), "dd MMM yyyy HH:mm:ss", { locale: id })}
        </span>
      ),
    },
    {
      key: "user",
      header: "Pengguna",
      cell: (item: AuditLog) => (
        <div>
          <div className="font-medium text-sm text-slate-900">{item.user_email || "System"}</div>
          {item.user_role && <div className="text-xs text-slate-500 capitalize">{item.user_role.replace("_", " ")}</div>}
        </div>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      cell: (item: AuditLog) => (
        <Badge className={getActionColor(item.action)} variant="outline">
          {item.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entitas",
      cell: (item: AuditLog) => (
        <div>
          <div className="text-sm font-medium text-slate-900 capitalize">{item.entity_type.replace("_", " ")}</div>
          {item.entity_id && (
            <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]" title={item.entity_id}>
              {item.entity_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      cell: (item: AuditLog) => (
        <span className="text-xs text-slate-500 font-mono">
          {item.ip_address || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Audit Log Viewer</h1>
          <p className="text-slate-500 mt-1">Melihat riwayat aktivitas dan perubahan data dalam sistem</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 max-w-md">
        <SearchInput
          placeholder="Cari email, aksi, atau entitas..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={10} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyState={
              <EmptyState
                icon={
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                    <History className="h-8 w-8 text-slate-300" />
                  </div>
                }
                title="Tidak ada log"
                description="Belum ada aktivitas yang terekam atau tidak ada hasil untuk pencarian Anda"
              />
            }
          />
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
