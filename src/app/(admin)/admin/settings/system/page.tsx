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
  Keyboard
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { 
  getSystemStats, 
  exportSystemData, 
  cleanupSpecificCategory, 
  factoryReset,
  restoreSystemData
} from "@/lib/actions/system";
import { verifyPassword } from "@/lib/actions/auth";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SystemMaintenancePage() {
  const [stats, setStats] = useState<any>(null);
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [backupOptions, setBackupOptions] = useState<Record<string, boolean>>({
    users: true,
    quotations: true,
    jobs: true,
    finance: true,
    master: true,
    system: true,
  });

  const [cleanupOptions, setCleanupOptions] = useState({
    logs: true,
    transactions: false,
    jobs: false,
    quotations: false,
    assistants: false,
    customers: false,
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getSystemStats();
      setStats(data);
    } catch (error) {
      toast.error("Gagal memuat statistik sistem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleBackup = async (isFull: boolean = false) => {
    const selectedCategories = isFull 
      ? ['all'] 
      : Object.entries(backupOptions).filter(([_, v]) => v).map(([k]) => k);

    if (!isFull && selectedCategories.length === 0) {
      toast.error("Pilih minimal satu kategori untuk backup");
      return;
    }

    setIsProgressOpen(true);
    setProgress(10);
    setCurrentTask("Menyiapkan struktur data...");
    
    try {
      setTimeout(() => setProgress(30), 500);
      setCurrentTask("Mengambil snapshot tabel...");
      
      const backupData = await exportSystemData(isFull ? undefined : selectedCategories);
      
      if (backupData.error) {
        toast.error("Gagal membuat backup: " + backupData.error);
        setIsProgressOpen(false);
        return;
      }

      setProgress(80);
      setCurrentTask("Mengemas file JSON...");
      
      const typeLabel = isFull ? "FULL" : "PARTIAL";
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wahfalab_${typeLabel.toLowerCase()}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      setCurrentTask("Backup selesai!");
      
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: `Backup ${typeLabel} Berhasil`,
          description: `Data ${isFull ? "seluruh sistem" : selectedCategories.length + " kategori terpilih"} telah berhasil diekspor.`
        });
        setIsSuccessDialogOpen(true);
      }, 800);
      
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses backup");
      setIsProgressOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!adminPassword) {
      setAdminPasswordError("Password wajib diisi untuk verifikasi keamanan");
      return;
    }
    if (!selectedFile) return;
    const vResult = await verifyPassword(adminPassword);
    if (vResult.error) {
      setAdminPasswordError(vResult.error);
      return;
    }
    setIsRestoreConfirmOpen(false);
    setAdminPassword("");
    setIsProgressOpen(true);
    setProgress(10);
    setCurrentTask("Membaca file backup...");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backupObj = JSON.parse(content);
          setProgress(30);
          setCurrentTask("Menganalisis integritas data...");
          if (!backupObj.data || !backupObj.version) {
            throw new Error("Format file backup tidak valid");
          }
          setProgress(50);
          setCurrentTask("Sinkronisasi database...");
          const result = await restoreSystemData(backupObj);
          if (result.error) throw new Error(result.error);
          setProgress(100);
          setCurrentTask("Restorasi selesai!");
          setTimeout(() => {
            setIsProgressOpen(false);
            setSuccessInfo({
              title: "Restorasi Berhasil",
              description: "Seluruh data sistem telah berhasil dipulihkan dari file backup."
            });
            setIsSuccessDialogOpen(true);
            setSelectedFile(null);
            loadStats();
          }, 800);
        } catch (error: any) {
          toast.error("Gagal merestore data: " + error.message);
          setIsProgressOpen(false);
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses file");
      setIsProgressOpen(false);
    }
  };

  const handleCleanup = async () => {
    if (!adminPassword) {
      setAdminPasswordError("Password wajib diisi untuk verifikasi keamanan");
      return;
    }
    const vResult = await verifyPassword(adminPassword);
    if (vResult.error) {
      setAdminPasswordError(vResult.error);
      return;
    }
    setIsDeleteDialogOpen(false);
    setAdminPassword("");
    setIsProgressOpen(true);
    setProgress(0);
    if (isResetMode) {
      await handleFactoryReset();
      return;
    }
    const selectedCategories = Object.entries(cleanupOptions).filter(([_, checked]) => checked).map(([key]) => key);
    if (selectedCategories.length === 0) {
      setIsProgressOpen(false);
      return;
    }
    let completed = 0;
    const labels: any = { logs: "Log Audit", transactions: "Keuangan", jobs: "Job Orders", quotations: "Penawaran", assistants: "Asisten", customers: "Customer" };
    try {
      for (const category of selectedCategories) {
        setCurrentTask(`Membersihkan ${labels[category]}...`);
        const result = await cleanupSpecificCategory(category);
        if (result.error) throw new Error(`Gagal pada ${labels[category]}: ${result.error}`);
        completed++;
        setProgress(Math.round((completed / selectedCategories.length) * 100));
        await new Promise(r => setTimeout(r, 500));
      }
      setCurrentTask("Pembersihan selesai!");
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: "Sistem Dibersihkan",
          description: `${completed} kategori data telah dihapus.`
        });
        setIsSuccessDialogOpen(true);
        loadStats();
      }, 800);
    } catch (error: any) {
      toast.error(error.message);
      setIsProgressOpen(false);
    }
  };

  const handleFactoryReset = async () => {
    setCurrentTask("Menganalisis dependensi...");
    setProgress(10);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setProgress(30);
      setCurrentTask("Menghapus seluruh data operasional...");
      const result = await factoryReset();
      if (result.error) throw new Error(result.error);
      setProgress(80);
      setCurrentTask("Membersihkan cache...");
      await new Promise(r => setTimeout(r, 800));
      setProgress(100);
      setCurrentTask("Reset selesai!");
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: "Sistem Berhasil Direset",
          description: "Seluruh data telah dihapus. Hanya akun administrator yang dipertahankan."
        });
        setIsSuccessDialogOpen(true);
        setIsResetMode(false);
        loadStats();
      }, 800);
    } catch (error: any) {
      toast.error(error.message);
      setIsProgressOpen(false);
      setIsResetMode(false);
    }
  };

  const toggleAllBackup = (val: boolean) => {
    const newOptions = { ...backupOptions };
    Object.keys(newOptions).forEach(k => newOptions[k] = val);
    setBackupOptions(newOptions);
  };

  const isAllBackupSelected = Object.values(backupOptions).every(v => v);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Database className="h-12 w-12 text-emerald-200 animate-pulse" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Menganalisis Infrastruktur Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <Server className="h-8 w-8 text-emerald-600" />
            SISTEM & MAINTENANCE
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Administrasi Infrastruktur & Integritas Data</p>
        </div>
        <Button variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2 h-11 px-6 shadow-sm bg-white" onClick={loadStats}>
          <RefreshCw className={cn("h-4 w-4 text-emerald-600", loading && "animate-spin")} />
          Segarkan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Status */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-xl shadow-emerald-900/5 bg-emerald-900 text-white overflow-hidden group">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                <Activity className="h-4 w-4" /> Database Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left">Stabil</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Infrastruktur Sinkron</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <StatMini title="Penawaran" value={stats?.quotations} />
                <StatMini title="Pekerjaan" value={stats?.jobs} />
                <StatMini title="Log Audit" value={stats?.logs} />
                <StatMini title="Keuangan" value={stats?.financialRecords} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-xl shadow-slate-900/5 bg-white border border-slate-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <History className="h-4 w-4 text-blue-500" /> Snapshot Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <FileJson className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-700 uppercase">Auto Backup</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Setiap 24 Jam</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="backup" className="w-full">
            <TabsList className="grid grid-cols-3 h-14 p-1 bg-slate-100 rounded-2xl mb-8">
              <TabsTrigger value="backup" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all">
                <Download className="h-3.5 w-3.5 mr-2" /> Backup
              </TabsTrigger>
              <TabsTrigger value="restore" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all">
                <Upload className="h-3.5 w-3.5 mr-2" /> Restore
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-md transition-all">
                <Settings className="h-3.5 w-3.5 mr-2" /> Cleanup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backup" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden bg-white">
                <CardHeader className="p-8 pb-6 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Export Data</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih kategori data yang ingin diamankan</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                      <Archive className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <BackupItem icon={UserCheck} title="Pengguna & Akun" desc="Profil, Bank, Role" checked={backupOptions.users} onChange={(v: boolean) => setBackupOptions({...backupOptions, users: v})} />
                    <BackupItem icon={FileBox} title="Komersial" desc="Penawaran, Items" checked={backupOptions.quotations} onChange={(v: boolean) => setBackupOptions({...backupOptions, quotations: v})} />
                    <BackupItem icon={Layers} title="Operasional" desc="Job Orders, Progress" checked={backupOptions.jobs} onChange={(v: boolean) => setBackupOptions({...backupOptions, jobs: v})} />
                    <BackupItem icon={Banknote} title="Keuangan" desc="Invoice, Payment" checked={backupOptions.finance} onChange={(v: boolean) => setBackupOptions({...backupOptions, finance: v})} />
                    <BackupItem icon={ClipboardList} title="Master Data" desc="Services, Catalog" checked={backupOptions.master} onChange={(v: boolean) => setBackupOptions({...backupOptions, master: v})} />
                    <BackupItem icon={Activity} title="Log & Sistem" desc="Audit, Notifikasi" checked={backupOptions.system} onChange={(v: boolean) => setBackupOptions({...backupOptions, system: v})} />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => toggleAllBackup(!isAllBackupSelected)}
                      className="h-14 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest px-8"
                    >
                      {isAllBackupSelected ? "Batal Pilih Semua" : "Pilih Semua Data"}
                    </Button>
                    <LoadingButton 
                      onClick={() => handleBackup(isAllBackupSelected)} 
                      className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-900/20 group"
                    >
                      <Download className="h-4 w-4 mr-3 group-hover:translate-y-0.5 transition-transform" />
                      {isAllBackupSelected ? "Download Full Backup" : "Download Backup Terpilih"}
                    </LoadingButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="restore" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden bg-white">
                <CardHeader className="p-8 pb-6 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Restore Sistem</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kembalikan data dari file cadangan (.json)</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                      <RefreshCw className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-10">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                  <div 
                    className={cn(
                      "border-4 border-dashed rounded-[3rem] p-16 text-center transition-all cursor-pointer group mb-10",
                      selectedFile ? "border-emerald-400 bg-emerald-50/20" : "border-slate-100 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/20"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-2 animate-in zoom-in duration-300">
                        <FileJson className="h-16 w-16 text-emerald-500 mx-auto mb-4 drop-shadow-lg" />
                        <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedFile.name}</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Snapshot Siap Disuntikkan</p>
                        <Button variant="ghost" size="sm" className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase mt-6 tracking-widest"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                          Ganti File Backup
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                          <Upload className="h-10 w-10 text-slate-200" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Klik untuk pilih file backup</p>
                      </>
                    )}
                  </div>
                  <Button disabled={!selectedFile} onClick={() => setIsRestoreConfirmOpen(true)}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                    Jalankan Pemulihan Data
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden bg-white">
                <CardHeader className="p-8 pb-6 bg-rose-50/50 border-b border-rose-100">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight text-rose-900">Data Cleanup</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Hapus kategori data tertentu secara permanen</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                      <Trash2 className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <CleanupOption title="Log Audit & Notif" count={stats?.logs} checked={cleanupOptions.logs} onChange={(v) => setCleanupOptions({...cleanupOptions, logs: v})} />
                    <CleanupOption title="Transaksi Keuangan" count={stats?.financialRecords} checked={cleanupOptions.transactions} onChange={(v) => setCleanupOptions({...cleanupOptions, transactions: v})} />
                    <CleanupOption title="Job Orders & Progress" count={stats?.jobs} checked={cleanupOptions.jobs} onChange={(v) => setCleanupOptions({...cleanupOptions, jobs: v})} />
                    <CleanupOption title="Data Penawaran Harga" count={stats?.quotations} checked={cleanupOptions.quotations} onChange={(v) => setCleanupOptions({...cleanupOptions, quotations: v})} />
                    <CleanupOption title="Asisten Lapangan" count={stats?.assistants} checked={cleanupOptions.assistants} onChange={(v) => setCleanupOptions({...cleanupOptions, assistants: v})} />
                    <CleanupOption title="Profil Customer" count={stats?.customers} checked={cleanupOptions.customers} onChange={(v) => setCleanupOptions({...cleanupOptions, customers: v})} />
                  </div>
                  
                  <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 mb-10">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                      Data yang dihapus tidak dapat dipulihkan kembali. Pastikan Anda memiliki cadangan data.
                    </p>
                  </div>

                  <Button onClick={() => { setIsResetMode(false); setIsDeleteDialogOpen(true); }} variant="destructive"
                    className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-900/20 active:scale-95 transition-all">
                    Eksekusi Penghapusan
                  </Button>

                  <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 italic">Advanced Factory Reset</span>
                    <Button onClick={() => { setIsResetMode(true); setIsDeleteDialogOpen(true); }} variant="outline"
                      className="border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 font-black uppercase text-[10px] tracking-widest h-11 px-10 rounded-2xl transition-all">
                      Reset Seluruh Data Sistem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isProgressOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-[3rem] border-none p-12 shadow-2xl overflow-hidden flex flex-col items-center text-center">
          <div className="relative h-40 w-40 mb-10">
            <div className="absolute inset-0 border-[6px] border-slate-50 rounded-full" />
            <svg className="h-40 w-40 -rotate-90">
              <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-emerald-500 transition-all duration-700" strokeDasharray={465} strokeDashoffset={465 - (465 * progress) / 100} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black text-slate-900 tracking-tighter">{progress}%</span></div>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Memproses Perintah</h3>
          <p className="text-[10px] font-black text-emerald-600 animate-pulse uppercase tracking-[0.2em]">{currentTask}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] border-none p-0 shadow-2xl overflow-hidden">
          <div className="bg-emerald-600 p-12 flex flex-col items-center text-white">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center mb-6"><CheckCircle2 className="h-10 w-10" /></div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">{successInfo.title}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-10 bg-white text-center">
            <p className="text-slate-500 font-medium mb-8 leading-relaxed px-4">{successInfo.description}</p>
            <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) { setAdminPassword(""); setAdminPasswordError(""); } }}>
        <AlertDialogContent className="rounded-[3rem] border-none p-12 shadow-2xl sm:max-w-lg">
          <AlertDialogHeader>
            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><ShieldAlert className="h-10 w-10" /></div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 uppercase tracking-tight">{isResetMode ? "RESET SISTEM" : "VERIFIKASI KEAMANAN"}</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium px-4 py-4">{isResetMode ? "Anda akan menghapus SELURUH data operasional WahfaLab. Tindakan ini tidak dapat dibatalkan!" : "Anda akan menghapus data terpilih secara permanen. Silakan masukkan password admin untuk konfirmasi."}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-6 space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Konfirmasi Password Admin</Label>
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" /><Input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(""); }} className={cn("h-14 pl-12 rounded-2xl bg-slate-50 border-none shadow-inner font-bold focus-visible:ring-rose-500", passwordError && "ring-2 ring-rose-500")} /></div>
            {passwordError && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{passwordError}</p>}
          </div>
          <AlertDialogFooter className="mt-4 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex-1 border-none bg-slate-50">Batal</AlertDialogCancel>
            <Button onClick={handleCleanup} className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-xs uppercase tracking-widest flex-1 shadow-xl shadow-rose-900/20">YA, EKSEKUSI</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={(open) => { setIsRestoreConfirmOpen(open); if (!open) { setAdminPassword(""); setAdminPasswordError(""); } }}>
        <AlertDialogContent className="rounded-[3rem] border-none p-12 shadow-2xl sm:max-w-lg">
          <AlertDialogHeader>
            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><History className="h-10 w-10" /></div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 uppercase tracking-tight">PEMULIHAN DATA</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium px-4 py-4">Tindakan ini akan MENGGANTI SELURUH data saat ini dengan data dari file backup. Pastikan file backup sudah benar.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-6 space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Konfirmasi Password Admin</Label>
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" /><Input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(""); }} className={cn("h-14 pl-12 rounded-2xl bg-slate-50 border-none shadow-inner font-bold focus-visible:ring-blue-500", passwordError && "ring-2 ring-rose-500")} /></div>
            {passwordError && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{passwordError}</p>}
          </div>
          <AlertDialogFooter className="mt-4 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex-1 border-none bg-slate-50">Batal</AlertDialogCancel>
            <Button onClick={handleRestore} className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest flex-1 shadow-xl shadow-blue-900/20">YA, RESTORE DATA</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={loading && stats !== null} title="Sinkronisasi Infrastruktur..." />
    </div>
  );
}

function StatMini({ title, value }: { title: string, value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">{title}</span>
      <span className="text-xl font-black tracking-tight">{value || 0}</span>
    </div>
  );
}

function BackupItem({ icon: Icon, title, desc, checked, onChange }: any) {
  return (
    <div onClick={() => onChange(!checked)} className={cn("p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group", checked ? "border-emerald-500 bg-emerald-50/30" : "border-slate-50 bg-white hover:border-emerald-200")}>
      <div className="flex items-center gap-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", checked ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-300")}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{title}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{desc}</p>
        </div>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="h-5 w-5 rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
    </div>
  );
}

function CleanupOption({ title, count, checked, onChange }: { title: string, count: number, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group", checked ? "border-rose-500 bg-rose-50/30" : "border-slate-50 bg-white hover:border-rose-200")}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{title}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{count || 0} Records</span>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="h-5 w-5 rounded-md data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600" />
    </div>
  );
}
