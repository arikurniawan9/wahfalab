import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { progressSteps, statusConfig } from "../constants";

type JobDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedJob: any;
  onManageProgress: () => void;
};

export function JobDetailModal({
  open,
  onOpenChange,
  selectedJob,
  onManageProgress,
}: JobDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-emerald-950 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-900 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-800 flex items-center justify-center border border-emerald-700">
                <Briefcase className="h-4 w-4 text-emerald-400" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none pt-1">
                Detail Order
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-400 tracking-widest">
                {selectedJob?.tracking_code}
              </span>
              <div className="h-1 w-1 rounded-full bg-emerald-800" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase">
                {statusConfig[selectedJob?.status]?.label || "General"}
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">
                Pelanggan
              </p>
              <p className="font-black text-slate-800 text-sm leading-none">
                {selectedJob?.quotation?.profile?.full_name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                {selectedJob?.quotation?.profile?.company_name || "Personal Customer"}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">
                Layanan Utama
              </p>
              <p className="font-black text-slate-800 text-sm">
                {selectedJob?.quotation?.items?.[0]?.service?.name || "Uji Analisis Lab"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Alur Progres
              </h5>
              <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] border-none rounded-lg">
                {statusConfig[selectedJob?.status]?.progress}% Done
              </Badge>
            </div>

            <div className="space-y-4">
              {progressSteps.map((step, idx) => {
                const jobIndex = progressSteps.findIndex((s) => s.key === selectedJob?.status);
                const isPast = idx < jobIndex;
                const isCurrent = idx === jobIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-center gap-4 group">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                        isPast
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                          : isCurrent
                            ? "bg-emerald-950 border-emerald-900 text-white scale-110 shadow-xl shadow-emerald-950/20"
                            : "bg-slate-50 border-slate-100 text-slate-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 border-b border-slate-50 pb-2">
                      <p
                        className={cn(
                          "text-xs font-black uppercase tracking-tight",
                          isPast || isCurrent ? "text-slate-800" : "text-slate-300"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {isPast
                          ? "Telah Selesai"
                          : isCurrent
                            ? "Status Saat Ini"
                            : "Belum Dimulai"}
                      </p>
                    </div>
                    {isCurrent && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400 h-12 rounded-2xl"
          >
            Tutup
          </Button>
          <Button
            onClick={onManageProgress}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-emerald-900/20"
          >
            Kelola Progres
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
