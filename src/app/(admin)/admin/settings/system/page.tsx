"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Upload,
  Database,
  ShieldAlert,
  History,
  Trash2,
  RefreshCw,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Settings,
  Lock,
  FileBox,
  Layers,
  Archive,
  ClipboardList,
  UserCheck,
  Banknote,
  Keyboard,
  Cpu,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Users,
  Contact2,
  Eye,
  FileSearch,
  ListFilter,
  X,
  ArrowLeft,
  Table as TableIcon
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { 
  getSystemStats, 
  exportSystemData, 
  cleanupSpecificCategory, 
  factoryReset,
  restoreSystemData,
  getRecentMaintenanceLogs
} from "@/lib/actions/system";
import { verifyPasswordAction } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SystemMaintenancePage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", description: "" });

  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setAdminPasswordError] = useState("");

  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  
  // Restore & Preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupContent, setBackupContent] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewTable, setActivePreviewTable] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [backupOptions, setBackupOptions] = useState<Record<string, boolean>>({
    users: true, staff: true, quotations: true, jobs: true, finance: true, master: true, system: true,
  });

  const [cleanupOptions, setCleanupOptions] = useState({
    logs: true, transactions: false, jobs: false, quotations: false, assistants: false, customers: false, staff: false,
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([getSystemStats(), getRecentMaintenanceLogs()]);
      setStats(statsData);
      setRecentLogs(logsData);
    } catch (error) { toast.error("Gagal memuat data sistem"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (content.data) {
            setBackupContent(content);
            toast.success("File backup valid.");
          } else {
            toast.error("Format backup tidak dikenali.");
            setSelectedFile(null);
          }
        } catch (err) {
          toast.error("Gagal membaca file JSON.");
          setSelectedFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBackup = async (isFull: boolean = false) => {
    const selectedCategories = isFull ? ['all'] : Object.entries(backupOptions).filter(([_, v]) => v).map(([k]) => k);
    if (!isFull && selectedCategories.length === 0) return toast.error("Pilih minimal satu kategori");

    setIsProgressOpen(true);
    setProgress(10);
    setCurrentTask("Menyiapkan struktur data...");
    
    try {
      const backupData = await exportSystemData(isFull ? undefined : selectedCategories);
      if (backupData.error) throw new Error(backupData.error);

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wahfalab_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      setProgress(100);
      setCurrentTask("Backup selesai!");
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({ title: "Backup Berhasil", description: "Data telah berhasil diekspor." });
        setIsSuccessDialogOpen(true);
        loadAllData();
      }, 800);
    } catch (error: any) { toast.error(error.message); setIsProgressOpen(false); }
  };

  const handleRestore = async () => {
    if (!adminPassword) return setAdminPasswordError("Password wajib diisi");
    const vResult = await verifyPasswordAction(adminPassword);
    if (vResult.error) return setAdminPasswordError(vResult.error);

    setIsRestoreConfirmOpen(false);
    setIsPreviewOpen(false);
    setAdminPassword("");
    setIsProgressOpen(true);
    setCurrentTask("Menyuntikkan snapshot...");
    
    try {
      const result = await restoreSystemData(backupContent);
      if (result.error) throw new Error(result.error);
      setProgress(100);
      setCurrentTask("Restorasi selesai!");
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({ title: "Restorasi Berhasil", description: "Sistem telah dipulihkan ke kondisi snapshot." });
        setIsSuccessDialogOpen(true);
        setSelectedFile(null);
        setBackupContent(null);
        loadAllData();
      }, 800);
    } catch (error: any) { toast.error(error.message); setIsProgressOpen(false); }
  };

  const handleCleanup = async () => {
    if (!adminPassword) return setAdminPasswordError("Password wajib diisi");
    const vResult = await verifyPasswordAction(adminPassword);
    if (vResult.error) return setAdminPasswordError(vResult.error);

    setIsDeleteDialogOpen(false);
    setAdminPassword("");
    setIsProgressOpen(true);
    
    if (isResetMode) {
      const result = await factoryReset();
      if (result.success) {
        setProgress(100);
        setSuccessInfo({ title: "Reset Berhasil", description: "Seluruh data telah dihapus." });
        setIsSuccessDialogOpen(true);
        loadAllData();
      }
      setIsProgressOpen(false);
      return;
    }

    const selected = Object.entries(cleanupOptions).filter(([_, checked]) => checked).map(([k]) => k);
    for (const cat of selected) {
      setCurrentTask(`Cleaning ${cat}...`);
      await cleanupSpecificCategory(cat);
    }
    setIsProgressOpen(false);
    loadAllData();
    toast.success("Pembersihan selesai");
  };

  const toggleAllBackup = (val: boolean) => {
    const newOptions = { ...backupOptions };
    Object.keys(newOptions).forEach(k => newOptions[k] = val);
    setBackupOptions(newOptions);
  };

  const isAllBackupSelected = Object.values(backupOptions).every(v => v);
  const totalRecs = stats?.total_records || 0;

  return (
    <div className="p-4 md:p-8 bg-slate-50/20 font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg shadow-inner"><Server className="h-5 w-5 text-emerald-700" /></div>
          <div>
            <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">Infrastruktur</h1>
            <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Control Center • v1.2</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg font-black text-[9px] uppercase tracking-widest gap-2 h-9 px-4 bg-white" onClick={loadAllData}>
          <RefreshCw className={cn("h-3.5 w-3.5 text-emerald-600", loading && "animate-spin")} /> Segarkan Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-none shadow-lg bg-emerald-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20" />
            <CardHeader className="p-5 pb-2 relative z-10"><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-emerald-300/60"><Zap className="h-3.5 w-3.5 fill-emerald-400 animate-pulse" /> System Health</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-6 relative z-10">
              <div><span className="text-3xl font-black tracking-tighter block leading-none">STABIL</span><span className="text-[8px] font-bold text-emerald-400/80 uppercase tracking-widest flex items-center gap-1.5 mt-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Infrastructure Synced</span></div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="h-2 w-full bg-emerald-950/50 rounded-full overflow-hidden flex shadow-inner">
                  <div className="bg-blue-500 h-full" style={{ width: `${(stats?.quotations / totalRecs * 100) || 0}%` }} />
                  <div className="bg-amber-500 h-full" style={{ width: `${(stats?.jobs / totalRecs * 100) || 0}%` }} />
                  <div className="bg-emerald-500 h-full" style={{ width: `${(stats?.financialRecords / totalRecs * 100) || 0}%` }} />
                  <div className="bg-slate-400 h-full" style={{ width: `${(stats?.logs / totalRecs * 100) || 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <StatMini title="Komersial" value={stats?.quotations} color="bg-blue-500" />
                  <StatMini title="Operasional" value={stats?.jobs} color="bg-amber-500" />
                  <StatMini title="Keuangan" value={stats?.financialRecords} color="bg-emerald-500" />
                  <StatMini title="Logs" value={stats?.logs} color="bg-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-md bg-white border border-slate-100">
            <CardHeader className="p-5 pb-3"><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2"><History className="h-3.5 w-3.5 text-blue-500" /> Maintenance Logs</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3"><div className="mt-1 w-1 h-1 rounded-full bg-blue-500 shrink-0 shadow-sm" />
                  <div className="min-w-0"><p className="text-[9px] font-black text-slate-700 uppercase truncate leading-none">{log.action.replace(/_/g, ' ')}</p><p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{format(new Date(log.created_at), "HH:mm • dd MMM", { locale: id })}</p></div>
                </div>
              ))}
              <Link href="/admin/settings/audit-logs"><Button variant="ghost" className="w-full text-[8px] font-black text-blue-600 uppercase h-8 rounded-lg hover:bg-blue-50 transition-all">Log Lengkap</Button></Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Tabs defaultValue="backup" className="w-full">
            <TabsList className="grid grid-cols-3 h-12 p-1 bg-slate-100 rounded-xl mb-6">
              <TabsTrigger value="backup" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-700 transition-all">Backup</TabsTrigger>
              <TabsTrigger value="restore" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all">Restore</TabsTrigger>
              <TabsTrigger value="maintenance" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-700 transition-all">Cleanup</TabsTrigger>
            </TabsList>

            <TabsContent value="backup" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
              <Card className="rounded-2xl border-none shadow-lg bg-white p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Export Data</h3><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Simpan snapshot sistem ke format JSON</p></div><Archive className="h-6 w-6 text-emerald-100" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <BackupItem title="Customers" icon={UserCheck} count={stats?.customers} checked={backupOptions.users} onChange={(v: boolean) => setBackupOptions({...backupOptions, users: v})} />
                  <BackupItem title="Staff / Team" icon={Contact2} count={stats?.staff} checked={backupOptions.staff} onChange={(v: boolean) => setBackupOptions({...backupOptions, staff: v})} />
                  <BackupItem title="Commercial" icon={FileBox} count={stats?.quotations} checked={backupOptions.quotations} onChange={(v: boolean) => setBackupOptions({...backupOptions, quotations: v})} />
                  <BackupItem title="Operational" icon={Layers} count={stats?.jobs} checked={backupOptions.jobs} onChange={(v: boolean) => setBackupOptions({...backupOptions, jobs: v})} />
                  <BackupItem title="Financial" icon={Banknote} count={stats?.financialRecords} checked={backupOptions.finance} onChange={(v: boolean) => setBackupOptions({...backupOptions, finance: v})} />
                  <BackupItem title="System Logs" icon={Activity} count={stats?.logs} checked={backupOptions.system} onChange={(v: boolean) => setBackupOptions({...backupOptions, system: v})} />
                </div>
                <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => toggleAllBackup(!isAllBackupSelected)} className="h-11 rounded-xl font-black uppercase text-[8px] px-6">{isAllBackupSelected ? "Deselect All" : "Select All"}</Button>
                  <LoadingButton onClick={() => handleBackup(isAllBackupSelected)} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"><Download className="h-3.5 w-3.5 mr-2" /> Download Snapshot</LoadingButton>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="restore" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
              <Card className="rounded-2xl border-none shadow-lg bg-white p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4"><div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight text-blue-900">Recovery</h3><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Suntikkan data cadangan ke database</p></div><RefreshCw className="h-6 w-6 text-blue-100" /></div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group",
                    selectedFile ? "border-emerald-400 bg-emerald-50/20" : "border-slate-100 bg-slate-50/50 hover:border-blue-400"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-2 animate-in zoom-in">
                      <FileJson className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-900 uppercase">{selectedFile.name}</p>
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Snapshot Terdeteksi</p>
                      <Button variant="outline" size="sm" className="mt-4 h-8 text-[8px] font-black uppercase px-4 rounded-lg" onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }}>
                        <Eye className="h-3 w-3 mr-2" /> Tinjau Data
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih file snapshot .json</p>
                    </div>
                  )}
                </div>
                <Button disabled={!selectedFile} onClick={() => setIsPreviewOpen(true)} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95">
                  <FileSearch className="h-4 w-4 mr-2" /> Review & Restore
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
              <Card className="rounded-2xl border-none shadow-lg bg-white p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4"><div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight text-rose-900">Purge Zone</h3><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Penghapusan kategori data secara permanen</p></div><ShieldAlert className="h-6 w-6 text-rose-100" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CleanupOption title="Audit Logs" icon={Activity} count={stats?.logs} checked={cleanupOptions.logs} onChange={(v) => setCleanupOptions({...cleanupOptions, logs: v})} />
                  <CleanupOption title="Finance" icon={Banknote} count={stats?.financialRecords} checked={cleanupOptions.transactions} onChange={(v) => setCleanupOptions({...cleanupOptions, transactions: v})} />
                  <CleanupOption title="Jobs Progress" icon={Layers} count={stats?.jobs} checked={cleanupOptions.jobs} onChange={(v) => setCleanupOptions({...cleanupOptions, jobs: v})} />
                  <CleanupOption title="Quotations" icon={FileBox} count={stats?.quotations} checked={cleanupOptions.quotations} onChange={(v) => setCleanupOptions({...cleanupOptions, quotations: v})} />
                  <CleanupOption title="Staff Accounts" icon={Contact2} count={stats?.staff} checked={cleanupOptions.staff} onChange={(v) => setCleanupOptions({...cleanupOptions, staff: v})} />
                  <CleanupOption title="Customer DB" icon={UserCheck} count={stats?.customers} checked={cleanupOptions.customers} onChange={(v) => setCleanupOptions({...cleanupOptions, customers: v})} />
                </div>
                <div className="p-4 bg-rose-950 rounded-xl flex items-center gap-4"><AlertCircle className="h-5 w-5 text-rose-400 shrink-0" /><p className="text-[8px] font-bold text-rose-200 uppercase leading-normal tracking-tight">Warning: Data yang dihapus hilang selamanya. Prosedur ini tidak dapat dibatalkan.</p></div>
                <Button onClick={() => { setIsResetMode(false); setIsDeleteDialogOpen(true); }} className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-md transition-all active:scale-95">Eksekusi Penghapusan</Button>
                <div className="pt-6 border-t border-slate-50 text-center"><Button onClick={() => { setIsResetMode(true); setIsDeleteDialogOpen(true); }} variant="outline" className="border-rose-100 text-rose-400 font-black uppercase text-[8px] tracking-[0.3em] h-9 px-8 rounded-lg">Reset Seluruh Infrastruktur</Button></div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* RESTORE PREVIEW DIALOG - IMPROVED WITH DATA VIEW */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => { setIsPreviewOpen(open); if (!open) setActivePreviewTable(null); }}>
        <DialogContent showCloseButton={false} className={cn(
          "rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white transition-all duration-500",
          activePreviewTable ? "max-w-5xl" : "max-w-2xl"
        )}>
          <div className="bg-blue-600 p-6 text-white flex items-center justify-between relative shrink-0">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                {activePreviewTable ? <TableIcon className="h-6 w-6" /> : <FileSearch className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest">
                  {activePreviewTable ? `Isi Tabel: ${activePreviewTable.replace(/([A-Z])/g, ' $1').toUpperCase()}` : "Pratinjau Snapshot"}
                </DialogTitle>
                <DialogDescription className="text-[9px] text-blue-100 font-bold uppercase tracking-[0.2em] mt-0.5 opacity-80">
                  {activePreviewTable ? "Menampilkan 5 baris pertama data backup" : "Verifikasi muatan data sebelum pemulihan"}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"><X className="h-5 w-5" /></Button>
          </div>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-white scrollbar-thin">
            {!activePreviewTable ? (
              /* Summary View */
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Metadata Versi</span>
                    <p className="text-sm font-black text-slate-700">VERSION {backupContent?.version || "1.0"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu Backup</span>
                    <p className="text-sm font-black text-slate-700 uppercase">{backupContent ? format(new Date(backupContent.timestamp), "dd MMM yyyy", { locale: id }) : "-"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Kategori Tabel</TableHead>
                        <TableHead className="px-6 py-4 text-right font-black uppercase text-[10px] text-slate-400 tracking-widest">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backupContent?.data && Object.entries(backupContent.data).filter(([_, val]: any) => val && val.length > 0).map(([key, val]: any) => (
                        <TableRow key={key} className="hover:bg-blue-50/30 transition-all group">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{val.length} Records Found</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => setActivePreviewTable(key)} className="h-8 text-[8px] font-black uppercase rounded-lg border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                              <Eye className="h-3 w-3 mr-2" /> Detail Baris
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              /* Detailed Table View */
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <Button variant="ghost" onClick={() => setActivePreviewTable(null)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 p-0 h-auto">
                  <ArrowLeft className="h-3 w-3 mr-2" /> Kembali ke Ringkasan
                </Button>

                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-inner bg-slate-50/50">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100/50 border-b border-slate-200">
                          {backupContent.data[activePreviewTable][0] && Object.keys(backupContent.data[activePreviewTable][0])
                            .filter(col => col !== 'company_name')
                            .slice(0, 6)
                            .map((col) => (
                              <TableHead key={col} className="px-4 py-3 font-black text-[8px] text-slate-500 uppercase tracking-[0.2em]">{col.replace(/_/g, ' ')}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backupContent.data[activePreviewTable].slice(0, 5).map((row: any, i: number) => (
                          <TableRow key={i} className="bg-white border-b border-slate-50">
                            {Object.entries(row)
                              .filter(([key]) => key !== 'company_name')
                              .slice(0, 6)
                              .map(([_, val]: any, j: number) => (
                                <TableCell key={j} className="px-4 py-3 text-[9px] font-bold text-slate-600 truncate max-w-[150px]">
                                  {typeof val === 'object' ? JSON.stringify(val).substring(0, 20) + '...' : String(val)}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 text-center bg-white border-t border-slate-100">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">
                      Menampilkan 5 baris pertama dari total {backupContent.data[activePreviewTable].length} data dalam snapshot ini.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!activePreviewTable && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                  Peringatan: Menjalankan restorasi akan menghapus data yang ada saat ini secara permanen. Pastikan Anda benar-benar yakin.
                </p>
              </div>
            )}
          </div>

          {!activePreviewTable && (
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border-none hover:bg-slate-200 transition-all">Batalkan</Button>
              <Button onClick={() => setIsRestoreConfirmOpen(true)} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                Konfirmasi & Lanjutkan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COMPACT PROGRESS MODALS */}
      <Dialog open={isProgressOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-xs rounded-[2.5rem] border-none p-10 flex flex-col items-center text-center bg-white shadow-2xl">
          <DialogTitle className="sr-only">Processing Command</DialogTitle>
          <div className="relative h-32 w-32 mb-8"><div className="absolute inset-0 border-[6px] border-slate-50 rounded-full" /><svg className="h-32 w-32 -rotate-90"><circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500 transition-all duration-700" strokeDasharray={364} strokeDashoffset={364 - (364 * progress) / 100} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-3xl font-black text-slate-900 tracking-tighter">{progress}%</span></div></div><p className="text-[9px] font-black text-emerald-600 animate-pulse uppercase tracking-[0.2em]">{currentTask}</p></DialogContent></Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}><DialogContent className="sm:max-w-xs rounded-[2.5rem] border-none p-0 overflow-hidden bg-white shadow-2xl"><div className="bg-emerald-600 p-10 flex flex-col items-center text-white"><div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-lg font-black uppercase text-white">{successInfo.title}</DialogTitle>
          </div>
          <div className="p-8 text-center">
            <p className="text-slate-500 font-bold mb-6 text-[10px] uppercase leading-relaxed">{successInfo.description}</p>
            <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-11 bg-slate-950 text-white font-black uppercase text-[10px] rounded-xl transition-all active:scale-95">Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SECURITY ALERT DIALOGS */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setAdminPassword(""); }}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl sm:max-w-sm bg-white">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-center text-slate-900 uppercase">Clearance Required</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[9px] mt-2 leading-relaxed">Otorisasi diperlukan untuk penghapusan data secara permanen.</AlertDialogDescription></AlertDialogHeader><div className="py-6 space-y-4"><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-rose-500 transition-colors" /><Input type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(""); }} className="h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none font-black tracking-[0.3em] text-center" /></div>{passwordError && <p className="text-[8px] font-black text-rose-600 uppercase text-center animate-bounce">{passwordError}</p>}</div><AlertDialogFooter className="mt-2 gap-3"><AlertDialogCancel className="h-11 rounded-xl font-black text-[9px] uppercase flex-1 border-none bg-slate-100">Batal</AlertDialogCancel><Button onClick={handleCleanup} className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] flex-1 shadow-md active:scale-95 transition-all uppercase">Execute</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={(open) => { setIsRestoreConfirmOpen(open); if (!open) setAdminPassword(""); }}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl sm:max-w-sm bg-white">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
              <History className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-center text-slate-900 uppercase">Injection Code</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[9px] mt-2 leading-relaxed">Konfirmasi pemulihan seluruh data sistem.</AlertDialogDescription></AlertDialogHeader><div className="py-6 space-y-4"><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" /><Input type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(""); }} className="h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none font-black tracking-[0.3em] text-center" /></div>{passwordError && <p className="text-[8px] font-black text-rose-600 uppercase text-center animate-bounce">{passwordError}</p>}</div><AlertDialogFooter className="mt-2 gap-3"><AlertDialogCancel className="h-11 rounded-xl font-black text-[9px] uppercase flex-1 border-none bg-slate-100">Batal</AlertDialogCancel><Button onClick={handleRestore} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] flex-1 shadow-md active:scale-95 transition-all uppercase">Initialize</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <LoadingOverlay isOpen={loading && stats !== null} title="Synchronizing..." />
    </div>
  );
}

function StatMini({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5"><div className={cn("w-1.5 h-1.5 rounded-full", color)} /><span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest">{title}</span></div>
      <span className="text-lg font-black tracking-tight leading-none">{value || 0}</span>
    </div>
  );
}

function BackupItem({ title, icon: Icon, count, checked, onChange }: any) {
  return (
    <div onClick={() => onChange(!checked)} className={cn(
      "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 group", 
      checked ? "border-emerald-500 bg-emerald-50/30 shadow-sm" : "border-slate-50 bg-white hover:border-emerald-200"
    )}>
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all", checked ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-300")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <p className={cn("text-[10px] font-black uppercase tracking-tight leading-none", checked ? "text-emerald-900" : "text-slate-700")}>{title}</p>
        <span className={cn("text-[7px] font-black border-none px-0 uppercase", checked ? "text-emerald-600" : "text-slate-300")}>
          {count || 0} RECORDS
        </span>
      </div>
      <Checkbox checked={checked} className="h-4 w-4 rounded-md data-[state=checked]:bg-emerald-600 shadow-sm" />
    </div>
  );
}

function CleanupOption({ title, icon: Icon, count, checked, onChange }: { title: string, icon: any, count: number, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} className={cn(
      "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group", 
      checked ? "border-rose-500 bg-rose-50/30 shadow-sm" : "border-slate-50 bg-white hover:border-rose-200"
    )}>
      <div className="flex items-center gap-3 flex-1">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all", checked ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-300")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={cn("text-[10px] font-black uppercase tracking-tight leading-none", checked ? "text-rose-900" : "text-slate-700")}>{title}</span>
          <span className={cn("text-[7px] font-black border-none px-0 uppercase", checked ? "text-rose-500" : "text-slate-300")}>
            {count || 0} RECORDS
          </span>
        </div>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="h-4 w-4 rounded-md data-[state=checked]:bg-rose-600 shadow-sm" />
    </div>
  );
}
