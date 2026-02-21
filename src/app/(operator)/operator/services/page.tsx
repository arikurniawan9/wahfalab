// ============================================================================
// OPERATOR SERVICES PAGE - Read Only
// Operator hanya bisa melihat katalog layanan (tidak bisa edit/delete)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  FlaskConical,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function OperatorServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, categoriesData] = await Promise.all([
        getAllServices(),
        getAllCategories()
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error("Gagal memuat data layanan", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Search
  const filteredServices = services.filter((service: any) => {
    const matchesSearch = search === "" ||
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.category_ref?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === "all" || service.category_id === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Katalog Layanan
          </h1>
          <p className="text-slate-500 text-xs">
            Daftar layanan pengujian laboratorium yang tersedia
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Layanan"
          value={services.length}
          icon={FlaskConical}
          color="emerald"
        />
        <StatCard
          title="Kategori"
          value={categories.length}
          icon={Tag}
          color="blue"
        />
        <StatCard
          title="Rata-rata Harga"
          value={services.length > 0 
            ? `Rp ${(services.reduce((acc, s) => acc + Number(s.price), 0) / services.length / 1000).toFixed(0)}k`
            : "Rp 0"
          }
          icon={Search}
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama layanan atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 cursor-pointer">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearch("");
                setFilterCategory("all");
              }}
              className="h-10 w-10 cursor-pointer"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <FlaskConical className="h-4 w-4" />
            Daftar Layanan {filteredServices.length > 0 && `(${filteredServices.length})`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-bold text-emerald-900 px-4">Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama Layanan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Parameter</TableHead>
                <TableHead className="text-right font-bold text-emerald-900 px-4">Harga</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                        <FlaskConical className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-slate-700 mb-1">Tidak ada layanan</h4>
                        <p className="text-slate-500 text-sm">
                          {search || filterCategory !== "all"
                            ? "Coba ubah filter atau kata kunci pencarian"
                            : "Belum ada layanan yang terdaftar"}
                        </p>
                        {(search || filterCategory !== "all") && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearch("");
                              setFilterCategory("all");
                            }}
                            className="mt-2 cursor-pointer"
                          >
                            Reset Filter
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service: any) => {
                  const paramCount = Array.isArray(service.parameters) ? service.parameters.length : 0;
                  return (
                    <TableRow key={service.id} className="hover:bg-slate-50/50">
                      <TableCell className="px-4">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {service.category_ref?.name || service.category || 'Umum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 px-4">
                        {service.name}
                      </TableCell>
                      <TableCell className="px-4">
                        {paramCount > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {paramCount} parameter
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 px-4">
                        Rp {Number(service.price).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedService(service);
                            setIsDetailOpen(true);
                          }}
                          className="text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info (no actual pagination since we load all) */}
        <div className="p-4 border-t bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredServices.length} dari {services.length} layanan
          </p>
        </div>
      </div>

      {/* Service Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Detail Layanan
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap layanan pengujian
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Kategori</h5>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedService.category_ref?.name || selectedService.category || 'Umum'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Harga</h5>
                  <p className="text-sm font-bold text-emerald-700">
                    Rp {Number(selectedService.price).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Nama Layanan</h5>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedService.name}
                </p>
              </div>

              {selectedService.unit && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Satuan</h5>
                  <p className="text-sm text-slate-800">
                    {selectedService.unit}
                  </p>
                </div>
              )}

              {selectedService.regulation && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Regulasi</h5>
                  <p className="text-sm text-slate-800">
                    {selectedService.regulation}
                  </p>
                </div>
              )}

              {selectedService.parameters && Array.isArray(selectedService.parameters) && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">
                    Parameter ({selectedService.parameters.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedService.parameters.map((param: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100">
                        <p className="text-xs font-bold text-slate-700">
                          {param.name || `Parameter ${idx + 1}`}
                        </p>
                        {param.min && (
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Min: {param.min}
                          </p>
                        )}
                        {param.max && (
                          <p className="text-[9px] text-slate-400">
                            Max: {param.max}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 bg-slate-50">
            <Button
              onClick={() => setIsDetailOpen(false)}
              className="w-full cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
    </div>
  );
}
