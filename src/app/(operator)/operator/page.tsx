// ============================================================================
// PREMIUM OPERATOR DASHBOARD - v3.0
// Designed for maximum productivity and clear operational visibility.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ArrowRight,
  Search,
  FlaskConical,
  Calendar,
  User,
  AlertCircle,
  TrendingUp,
  LayoutGrid,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { ChemicalLoader } from "@/components/ui";
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { statusConfig } from "@/components/operator/dashboard/constants";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";
import { OperatorDashboardHeader } from "@/components/operator/dashboard/OperatorDashboardHeader";
import { OperatorStatsFilters } from "@/components/operator/dashboard/OperatorStatsFilters";
import { JobDetailModal } from "@/components/operator/dashboard/modals/JobDetailModal";
import { ServicesListModal } from "@/components/operator/dashboard/modals/ServicesListModal";
import { CategoriesListModal } from "@/components/operator/dashboard/modals/CategoriesListModal";
import { QuickQuotationModal } from "@/components/operator/dashboard/modals/QuickQuotationModal";

export default function OperatorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const [companyName, setCompanyName] = useState("Perusahaan");
  const SERVICE_PER_PAGE = 5;

  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    scheduled: 0,
    sampling: 0,
    analysis: 0,
    reporting: 0,
    completed: 0,
    total: 0,
    stuck: 0
  });

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData, servicesData, categoriesData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 50),
        getAllServices(),
        getAllCategories()
      ]);

      setProfile(prof);
      setJobs(jobsData.items || []);
      setServices(servicesData);
      setCategories(categoriesData);

      // Calculate stats
      const jobList = jobsData.items || [];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const stuckJobs = jobList.filter((j: any) =>
        j.status !== 'completed' && new Date(j.created_at) < threeDaysAgo
      );

      setStats({
        scheduled: jobList.filter((j: any) => j.status === 'scheduled').length,
        sampling: jobList.filter((j: any) => j.status === 'sampling').length,
        analysis: jobList.filter((j: any) => j.status === 'analysis').length,
        reporting: jobList.filter((j: any) => j.status === 'reporting').length,
        completed: jobList.filter((j: any) => j.status === 'completed').length,
        total: jobList.length,
        stuck: stuckJobs.length
      });

      if (showRefreshToast) {
        toast.success("Dashboard Terkini", {
          description: "Data pekerjaan dan riwayat aktivitas telah diperbarui."
        });
      }
    } catch (error: any) {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch("/api/company-profile");
        const data = await response.json();
        setCompanyName(data?.company_name?.trim() || "Perusahaan");
      } catch {
        setCompanyName("Perusahaan");
      }
    }

    fetchCompanyProfile();
  }, []);

  // Filter & Search
  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === "" ||
      job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const recentJobs = filteredJobs.slice(0, 8);
  const operatorName = profile?.full_name?.trim() || "Operator";

  if (loading) {
    return <ChemicalLoader fullScreen />;
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 space-y-10">
      <OperatorDashboardHeader
        operatorName={operatorName}
        stuckCount={stats.stuck}
        refreshing={refreshing}
        onRefresh={() => loadData(true)}
      />

      <OperatorStatsFilters
        stats={stats}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Jobs Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Antrean Aktif</h2>
            </div>
            <Link href="/operator/jobs">
              <Button variant="link" className="text-emerald-600 font-bold text-xs uppercase tracking-widest hover:no-underline flex items-center gap-1 group">
                Semua Pekerjaan <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Search & Mini Filter Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              placeholder="Cari kode tracking, klien, atau jenis layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-emerald-500 transition-all text-sm font-medium outline-none focus:border-emerald-500 border-2"
            />
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-10 w-10 text-slate-200" />
                </div>
                <h4 className="font-bold text-slate-700 uppercase text-sm tracking-widest">{OPERATOR_EMPTY_TEXT.dataNotFoundCaps}</h4>
                <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci atau filter Anda.</p>
              </div>
            ) : (
              recentJobs.map((job: any) => {
                const config = statusConfig[job.status] || statusConfig.scheduled;
                const StatusIcon = config.icon;
                const isStuck = job.status !== 'completed' && new Date(job.created_at) < (new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
                
                return (
                  <Card 
                    key={job.id} 
                    className={cn(
                      "group border-none shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 rounded-[1.5rem] overflow-hidden cursor-pointer",
                      isStuck && "ring-2 ring-rose-100 bg-rose-50/10"
                    )}
                    onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Status Side Indicator */}
                        <div className={cn("w-2 shrink-0 transition-all duration-300", isStuck ? "bg-rose-500" : config.color.replace('text', 'bg'))} />
                        
                        <div className="p-4 flex-1 space-y-3.5">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-mono text-xs font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                  isStuck ? "text-rose-700 bg-rose-100" : "text-emerald-700 bg-emerald-100"
                                )}>
                                  {job.tracking_code}
                                </span>
                                {isStuck && (
                                  <Badge className="bg-rose-100 text-rose-600 text-[8px] font-black border-none uppercase h-4">
                                    Stuck &gt; 3 Hari
                                  </Badge>
                                )}
                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-800 text-base leading-tight">
                                {job.quotation?.items?.[0]?.service?.name || 'Layanan Laboratorium'}
                              </h4>
                              
                              {/* Display Parameters as Tags */}
                              {job.quotation?.items?.[0]?.parameter_snapshot && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {job.quotation.items[0].parameter_snapshot.split(", ").slice(0, 4).map((p: string, pIdx: number) => (
                                    <Badge key={pIdx} variant="secondary" className="bg-blue-50 text-blue-600 font-bold text-[8px] uppercase border-blue-100 h-5 px-2 rounded-md shadow-sm">
                                      {p}
                                    </Badge>
                                  ))}
                                  {job.quotation.items[0].parameter_snapshot.split(", ").length > 4 && (
                                    <span className="text-[8px] font-black text-slate-400 mt-1">
                                      +{job.quotation.items[0].parameter_snapshot.split(", ").length - 4} Lainya
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-3 pt-1">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-emerald-600" />
                                  {job.quotation?.profile?.full_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <Badge variant="outline" className={cn("border-2 font-black text-[9px] uppercase px-3 py-1 rounded-full", config.theme, config.color)}>
                                 <StatusIcon className="h-3 w-3 mr-1.5" />
                                 {config.label}
                               </Badge>
                               <div className="text-right">
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Progress</p>
                                  <p className="text-lg font-black text-emerald-950 leading-none">{config.progress}%</p>
                               </div>
                            </div>
                          </div>

                          {/* Simplified Progress Line */}
                          <div className="relative pt-2">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-700 ease-out", isStuck ? "bg-rose-400" : config.color.replace('text', 'bg'))}
                                style={{ width: `${config.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Master Info & Audit Log */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Services Tooltip */}
          <div className="bg-emerald-950 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-48 w-48 bg-emerald-900 rounded-full opacity-50 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-800">
                  <LayoutGrid className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Katalog Master</h3>
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest leading-none">
                    {companyName} Inventory
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors cursor-pointer" onClick={() => setIsServicesModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Layanan Lab</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{services.length} Terdaftar</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors cursor-pointer" onClick={() => setIsCategoriesModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Kategori</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{categories.length} Bidang</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-900/50 p-4 rounded-2xl border border-dashed border-emerald-700 text-center">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter mb-2">Penawaran Cepat?</p>
                 <Button 
                   onClick={() => setIsQuotationModalOpen(true)}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase h-10 rounded-xl shadow-lg shadow-black/20"
                 >
                   Buat Penawaran
                 </Button>
              </div>
            </div>
          </div>

          {/* Quick Info Alerts */}
          {stats.stuck > 0 && (
            <div className="bg-rose-50 rounded-[2rem] border border-rose-100 p-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 uppercase leading-none">Peringatan Operasional</h4>
                    <p className="text-[10px] font-bold text-rose-600 uppercase mt-1">Stuck &gt; 3 Hari</p>
                  </div>
               </div>
               <p className="text-[11px] text-rose-800/70 font-medium leading-relaxed mb-4">
                 Ada <span className="font-black text-rose-600">{stats.stuck} pekerjaan</span> yang tidak mengalami perubahan status selama lebih dari 3 hari. Segera lakukan pengecekan di lapangan atau laboratorium.
               </p>
               <Button 
                variant="link" 
                className="p-0 h-auto text-[10px] font-black text-rose-600 uppercase hover:no-underline"
                onClick={() => {
                  setFilterStatus("all");
                  setSearch(""); // Reset to see all potentially stuck jobs
                }}
               >
                 Tampilkan Semua <ArrowRight className="h-3 w-3 ml-1" />
               </Button>
            </div>
          )}
        </div>
      </div>

      <JobDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        selectedJob={selectedJob}
        onManageProgress={() => {
          setIsDetailOpen(false);
          router.push("/operator/jobs");
        }}
      />

      <ServicesListModal
        open={isServicesModalOpen}
        onOpenChange={setIsServicesModalOpen}
        services={services}
        serviceSearch={serviceSearch}
        setServiceSearch={setServiceSearch}
        servicePage={servicePage}
        setServicePage={setServicePage}
        servicePerPage={SERVICE_PER_PAGE}
      />

      <CategoriesListModal
        open={isCategoriesModalOpen}
        onOpenChange={setIsCategoriesModalOpen}
        categories={categories}
        companyName={companyName}
      />

      <QuickQuotationModal
        open={isQuotationModalOpen}
        onOpenChange={setIsQuotationModalOpen}
        servicesCount={services.length}
        categoriesCount={categories.length}
        onContinue={() => {
          setIsQuotationModalOpen(false);
          router.push("/operator/quotations?create=1");
        }}
      />
    </div>
  );
}
