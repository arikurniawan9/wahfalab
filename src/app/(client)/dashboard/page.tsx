"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Clock,
  FileDown,
  ArrowRight,
  FlaskConical,
  Truck,
  Beaker,
  FileText,
  FileCheck,
  ChevronRight,
  Info,
  History,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { getJobOrders } from "@/lib/actions/jobs"
import { getProfile } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ChemicalLoader } from "@/components/ui"

export default function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prof, jobsData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 100)
      ]);
      setProfile(prof);
      const { data: { user } } = await supabase.auth.getUser();
      const filteredJobs = jobsData.items.filter((j: any) => j.quotation.user_id === user?.id);
      setActiveJobs(filteredJobs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('job_updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'job_orders' }, () => { loadData(); toast.info("Status pengujian diperbarui!"); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const steps = [
    { id: 'scheduled', label: 'Antrean', icon: Clock, desc: 'Pendaftaran diterima.' },
    { id: 'sampling', label: 'Sampling', icon: Truck, desc: 'Petugas di lapangan.' },
    { id: 'analysis', label: 'Laboratorium', icon: Beaker, desc: 'Sedang diuji.' },
    { id: 'reporting', label: 'Pelaporan', icon: FileText, desc: 'Penyusunan sertifikat.' },
    { id: 'completed', label: 'Selesai', icon: FileCheck, desc: 'Sertifikat terbit.' },
  ];

  const getCurrentStepIndex = (status: string) => steps.findIndex(s => s.id === status);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight font-[family-name:var(--font-montserrat)]">Halo, {profile?.full_name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-xs">Monitoring hasil pengujian laboratorium Anda.</p>
        </div>
        <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 text-[10px] py-1">Customer</Badge>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-600 p-5 rounded-2xl shadow-lg shadow-emerald-900/10 text-white">
          <h3 className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest">Pesanan Aktif</h3>
          <p className="text-3xl font-bold mt-1">{activeJobs.filter(j => j.status !== 'completed').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Tahap Uji</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">{activeJobs.filter(j => j.status === 'analysis').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Selesai</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">{activeJobs.filter(j => j.status === 'completed').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <FlaskConical className="h-4 w-4" />
            Lacak Pekerjaan
          </h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {activeJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">Tidak ada pengujian aktif.</div>
          ) : (
            activeJobs.map((job) => (
              <div key={job.id} className="p-5 hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[10px]">JOB</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{job.tracking_code}</span>
                      <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-bold uppercase">{job.status}</Badge>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{job.quotation.items[0]?.service?.name || 'Uji Analisis Lab'}</h4>
                    <p className="text-[10px] text-slate-400">Dimulai: {new Date(job.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }} variant="outline" size="sm" className="flex-1 md:flex-none h-8 text-xs font-bold rounded-lg border-emerald-100 text-emerald-700">Detail</Button>
                  {job.certificate_url && (
                    <a href={job.certificate_url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                      <Button size="sm" className="w-full h-8 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700"><FileDown className="h-3 w-3 mr-1" /> Sertifikat</Button>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 overflow-hidden">
          <div className="bg-emerald-950 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedJob?.quotation.items[0]?.service?.name}</DialogTitle>
              <DialogDescription className="text-emerald-400 text-xs font-medium">Progres: {selectedJob?.tracking_code}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white space-y-6 relative">
            <div className="absolute left-[35px] top-8 bottom-8 w-0.5 bg-slate-100" />
            {steps.map((step, idx) => {
              const currentIdx = getCurrentStepIndex(selectedJob?.status || '');
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative pl-12">
                  <div className={cn("absolute left-0 top-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm", isPast ? "bg-emerald-500 text-white" : isCurrent ? "bg-emerald-950 text-white scale-110" : "bg-slate-50 text-slate-300")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className={cn(isPast || isCurrent ? "opacity-100" : "opacity-30")}>
                    <h5 className={cn("text-sm font-bold", isCurrent ? "text-emerald-950" : "text-slate-700")}>{step.label}</h5>
                    <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                    {isCurrent && selectedJob?.notes && (
                      <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-900 font-medium italic">"{selectedJob.notes}"</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="p-4 bg-slate-50"><Button onClick={() => setIsDetailOpen(false)} className="w-full rounded-xl bg-emerald-950">Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
