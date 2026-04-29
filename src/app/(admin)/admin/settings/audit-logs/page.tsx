"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  DataTable, 
  SearchInput, 
  Pagination, 
  EmptyState, 
  TableSkeleton,
  DetailModal
} from "@/components/ui";
import { useCrud } from "@/hooks";
import { getAuditLogs, getAuditLogStats } from "@/lib/actions/audit-log";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Eye, 
  Activity, 
  User, 
  Clock, 
  Globe,
  Filter,
  ArrowRight,
  Database,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { AuditLog } from "@/generated/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stats {
  totalToday: number;
  totalAll: number;
  activeUser: string;
  commonAction: string;
}

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // Fix: use useCallback to prevent infinite reload
  const fetchAuditLogsWrapper = useCallback(async (page?: number, limit?: number, search?: string) => {
    const result = await getAuditLogs({ page, limit, search });
    return {
      items: result.data as AuditLog[],
      total: result.meta.total,
      pages: result.meta.totalPages,
    };
  }, []);

  const {
    data,
    loading,
    page,
    setPage,
    pages,
    search,
    setSearch,
    refresh
  } = useCrud<AuditLog>({
    fetchFn: fetchAuditLogsWrapper,
    messages: {
      loading: "Memuat data audit log...",
    },
  });

  // Fetch stats separately
  const fetchStats = useCallback(async () => {
    try {
      const result = await getAuditLogStats();
      setStats(result);
    } catch (error) {
      console.error("Failed to fetch audit stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, data]); // Refresh stats when data changes

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (act.includes("update")) return "bg-blue-50 text-blue-700 border-blue-100";
    if (act.includes("delete")) return "bg-rose-50 text-rose-700 border-rose-100";
    if (act.includes("login")) return "bg-violet-50 text-violet-700 border-violet-100";
    if (act.includes("logout")) return "bg-slate-50 text-slate-700 border-slate-100";
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  const getEntityIcon = (entity: string) => {
    const ent = entity.toLowerCase();
    if (ent.includes("user")) return <User className="h-3 w-3" />;
    if (ent.includes("quotation")) return <Database className="h-3 w-3" />;
    if (ent.includes("job")) return <Activity className="h-3 w-3" />;
    return <Globe className="h-3 w-3" />;
  };

  const renderJsonData = (label: string, data: any) => {
    if (!data) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</h4>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-[300px] overflow-auto">
          <pre className="text-[10px] font-mono text-slate-600 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: "created_at",
      header: "Timestamp",
      cell: (item: AuditLog) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700">
            {format(new Date(item.created_at), "dd MMM yyyy", { locale: id })}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {format(new Date(item.created_at), "HH:mm:ss", { locale: id })}
          </span>
        </div>
      ),
    },
    {
      key: "user",
      header: "Operator",
      cell: (item: AuditLog) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-700 truncate max-w-[150px]" title={item.user_email || "System"}>
              {item.user_email || "System"}
            </div>
            {item.user_role && (
              <div className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                {item.user_role.replace("_", " ")}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Activity",
      cell: (item: AuditLog) => (
        <Badge className={`${getActionColor(item.action)} border px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm`}>
          {item.action.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Affected Resource",
      cell: (item: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
            {getEntityIcon(item.entity_type)}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 capitalize">
              {item.entity_type.replace("_", " ")}
            </div>
            <div className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]" title={item.entity_id || ""}>
              ID: {item.entity_id?.substring(0, 8) || "-"}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "Access Point",
      cell: (item: AuditLog) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <Globe className="h-3 w-3 opacity-50" />
          <span className="text-[10px] font-mono font-medium tracking-tight">
            {item.ip_address || "internal"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (item: AuditLog) => (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => {
            setSelectedLog(item);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/30 min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Security Audit <span className="text-blue-600">Logs</span></h1>
          </div>
          <p className="text-sm font-medium text-slate-500 ml-11">Enterprise-grade activity monitoring and compliance tracking</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => refresh()} 
            variant="outline" 
            className="rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs uppercase h-11 px-6 hover:bg-slate-50 transition-all"
          >
            <History className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Today</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalToday || 0}</h3>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> System healthy
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Most Active</p>
                <h3 className="text-lg font-black text-slate-800 truncate max-w-[140px]" title={stats?.activeUser}>
                  {stats?.activeUser?.split('@')[0] || "N/A"}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1 truncate max-w-[140px]">
                  {stats?.activeUser || ""}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                <User className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Common Action</p>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {stats?.commonAction?.replace("_", " ") || "N/A"}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  Most frequent operation
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalAll || 0}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1">Historical log entries</p>
              </div>
              <div className="p-3 bg-violet-50 rounded-2xl text-violet-600 group-hover:scale-110 transition-transform">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden border border-slate-100">
        <CardHeader className="px-8 pt-8 pb-0 border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-6">
            <div className="relative max-w-md w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <SearchInput
                placeholder="Cari operator, aksi, atau entitas..."
                value={search}
                onChange={setSearch}
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Filter className="h-4 w-4 text-slate-300" />
              Showing {data.length} of {stats?.totalAll || 0} Entries
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 py-6">
          {loading ? (
            <div className="py-4">
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
                    <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                      <History className="h-10 w-10 text-slate-300" />
                    </div>
                  }
                  title="No Audit Logs Found"
                  description="Aktivitas sistem akan muncul di sini setelah terekam"
                />
              }
            />
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-50">
              <Pagination
                currentPage={page}
                totalPages={pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <DetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        title={
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${selectedLog ? getActionColor(selectedLog.action) : "bg-slate-50"}`}>
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black uppercase tracking-tight">Audit <span className="text-blue-600">Details</span></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log ID: {selectedLog?.id}</span>
            </div>
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-8 p-1">
            {/* Log Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Timestamp</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">
                    {format(new Date(selectedLog.created_at), "dd MMMM yyyy HH:mm:ss", { locale: id })}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operator</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">{selectedLog.user_email || "System"}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Action Type</p>
                <div className="flex items-center gap-2">
                  <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Entity Type</p>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                  {getEntityIcon(selectedLog.entity_type)}
                  <span className="capitalize ml-1">{selectedLog.entity_type.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-blue-50/50 border border-blue-100/50">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase">IP ADDRESS:</span>
                <span className="text-xs font-mono font-bold text-blue-700">{selectedLog.ip_address || "N/A"}</span>
              </div>
              <div className="h-4 w-[1px] bg-blue-200" />
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase">AGENT:</span>
                <span className="text-[9px] font-medium text-blue-700 truncate max-w-[200px]">{selectedLog.user_agent || "N/A"}</span>
              </div>
            </div>

            {/* Data Diff View */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Data Snapshots</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>

              {selectedLog.action === "update" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderJsonData("Before Changes", selectedLog.old_data)}
                  <div className="relative">
                    <div className="hidden md:block absolute -left-5 top-1/2 -translate-y-1/2 z-10">
                      <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                    {renderJsonData("After Changes", selectedLog.new_data)}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {selectedLog.old_data && renderJsonData("Original Data", selectedLog.old_data)}
                  {selectedLog.new_data && renderJsonData("New Data", selectedLog.new_data)}
                </div>
              )}

              {/* Action specific alert */}
              {selectedLog.action === "delete" && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-rose-700 uppercase mb-1">Warning: Destructive Action</p>
                    <p className="text-[10px] font-medium text-rose-600 leading-relaxed">This record was permanently removed from the active database. Use the snapshot above for recovery if necessary.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
