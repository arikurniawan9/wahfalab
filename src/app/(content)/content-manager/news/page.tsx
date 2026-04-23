"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  getNews, 
  upsertNews, 
  deleteNews 
} from "@/lib/actions/news";
import { uploadLocalImage } from "@/lib/actions/system";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Newspaper,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Edit2,
  Image as ImageIcon,
  X,
  Search,
  MoreHorizontal,
  Calendar
} from "lucide-react";
import { ChemicalLoader, LoadingButton } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TagInput } from "@/components/ui/tag-input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function NewsManagerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    const result = await getNews();
    if (result.error) {
      toast.error("Gagal memuat berita: " + result.error);
    } else {
      setNews(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadNews();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadNews]);

  const handleOpenDialog = (item: any = null) => {
    if (item) {
      setEditItem(item);
    } else {
      setEditItem({
        title: "",
        content: "",
        category: "Umum",
        image_url: "",
        tags: [],
        show_tags: true,
        is_published: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem.title || !editingItem.content) {
      toast.error("Judul dan isi berita wajib diisi");
      return;
    }

    setSubmitting(true);
    const result = await upsertNews(editingItem);
    if (result.success) {
      toast.success(editingItem.id ? "Berita diperbarui!" : "Berita ditambahkan!");
      setIsDialogOpen(false);
      loadNews();
    } else {
      toast.error("Gagal menyimpan: " + result.error);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berita ini?")) return;
    
    const result = await deleteNews(id);
    if (result.success) {
      toast.success("Berita dihapus");
      loadNews();
    } else {
      toast.error("Gagal menghapus: " + result.error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadLocalImage(formData);
    if (result.success) {
      setEditItem({ ...editingItem, image_url: result.url });
      toast.success("Gambar berhasil diunggah!");
    } else {
      toast.error("Gagal unggah: " + result.error);
    }
    setUploading(false);
  };

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 space-y-8 pb-24 md:pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Manajemen Berita
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
            Kelola artikel, pengumuman, dan publikasi WahfaLab.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-2xl shadow-lg shadow-emerald-900/20 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Tulis Berita
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-emerald-50 bg-emerald-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
            <Input 
              placeholder="Cari berita atau kategori..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-emerald-100 bg-white focus:ring-emerald-500 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600/70">
            Total Berita: <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full">{news.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-emerald-50 hover:bg-transparent">
                <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6 text-center">Cover</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6">Info Berita</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6">Kategori</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6">Tags</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6">Tanggal</TableHead>
                <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-emerald-900 p-6 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.map((item) => (
                <TableRow key={item.id} className="border-emerald-50 hover:bg-emerald-50/30 transition-colors group">
                  <TableCell className="p-4">
                    <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden border border-emerald-100 shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="space-y-1">
                      <p className="font-bold text-emerald-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">/{item.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge variant="outline" className="rounded-lg border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.slice(0, 2).map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[8px] px-1 py-0 h-4 bg-slate-100 text-slate-500 border-none font-bold">
                          #{tag}
                        </Badge>
                      ))}
                      {item.tags?.length > 2 && <span className="text-[8px] font-bold text-slate-300">+{item.tags.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    {item.is_published ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1">
                        <Eye className="h-3 w-3" /> Live
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-300 hover:bg-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1 text-slate-600">
                        <EyeOff className="h-3 w-3" /> Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px]">
                      <Calendar className="h-3 w-3 text-emerald-600/40" />
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-emerald-100">
                          <MoreHorizontal className="h-4 w-4 text-emerald-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-emerald-100 p-2 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilihan Berita</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-emerald-50" />
                        <DropdownMenuItem onClick={() => handleOpenDialog(item)} className="rounded-xl focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer p-3 font-bold text-xs">
                          <Edit2 className="h-4 w-4 mr-2" /> Edit Artikel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer p-3 font-bold text-xs text-red-500">
                          <Trash2 className="h-4 w-4 mr-2" /> Hapus Berita
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredNews.length === 0 && (
          <div className="py-24 text-center">
            <div className="bg-emerald-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper className="h-10 w-10 text-emerald-200" />
            </div>
            <h3 className="text-emerald-900 font-black uppercase tracking-tight">Tidak Ada Berita</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Sesuaikan kata kunci pencarian Anda</p>
          </div>
        )}
      </div>

      {/* Editor Modal (Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[900px] max-h-[90vh] p-0 border-none shadow-2xl overflow-hidden flex flex-col rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-white p-6 md:p-8 border-b border-slate-100 flex-shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black text-emerald-900 uppercase tracking-tight">
                {editingItem?.id ? "Edit Artikel" : "Tulis Artikel Baru"}
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Editor Berita WahfaLab</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full bg-slate-100 hover:bg-slate-200 h-10 w-10">
              <X className="h-5 w-5 text-slate-600" />
            </Button>
          </DialogHeader>
          
          <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Judul Berita</Label>
                <Input 
                  value={editingItem?.title || ""} 
                  onChange={(e) => setEditItem({...editingItem, title: e.target.value})}
                  className="h-14 rounded-2xl border-slate-200 font-bold text-lg px-4 bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Ketik judul yang menarik..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Kategori</Label>
                  <Input 
                    value={editingItem?.category || ""} 
                    onChange={(e) => setEditItem({...editingItem, category: e.target.value})}
                    className="h-12 rounded-xl border-slate-200 font-semibold px-4"
                    placeholder="Misal: Info Lab, CSR"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tags</Label>
                  <TagInput 
                    tags={editingItem?.tags || []} 
                    onChange={(tags) => setEditItem({...editingItem, tags: tags})}
                    placeholder="Ketik tag dan tekan Enter..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Status Publikasi</Label>
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 h-12">
                    <span className="text-xs font-bold text-slate-600">{editingItem?.is_published ? "Ditayangkan" : "Draft"}</span>
                    <Switch 
                      checked={editingItem?.is_published} 
                      onCheckedChange={(val) => setEditItem({...editingItem, is_published: val})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tampilkan Tag di Artikel</Label>
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 h-12">
                    <span className="text-xs font-bold text-slate-600">{editingItem?.show_tags ? "Tampilkan" : "Sembunyikan"}</span>
                    <Switch 
                      checked={editingItem?.show_tags} 
                      onCheckedChange={(val) => setEditItem({...editingItem, show_tags: val})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cover Gambar Utama</Label>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-48 aspect-video bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0">
                  {editingItem?.image_url ? (
                    <img src={editingItem?.image_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-3">
                  <Input 
                    value={editingItem?.image_url || ""} 
                    onChange={(e) => setEditItem({...editingItem, image_url: e.target.value})}
                    placeholder="Masukkan URL Gambar..."
                    className="h-12 rounded-xl border-slate-200 text-sm font-medium"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase">ATAU</span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="news-upload"
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <Button 
                      asChild
                      variant="outline" 
                      className="h-12 w-full rounded-xl border-emerald-200 text-emerald-600 cursor-pointer bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-700 font-bold"
                    >
                      <label htmlFor="news-upload">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {uploading ? "Mengunggah..." : "Upload dari Komputer"}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pb-10">
              <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Isi Konten Artikel</Label>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                <RichTextEditor 
                  content={editingItem?.content || ""}
                  onChange={(html) => setEditItem({...editingItem, content: html})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border-t border-slate-100 flex-shrink-0 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 px-6">Batal</Button>
            <LoadingButton 
              onClick={handleSave} 
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20"
            >
              Simpan & Terbitkan
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
