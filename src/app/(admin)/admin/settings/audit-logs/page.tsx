"use client";

import { useEffect, useState, useTransition } from "react";
import { getAuditLogs } from "@/lib/actions/audit-log";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Eye, 
  History,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AuditLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = () => {
    startTransition(async () => {
      const result = await getAuditLogs({
        page,
        limit: 10,
        search,
        action: action === "all" ? undefined : action,
      });
      setData(result.data);
      setMeta(result.meta);
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create": return "bg-green-100 text-green-700 border-green-200";
      case "update": return "bg-blue-100 text-blue-700 border-blue-200";
      case "delete": return "bg-red-100 text-red-700 border-red-200";
      case "login": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="text-slate-500">Pantau seluruh aktivitas sistem dan perubahan data secara real-time.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari email atau entitas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Cari</Button>
            </form>

            <div className="flex items-center gap-2">
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-[150px] bg-white">
                  <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Waktu</TableHead>
                  <TableHead className="font-semibold text-slate-700">User</TableHead>
                  <TableHead className="font-semibold text-slate-700">Aksi</TableHead>
                  <TableHead className="font-semibold text-slate-700">Entitas</TableHead>
                  <TableHead className="font-semibold text-slate-700">IP Address</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-16 text-center animate-pulse bg-slate-50/50"></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      Tidak ada data log ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="whitespace-nowrap font-medium text-slate-600">
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{log.user_email || "System"}</span>
                          <span className="text-xs text-slate-500 capitalize">{log.user_role || "automated"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600 capitalize">
                        {log.entity_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedLog(log)}
                          className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-900">{data.length}</span> dari <span className="font-medium text-slate-900">{meta.total}</span> data
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isPending}
                className="bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-4">
                Halaman {page} dari {meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages || isPending}
                className="bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-500" />
              Detail Aktivitas
            </DialogTitle>
            <DialogDescription>
              Detail perubahan data pada entitas <span className="font-semibold text-slate-900">{selectedLog?.entity_type}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b pb-1">Informasi Dasar</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Aksi:</span> <Badge variant="outline" className={getActionColor(selectedLog?.action || "")}>{selectedLog?.action}</Badge></div>
                <div className="flex justify-between"><span className="text-slate-500">Dilakukan Oleh:</span> <span className="font-medium">{selectedLog?.user_email || "System"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="capitalize">{selectedLog?.user_role || "automated"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Waktu:</span> <span>{selectedLog && format(new Date(selectedLog.created_at), "dd MMMM yyyy, HH:mm:ss", { locale: id })}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Entitas ID:</span> <span className="font-mono text-[10px] truncate max-w-[150px]">{selectedLog?.entity_id || "-"}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b pb-1">Detail Teknis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">IP Address:</span> <span className="font-mono">{selectedLog?.ip_address || "-"}</span></div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">User Agent:</span> 
                  <span className="text-[10px] text-slate-400 leading-tight bg-slate-50 p-2 rounded-md font-mono border">
                    {selectedLog?.user_agent || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Data Lama</h4>
                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-auto max-h-[300px] text-[10px] font-mono leading-relaxed">
                  <pre>{JSON.stringify(selectedLog?.old_data || {}, null, 2)}</pre>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 uppercase">Data Baru</h4>
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-auto max-h-[300px] text-[10px] font-mono leading-relaxed border-l-2 border-emerald-500">
                  <pre>{JSON.stringify(selectedLog?.new_data || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
