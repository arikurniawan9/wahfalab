"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building,
  PlusCircle,
  CreditCard,
  User,
  History,
  Pencil,
  Trash2,
  Wallet,
  Banknote,
  CheckCircle,
  Loader2,
  Coins
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { getBankAccounts, saveBankAccount } from "@/lib/actions/finance";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function BankManagementPage() {
  const pathname = usePathname();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
    balance: "0"
  });

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadBanks() {
    setLoading(true);
    try {
      const data = await getBankAccounts();
      setBanks(data);
    } catch (error) {
      toast.error("Gagal memuat daftar bank");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (bank?: any) => {
    if (bank) {
      setSelectedBank(bank);
      setFormData({
        bank_name: bank.bank_name,
        account_number: bank.account_number,
        account_holder: bank.account_holder,
        balance: bank.balance.toString()
      });
    } else {
      setSelectedBank(null);
      setFormData({
        bank_name: "",
        account_number: "",
        account_holder: "",
        balance: "0"
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name || !formData.account_number) return toast.error("Lengkapi data bank");

    setProcessing(true);
    try {
      const result = await saveBankAccount({
        id: selectedBank?.id,
        ...formData,
        balance: parseFloat(formData.balance)
      });

      if (result.error) throw new Error(result.error);

      toast.success(selectedBank ? "✅ Data bank diperbarui" : "✅ Bank baru berhasil ditambahkan");
      setIsModalOpen(false);
      loadBanks();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalBalance = banks.reduce((sum, bank) => sum + Number(bank.balance || 0), 0);
  const activeBanks = banks.filter((bank) => bank.is_active !== false);
  const highestBank = banks.length > 0
    ? banks.reduce((top, bank) => Number(bank.balance || 0) > Number(top.balance || 0) ? bank : top, banks[0])
    : null;
  const basePath = pathname.startsWith('/admin/')
    ? '/admin/finance/settings/banks'
    : '/finance/settings/banks';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 font-[family-name:var(--font-montserrat)] uppercase tracking-tight flex items-center gap-3">
            <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
            Manajemen Bank
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1 ml-4">
            Kelola daftar rekening bank operasional laboratorium
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-emerald-200 text-xs"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Bank
        </Button>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[24px] border-emerald-100 shadow-sm bg-emerald-50/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Saldo Bank</p>
                <p className="mt-2 text-2xl font-black text-emerald-950">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Banknote className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-sky-100 shadow-sm bg-sky-50/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-700">Rekening Aktif</p>
                <p className="mt-2 text-2xl font-black text-sky-950">{activeBanks.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <CheckCircle className="h-6 w-6 text-sky-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-violet-100 shadow-sm bg-violet-50/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Bank Terbesar</p>
                <p className="mt-2 text-sm font-black text-violet-950">
                  {highestBank ? highestBank.bank_name : '-'}
                </p>
                <p className="text-[10px] font-bold text-violet-700/70 mt-1">
                  {highestBank ? formatCurrency(Number(highestBank.balance || 0)) : 'Belum ada saldo'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Wallet className="h-6 w-6 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <ChemicalLoader />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400">
              Belum ada rekening bank terdaftar
            </div>
          ) : (
            banks.map((bank) => (
                <Card key={bank.id} className={cn(
                  "border-slate-200 rounded-[24px] shadow-sm hover:shadow-md transition-all group overflow-hidden",
                  bank.account_number === 'CASH-001' && "border-amber-200 bg-amber-50/60"
                )}>
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border",
                      bank.account_number === 'CASH-001' ? "border-amber-200" : "border-slate-200"
                    )}>
                      {bank.account_number === 'CASH-001' ? <Coins className="h-5 w-5 text-amber-600" /> : <Building className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div>
                      <h3 className={cn("font-bold", bank.account_number === 'CASH-001' ? "text-amber-950" : "text-slate-900")}>{bank.bank_name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bank.account_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bank.account_number !== 'CASH-001' && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(bank)} className="h-8 w-8 text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Link href={bank.account_number === 'CASH-001' ? `${basePath.replace('/banks', '/cash')}` : `${basePath}/${bank.id}`} className="inline-flex">
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", bank.account_number === 'CASH-001' ? "text-amber-600" : "text-emerald-600")}>
                        <History className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemilik Rekening</Label>
                    <p className="text-sm font-bold text-slate-800">{bank.account_holder}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <Label className={cn("text-[9px] font-black uppercase tracking-widest", bank.account_number === 'CASH-001' ? "text-amber-600" : "text-emerald-600")}>Saldo Saat Ini</Label>
                    <p className={cn("text-xl font-black", bank.account_number === 'CASH-001' ? "text-amber-900" : "text-emerald-900")}>{formatCurrency(Number(bank.balance))}</p>
                    {bank.account_number === 'CASH-001' && (
                      <Badge className="mt-2 bg-amber-100 text-amber-800 border-none text-[9px] font-black uppercase">
                        Rekening Sistem
                      </Badge>
                    )}
                    <div className="mt-3">
                      <Link href={bank.account_number === 'CASH-001' ? `${basePath.replace('/banks', '/cash')}` : `${basePath}/${bank.id}`}>
                        <Button variant="outline" className={cn(
                          "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          bank.account_number === 'CASH-001' ? "border-amber-200 text-amber-700" : "border-emerald-200 text-emerald-700"
                        )}>
                          {bank.account_number === 'CASH-001' ? 'Ringkasan Kas' : 'Lihat Mutasi'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                {selectedBank ? "Edit Data Bank" : "Tambah Bank Baru"}
              </DialogTitle>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Bank</Label>
                <Input 
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  className="h-11 rounded-xl border-slate-100 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nomor Rekening</Label>
                <Input 
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="0000000000"
                  className="h-11 rounded-xl border-slate-100 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Pemilik</Label>
                <Input 
                  value={formData.account_holder}
                  onChange={(e) => setFormData({...formData, account_holder: e.target.value})}
                  placeholder="Nama sesuai buku tabungan"
                  className="h-11 rounded-xl border-slate-100 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Awal</Label>
                <Input 
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  className="h-11 rounded-xl border-slate-100 bg-slate-50"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="submit"
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg uppercase tracking-widest text-xs"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Data Bank"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LoadingOverlay 
        isOpen={processing} 
        title="Menyimpan Bank..." 
        description="Sedang mendaftarkan rekening ke sistem WahfaLab" 
      />
    </div>
  );
}
