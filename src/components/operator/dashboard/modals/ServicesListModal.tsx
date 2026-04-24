import type { Dispatch, SetStateAction } from "react";
import { FlaskConical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type ServicesListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  serviceSearch: string;
  setServiceSearch: (value: string) => void;
  servicePage: number;
  setServicePage: Dispatch<SetStateAction<number>>;
  servicePerPage: number;
};

export function ServicesListModal({
  open,
  onOpenChange,
  services,
  serviceSearch,
  setServiceSearch,
  servicePage,
  setServicePage,
  servicePerPage,
}: ServicesListModalProps) {
  const filteredServices = services.filter(
    (s: any) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.category_ref?.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredServices.length / servicePerPage);
  const paginatedServices = filteredServices.slice(
    (servicePage - 1) * servicePerPage,
    servicePage * servicePerPage
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-emerald-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <FlaskConical className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                Daftar Layanan
              </DialogTitle>
              <DialogDescription className="text-emerald-500 text-[10px] font-bold uppercase mt-1">
                Total {services.length} Layanan Terdaftar
              </DialogDescription>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari layanan..."
              className="pl-10 h-10 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-emerald-500"
              value={serviceSearch}
              onChange={(e) => {
                setServiceSearch(e.target.value);
                setServicePage(1);
              }}
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-50">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Layanan</th>
                  <th className="px-4 py-3 text-right">Harga (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-slate-400 font-bold uppercase tracking-widest"
                    >
                      Tidak ada layanan ditemukan
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedServices.map((service: any) => (
                      <tr key={service.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{service.name}</p>
                          <p className="text-[9px] text-emerald-600 font-black uppercase mt-0.5">
                            {service.category_ref?.name || "Umum"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {new Intl.NumberFormat("id-ID").format(service.price)}
                        </td>
                      </tr>
                    ))}
                    {filteredServices.length > servicePerPage && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={2} className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Halaman {servicePage} dari {totalPages}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-[10px] font-black uppercase rounded-lg border-slate-200"
                                disabled={servicePage === 1}
                                onClick={() => setServicePage((p) => Math.max(1, p - 1))}
                              >
                                Sebelumnya
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-[10px] font-black uppercase rounded-lg border-slate-200"
                                disabled={servicePage === totalPages}
                                onClick={() => setServicePage((p) => Math.min(totalPages, p + 1))}
                              >
                                Selanjutnya
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
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
