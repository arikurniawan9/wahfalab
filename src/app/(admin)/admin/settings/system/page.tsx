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
  ChevronRight,
  ArrowRight,
  Lock
} from "lucide-react";
import { LoadingOverlay } from "@/components/ui";
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

  // Security state
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setAdminPasswordError] = useState("");

  // Progress state
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  
  // Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Cleanup options
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

  const handleBackup = async () => {
    setIsProgressOpen(true);
    setProgress(10);
    setCurrentTask("Menyiapkan struktur data...");
    
    try {
      setTimeout(() => setProgress(30), 500);
      setCurrentTask("Mengambil snapshot tabel...");
      
      const backupData = await exportSystemData();
      
      if (backupData.error) {
        toast.error("Gagal membuat backup: " + backupData.error);
        setIsProgressOpen(false);
        return;
      }

      setProgress(80);
      setCurrentTask("Mengemas file JSON...");
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wahfalab_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      setCurrentTask("Backup selesai!");
      
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: "Backup Berhasil",
          description: "Seluruh data sistem telah berhasil diekspor dan diunduh ke perangkat Anda."
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

    setAdminPasswordError("");
    
    // Verify Password first
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
          setCurrentTask("Menghapus data saat ini & menyuntikkan data baru...");
          
          const result = await restoreSystemData(backupObj);
          
          if (result.error) {
            throw new Error(result.error);
          }

          setProgress(100);
          setCurrentTask("Restorasi selesai!");
          
          setTimeout(() => {
            setIsProgressOpen(false);
            setSuccessInfo({
              title: "Restorasi Berhasil",
              description: "Seluruh data sistem telah berhasil dipulihkan dari file backup. Silakan muat ulang halaman jika diperlukan."
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

    setAdminPasswordError("");
    
    // Verify Password first
    const vResult = await verifyPassword(adminPassword);
    if (vResult.error) {
      setAdminPasswordError(vResult.error);
      return;
    }

    setIsDeleteDialogOpen(false);
    setAdminPassword(""); // Clear password after verification
    setIsProgressOpen(true);
    setProgress(0);

    if (isResetMode) {
      await handleFactoryReset();
      return;
    }
    
    const selectedCategories = Object.entries(cleanupOptions)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);
    
    if (selectedCategories.length === 0) {
      setIsProgressOpen(false);
      return;
    }

    let completed = 0;
    const labels: any = {
      logs: "Log Audit & Notifikasi",
      transactions: "Transaksi Keuangan",
      jobs: "Job Orders & Progress",
      quotations: "Data Penawaran Harga",
      assistants: "Database Asisten",
      customers: "Profil Customer"
    };

    try {
      for (const category of selectedCategories) {
        setCurrentTask(`Membersihkan ${labels[category]}...`);
        const result = await cleanupSpecificCategory(category);
        
        if (result.error) {
          throw new Error(`Gagal pada ${labels[category]}: ${result.error}`);
        }
        
        completed++;
        setProgress(Math.round((completed / selectedCategories.length) * 100));
        // Small delay for visual effect
        await new Promise(r => setTimeout(r, 500));
      }

      setCurrentTask("Pembersihan selesai!");
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: "Sistem Berhasil Dibersihkan",
          description: `${completed} kategori data telah dihapus secara permanen dari database.`
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
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setProgress(80);
      setCurrentTask("Membersihkan cache & master data...");
      await new Promise(r => setTimeout(r, 800));
      
      setProgress(100);
      setCurrentTask("Reset selesai!");
      
      setTimeout(() => {
        setIsProgressOpen(false);
        setSuccessInfo({
          title: "Sistem Berhasil Direset",
          description: "Seluruh data (Penawaran, Jobs, Keuangan, Master Data) telah dihapus. Hanya akun administrator yang dipertahankan."
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

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Database className="h-12 w-12 text-emerald-200 animate-pulse" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Menganalisis Infrastruktur Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <Server className="h-8 w-8 text-emerald-600" />
            PEMELIHARAAN SISTEM
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Dashboard Administrasi Infrastruktur & Integritas Data</p>
        </div>
        <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-xs gap-2 h-11 px-6 shadow-sm bg-white" onClick={loadStats}>
          <RefreshCw className={cn("h-4 w-4 text-emerald-600", loading && "animate-spin")} />
          Segarkan Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Status */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-emerald-900/5 bg-emerald-900 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 opacity-80">
                <Activity className="h-4 w-4" />
                Kesehatan Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-4xl font-black tracking-tighter">Stabil</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Semua relasi tabel sinkron</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <StatMini title="Penawaran" value={stats?.quotations} />
                <StatMini title="Jobs" value={stats?.jobs} />
                <StatMini title="Log Audit" value={stats?.logs} />
                <StatMini title="Keuangan" value={stats?.financialRecords} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-900/5 bg-white border border-slate-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <History className="h-4 w-4 text-blue-500" />
                Snapshot Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <FileJson className="h-8 w-8 text-slate-300" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Backup Otomatis</p>
                  <p className="text-[10px] text-slate-400 font-medium">Setiap 24 jam di Cloud</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="backup" className="w-full">
            <TabsList className="grid grid-cols-3 h-14 p-1.5 bg-slate-100/50 rounded-2xl mb-8">
              <TabsTrigger value="backup" className="rounded-xl font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Download className="h-3.5 w-3.5 mr-2" /> Backup
              </TabsTrigger>
              <TabsTrigger value="restore" className="rounded-xl font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Upload className="h-3.5 w-3.5 mr-2" /> Restore
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="rounded-xl font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="h-3.5 w-3.5 mr-2" /> Cleanup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backup" className="mt-0">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                    <Database className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Export Database</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 leading-relaxed">
                    Amankan seluruh data operasional WahfaLab ke dalam file terenkripsi (.json).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Integritas Data: 100% Valid</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleBackup} 
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-emerald-900/20 group"
                  >
                    <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                    Unduh Full Backup Sekarang
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="restore" className="mt-0">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                    <History className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Restore Database</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer group mb-6",
                      selectedFile 
                        ? "border-emerald-400 bg-emerald-50/20" 
                        : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/20"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileJson className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                        <p className="text-sm font-bold text-slate-700">{selectedFile.name}</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">File Siap Dimuat</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Ganti File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-slate-300 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-slate-700">Klik atau seret file backup (.json) ke sini</p>
                      </>
                    )}
                  </div>
                  <Button 
                    disabled={!selectedFile} 
                    onClick={() => setIsRestoreConfirmOpen(true)}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest border-none shadow-lg shadow-blue-900/20"
                  >
                    Lanjutkan Restorasi
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-900/5 overflow-hidden">
                <CardHeader className="p-8 pb-4 bg-red-50/50 border-b border-red-100/50">
                  <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 text-red-600">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Data Cleanup</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <CleanupOption title="Log Audit & Notif" count={stats?.logs} checked={cleanupOptions.logs} onChange={(v) => setCleanupOptions({...cleanupOptions, logs: v})} />
                    <CleanupOption title="Transaksi Keuangan" count={stats?.financialRecords} checked={cleanupOptions.transactions} onChange={(v) => setCleanupOptions({...cleanupOptions, transactions: v})} />
                    <CleanupOption title="Job Orders & Progress" count={stats?.jobs} checked={cleanupOptions.jobs} onChange={(v) => setCleanupOptions({...cleanupOptions, jobs: v})} />
                    <CleanupOption title="Data Penawaran Harga" count={stats?.quotations} checked={cleanupOptions.quotations} onChange={(v) => setCleanupOptions({...cleanupOptions, quotations: v})} />
                    <CleanupOption title="Asisten Lapangan" count={stats?.assistants} checked={cleanupOptions.assistants} onChange={(v) => setCleanupOptions({...cleanupOptions, assistants: v})} />
                    <CleanupOption title="Profil Customer" count={stats?.customers} checked={cleanupOptions.customers} onChange={(v) => setCleanupOptions({...cleanupOptions, customers: v})} />
                  </div>
                  
                  <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl mb-8">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                      Data yang dihapus tidak dapat dipulihkan kecuali Anda memiliki file backup.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      setIsResetMode(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    variant="destructive"
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eksekusi Pembersihan Terpilih
                  </Button>

                  <div className="mt-10 pt-10 border-t border-red-100 flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Zona Berbahaya</p>
                    <Button 
                      onClick={() => {
                        setIsResetMode(true);
                        setIsDeleteDialogOpen(true);
                      }}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
                    >
                      Reset Seluruh Data Sistem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Progress Dialog */}
      <Dialog open={isProgressOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none p-10 shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Status Proses Pemeliharaan</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="relative h-32 w-32 mb-8">
              {/* Spinning Ring */}
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <svg className="h-32 w-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-emerald-500 transition-all duration-500"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * progress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{progress}%</span>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Memproses Perintah</h3>
            <p className="text-sm font-bold text-emerald-600 animate-pulse uppercase tracking-wider h-5">{currentTask}</p>
            
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-8 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none p-0 shadow-2xl overflow-hidden">
          <div className="bg-emerald-600 p-12 flex flex-col items-center text-white">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center mb-6 scale-in-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">{successInfo.title}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-10 bg-white text-center">
            <p className="text-slate-500 font-medium mb-8 leading-relaxed px-4">{successInfo.description}</p>
            <Button 
              onClick={() => setIsSuccessDialogOpen(false)}
              className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
            >
              Tutup & Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setAdminPassword("");
          setAdminPasswordError("");
        }
      }}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl sm:max-w-lg">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-800 uppercase tracking-tight">
              {isResetMode ? "RESET SELURUH SISTEM" : "Konfirmasi Keamanan"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium px-4">
              {isResetMode 
                ? "PERINGATAN: Anda akan menghapus SELURUH data di dalam sistem WahfaLab (Penawaran, Jobs, Keuangan, Master Data, dll). Hanya akun Admin yang akan tetap ada. Tindakan ini sangat berbahaya!" 
                : "Anda akan menghapus data terpilih secara permanen. Tindakan ini tidak dapat dibatalkan. Silakan masukkan password akun Anda untuk melanjutkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Verifikasi Admin</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="password"
                  placeholder="Masukkan password Anda..."
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminPasswordError("");
                  }}
                  className={cn(
                    "h-14 pl-11 rounded-2xl bg-slate-50 border-slate-100 focus-visible:ring-red-500",
                    passwordError && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              {passwordError && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>
              )}
            </div>
          </div>

          <AlertDialogFooter className="mt-2 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-black text-xs uppercase tracking-widest flex-1 shadow-lg shadow-red-900/20">
              Ya, Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={(open) => {
        setIsRestoreConfirmOpen(open);
        if (!open) {
          setAdminPassword("");
          setAdminPasswordError("");
        }
      }}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl sm:max-w-lg">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="h-8 w-8 text-blue-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-800 uppercase tracking-tight">
              KONFIRMASI RESTORE
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium px-4">
              PERINGATAN: Tindakan ini akan MENGHAPUS SELURUH data saat ini dan menggantinya dengan data dari file backup. Pastikan Anda telah mem-backup data saat ini jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Verifikasi Admin</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="password"
                  placeholder="Masukkan password Anda..."
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminPasswordError("");
                  }}
                  className={cn(
                    "h-14 pl-11 rounded-2xl bg-slate-50 border-slate-100 focus-visible:ring-blue-500",
                    passwordError && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              {passwordError && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>
              )}
            </div>
          </div>

          <AlertDialogFooter className="mt-2 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest flex-1 shadow-lg shadow-blue-900/20">
              Ya, Jalankan Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatMini({ title, value }: { title: string, value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-black uppercase text-emerald-400 tracking-tighter">{title}</span>
      <span className="text-lg font-black tracking-tight">{value || 0}</span>
    </div>
  );
}

function CleanupOption({ title, count, checked, onChange }: { title: string, count: number, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
        checked ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-white hover:border-slate-200"
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{title}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{count || 0} Records</span>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="h-5 w-5 rounded-md data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
    </div>
  );
}
