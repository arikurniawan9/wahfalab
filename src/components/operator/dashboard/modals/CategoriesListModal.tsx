import { ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type CategoriesListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: any[];
  companyName: string;
};

export function CategoriesListModal({
  open,
  onOpenChange,
  categories,
  companyName,
}: CategoriesListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-emerald-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                Kategori Layanan
              </DialogTitle>
              <DialogDescription className="text-emerald-500 text-[10px] font-bold uppercase mt-1">
                Bidang Analisis {companyName}
              </DialogDescription>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat: any) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-emerald-50 hover:border-emerald-100 transition-all"
              >
                <div>
                  <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{cat.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {cat._count?.services || 0} Layanan Tersedia
                  </p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="p-4 bg-slate-50 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full font-black text-[10px] uppercase tracking-widest text-slate-400"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
