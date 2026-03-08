"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getAnalystDashboard } from "@/lib/actions/analyst";
import { ChemicalLoader } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  FlaskConical,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Search,
  Bell,
  BellRing,
  Info,
  Activity,
  Beaker,
  ShieldCheck,
  History,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

export default function AnalystDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [search, setSearch] = useState("");
  const { notifications, stats, markAsRead } = useNotifications();

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await getAnalystDashboard();
      setDashboard(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Filter unread notifications
  const unreadNotifications = notifications.filter(n => !n.is_read).slice(0, 2);

  if (loading && !refreshing) {
    return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  }

  const statsCards = [
    {
      title: "SIAP ANALISIS",
      value: dashboard?.stats?.pending || 0,
      icon: Beaker,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Menunggu giliran uji"
    },
    {
      title: "AKTIF DI LAB",
      value: dashboard?.stats?.inProgress || 0,
      icon: FlaskConical,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      description: "Sedang proses ekstraksi/uji"
    },
    {
      title: "HASIL TERBIT",
      value: dashboard?.stats?.done || 0,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Menunggu verifikasi laporan"
    },
    {
      title: "TOTAL ORDER",
      value: dashboard?.stats?.total || 0,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Keseluruhan penugasan"
    }
  ];

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Premium with Glass Effect */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">Dashboard Lab</h1>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] ml-4 opacity-70">Laboratory Information Management System</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadDashboard(true)} 
            disabled={refreshing}
            className="rounded-2xl border-slate-100 bg-white shadow-sm h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> {refreshing ? "Sinkronisasi..." : "Refresh Data"}
          </Button>
          
          <div className="relative group">
            <div className={cn("p-3 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all", stats.unreadCount > 0 ? "text-amber-600 ring-4 ring-amber-50" : "text-slate-400")}>
              {stats.unreadCount > 0 ? <BellRing className="h-5 w-5 animate-bounce" /> : <Bell className="h-5 w-5" />}
              {stats.unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">{stats.unreadCount}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Task Alerts */}
      {unreadNotifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unreadNotifications.map((notif) => (
            <div key={notif.id} className="bg-emerald-950 text-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0"><AlertCircle className="h-6 w-6 text-emerald-400" /></div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">{notif.title}</h4>
                  <p className="text-[11px] text-emerald-50/70 font-medium leading-relaxed line-clamp-1">{notif.message}</p>
                  <Link href={notif.link || '#'} onClick={() => markAsRead(notif.id)} className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter mt-3 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-white hover:text-emerald-900 transition-all">Buka Analisis <ChevronRight className="h-3 w-3" /></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Section with Pulse Effect */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:translate-y-[-4px] transition-all bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{stat.value}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-1000", stat.color.replace('text', 'bg'))} style={{ width: `${Math.min((stat.value / (dashboard?.stats?.total || 1)) * 100, 100)}%` }} />
                </div>
                <span className="text-[8px] font-black text-slate-300">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analysis Queue */}
      <Card className="shadow-3xl shadow-slate-200/60 border-none rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 p-8 md:p-10 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-xl font-black text-emerald-950 uppercase tracking-tight">Antrean Pengujian Aktif</CardTitle>
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prioritas pengerjaan berdasarkan tanggal masuk</CardDescription>
          </div>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari kode atau klien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-inner rounded-2xl font-bold text-sm focus-visible:ring-emerald-500 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {dashboard?.recentJobs && dashboard.recentJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-slate-50/30 h-14">
                  <TableHead className="font-black text-[10px] uppercase text-slate-400 pl-10">Job Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-400 text-center">Workflow</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-400">Main Scope</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-400 text-right pr-10">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-50">
                {dashboard.recentJobs.filter((j: any) => 
                  j.tracking_code.toLowerCase().includes(search.toLowerCase()) || 
                  j.quotation?.profile?.company_name?.toLowerCase().includes(search.toLowerCase())
                ).map((job: any) => {
                  const statusColors: any = {
                    scheduled: "bg-slate-100 text-slate-400",
                    sampling: "bg-amber-100 text-amber-600",
                    analysis_ready: "bg-blue-100 text-blue-600",
                    analysis: "bg-violet-100 text-violet-600",
                    analysis_done: "bg-indigo-100 text-indigo-600",
                    reporting: "bg-cyan-100 text-cyan-600",
                    completed: "bg-emerald-100 text-emerald-600"
                  };

                  const statusLabels: any = {
                    scheduled: "ANTREAN",
                    sampling: "SAMPLING",
                    analysis_ready: "SIAP UJI",
                    analysis: "ANALISIS",
                    analysis_done: "HASIL TERBIT",
                    reporting: "PELAPORAN",
                    completed: "SELESAI"
                  };

                  return (
                    <TableRow key={job.id} className="group hover:bg-emerald-50/30 transition-all border-none">
                      <TableCell className="pl-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-mono text-[10px] font-black text-slate-400 group-hover:bg-white transition-colors uppercase">
                            JO
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{job.tracking_code}</span>
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="font-black text-slate-800 text-sm uppercase leading-none">{job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 gap-3 group-hover:bg-white transition-colors">
                           <Badge className={cn("border-none font-black text-[8px] uppercase px-3 py-1 rounded-full shadow-sm", statusColors[job.status] || "bg-slate-100 text-slate-700")}>
                             {statusLabels[job.status] || job.status}
                           </Badge>
                           <div className="flex items-center gap-1">
                              <div className={cn("h-1 w-3 rounded-full", job.status !== 'scheduled' ? "bg-emerald-500" : "bg-slate-200")} />
                              <div className={cn("h-1 w-3 rounded-full", ['analysis', 'analysis_done', 'reporting', 'completed'].includes(job.status) ? "bg-emerald-500" : "bg-slate-200")} />
                              <div className={cn("h-1 w-3 rounded-full", job.status === 'completed' ? "bg-emerald-500" : "bg-slate-200")} />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <FlaskConical className="h-3.5 w-3.5 text-slate-300" />
                           <div className="text-[10px] font-black text-slate-500 truncate max-w-[180px] uppercase">
                             {job.quotation?.items?.[0]?.service?.name || "Layanan Kustom"}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Link href={`/analyst/jobs/${job.id}`}>
                          <Button size="sm" className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 gap-3 group/btn">
                            Proceed <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-32 bg-slate-50/20">
              <div className="h-24 w-24 rounded-[2rem] bg-white flex items-center justify-center mx-auto mb-6 shadow-2xl border border-slate-100 relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-[2rem] animate-ping group-hover:animate-none" />
                <Beaker className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Pending Analysis</h3>
              <p className="text-[9px] font-bold text-slate-300 mt-3 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">System is synchronized. New tasks will appear after field sampling.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
