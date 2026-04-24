import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type QuickQuotationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicesCount: number;
  categoriesCount: number;
  onContinue: () => void;
};

export function QuickQuotationModal({
  open,
  onOpenChange,
  servicesCount,
  categoriesCount,
  onContinue,
}: QuickQuotationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-emerald-950 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-900/40 border-4 border-emerald-800">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                Buat Penawaran
              </DialogTitle>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1">
                Sistem Penawaran Digital
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 bg-white space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-slate-500 text-sm leading-relaxed">
              Anda akan masuk ke halaman penawaran, lalu form pembuatan akan terbuka sebagai modal
              untuk mengisi detail klien, parameter pengujian, dan biaya operasional lapangan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-lg font-black text-emerald-600 leading-none">{servicesCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Layanan Siap
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-lg font-black text-emerald-600 leading-none">{categoriesCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Kategori Aktif
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={onContinue}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 group"
          >
            Lanjut Pembuatan{" "}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        <DialogFooter className="p-4 bg-slate-50 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full font-black text-[10px] uppercase tracking-widest text-slate-400"
          >
            Batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
