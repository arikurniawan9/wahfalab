import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, ArrowLeft, Search, Beaker, Microscope, TestTube, LayoutGrid, List } from "lucide-react";
import { getAllServices } from "@/lib/actions/services";
import { getAllCategories as getCategories } from "@/lib/actions/categories";
import { getCachedCompanyProfile } from "@/lib/cache";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; view?: "card" | "list" }>;
}) {
  const { category, search, view = "card" } = await searchParams;
  const [services, categories, companyProfile] = await Promise.all([
    getAllServices(),
    getCategories(),
    getCachedCompanyProfile(),
  ]);

  // Filter services based on search and category
  let filteredServices = services;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredServices = filteredServices.filter(
      (s: any) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.category_ref?.name.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower)
    );
  }

  if (category) {
    filteredServices = filteredServices.filter(
      (s: any) => s.category_ref?.id === category || s.category === category
    );
  }

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc: any, service: any) => {
    const categoryName = service.category_ref?.name || service.category || "Lainnya";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(service);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Kembali ke Beranda
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {companyProfile?.logo_url ? (
            <Image
              src={companyProfile.logo_url}
              alt="Company Logo"
              width={40}
              height={40}
              className="h-10 w-auto cursor-pointer"
              priority
            />
          ) : (
            <Image
              src="/logo-wahfalab.png"
              alt="WahfaLab Logo"
              width={40}
              height={40}
              className="h-10 w-auto cursor-pointer"
              priority
            />
          )}
          <span className="font-bold text-xl tracking-tighter text-emerald-900 font-[family-name:var(--font-montserrat)] cursor-pointer">
            {companyProfile?.company_name || "WahfaLab"}
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-emerald-50 to-green-50 border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 cursor-pointer">
                <FlaskConical className="inline-block h-4 w-4 mr-1" />
                Katalog Layanan {new Date().getFullYear()}
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-emerald-900">
                Daftar Layanan Laboratorium
              </h1>
              <p className="max-w-[700px] text-slate-500 md:text-xl">
                Pilih dari berbagai layanan pengujian dan kalibrasi dengan harga transparan
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="w-full py-6 bg-white border-b sticky top-16 z-40 shadow-sm">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Link
                  href={`/catalog${search ? `?search=${search}` : ""}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    !category
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua
                </Link>
                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/catalog?category=${cat.id}${search ? `&search=${search}` : ""}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                      category === cat.id
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <div className="flex gap-2 w-full md:w-auto items-center">
                {/* Search */}
                <form action="/catalog" method="GET" className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    name="search"
                    type="text"
                    placeholder="Cari layanan..."
                    defaultValue={search}
                    className="pl-10 rounded-full bg-slate-50 border-slate-200 focus:bg-white cursor-pointer"
                  />
                </form>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Link
                    href={`/catalog${category ? `?category=${category}` : ""}${search ? `${category ? "&" : "?"}search=${search}` : ""}`}
                    className={`p-2 rounded-md transition-all cursor-pointer ${
                      view === "card"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/catalog?view=list${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    className={`p-2 rounded-md transition-all cursor-pointer ${
                      view === "list"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 mx-auto">
            {Object.keys(servicesByCategory).length === 0 ? (
              <div className="text-center py-20">
                <Beaker className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Tidak ada layanan ditemukan
                </h3>
                <p className="text-slate-500">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(servicesByCategory).map(
                  ([categoryName, services]: [string, any]) => (
                    <div key={categoryName} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-emerald-600 rounded-full" />
                        <h2 className="text-2xl font-bold text-emerald-900">
                          {categoryName}
                        </h2>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                          {services.length} layanan
                        </Badge>
                      </div>

                      {view === "list" ? (
                        /* List View */
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="font-bold text-emerald-900">Nama Layanan</TableHead>
                                <TableHead className="font-bold text-emerald-900 hidden md:table-cell">Unit</TableHead>
                                <TableHead className="font-bold text-emerald-900 hidden lg:table-cell">Regulasi</TableHead>
                                <TableHead className="font-bold text-emerald-900 text-right">Harga</TableHead>
                                <TableHead className="text-right"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {services.map((service: any) => (
                                <TableRow
                                  key={service.id}
                                  className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                                >
                                  <TableCell className="font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                      <TestTube className="h-4 w-4 text-emerald-600" />
                                      {service.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge variant="secondary" className="text-xs bg-slate-100">
                                      {service.unit || "-"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-sm text-slate-500 max-w-xs truncate">
                                    {service.regulation || "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-lg font-bold text-emerald-700">
                                      Rp {Number(service.price).toLocaleString("id-ID")}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href="/login">
                                      <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                      >
                                        Pesan
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        /* Card View */
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {services.map((service: any) => (
                            <Card
                              key={service.id}
                              className="group hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                    <TestTube className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  {service.unit && (
                                    <Badge variant="secondary" className="text-xs bg-slate-100">
                                      {service.unit}
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="mt-3 text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {service.name}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {service.regulation && (
                                  <p className="text-xs text-slate-500 line-clamp-2">
                                    {service.regulation}
                                  </p>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">Harga</span>
                                    <span className="text-lg font-bold text-emerald-700">
                                      Rp {Number(service.price).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                  <Link href="/login">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                    >
                                      Pesan
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-emerald-900 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Siap untuk Memulai?</h2>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              Buat penawaran atau hubungi kami untuk konsultasi lebih lanjut
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 cursor-pointer"
                >
                  <FlaskConical className="mr-2 h-5 w-5" />
                  Buat Penawaran
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-400 text-emerald-100 hover:bg-emerald-800 cursor-pointer"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} WahfaLab. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-emerald-800 cursor-pointer" href="#">
            Syarat & Ketentuan
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-emerald-800 cursor-pointer" href="#">
            Kebijakan Privasi
          </Link>
        </nav>
      </footer>
    </div>
  );
}
