"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  getContactMessages, 
  markMessageAsRead, 
  deleteContactMessage 
} from "@/lib/actions/news";
import { toast } from "sonner";
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  User, 
  Phone, 
  Clock, 
  Search,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MessagesManagerPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const result = await getContactMessages();
    if (result.error) {
      toast.error("Gagal memuat pesan: " + result.error);
    } else {
      setMessages(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadMessages]);

  const handleMarkAsRead = async (id: string) => {
    const result = await markMessageAsRead(id);
    if (result.success) {
      setMessages(messages.map(msg => msg.id === id ? { ...msg, is_read: true } : msg));
      toast.success("Pesan ditandai sudah dibaca");
    } else {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pesan ini selamanya?")) return;
    const result = await deleteContactMessage(id);
    if (result.success) {
      setMessages(messages.filter(msg => msg.id !== id));
      toast.success("Pesan dihapus");
    } else {
      toast.error("Gagal menghapus pesan");
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 space-y-8 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Pesan Masuk
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Kelola pesan dan pertanyaan dari pengunjung website.
          </p>
        </div>
        
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input 
            placeholder="Cari pesan..." 
            className="pl-10 h-11 rounded-2xl border-slate-200 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredMessages.map((msg) => (
          <Card key={msg.id} className={`border-2 overflow-hidden rounded-[2rem] transition-all duration-300 ${msg.is_read ? 'border-slate-100 bg-slate-50/50 opacity-80' : 'border-emerald-100 bg-white shadow-xl shadow-emerald-900/5'}`}>
            <CardHeader className="p-6 md:p-8 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shadow-sm ${msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    {msg.is_read ? <MailOpen className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-emerald-900 uppercase tracking-tight">{msg.name}</h3>
                      {!msg.is_read && <Badge className="bg-emerald-500 text-[8px] font-black uppercase px-2 py-0">Baru</Badge>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {new Date(msg.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!msg.is_read && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkAsRead(msg.id)}
                      className="h-10 rounded-xl border-emerald-200 text-emerald-600 font-black uppercase tracking-widest text-[9px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Tandai Dibaca
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(msg.id)}
                    className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Pengirim</Label>
                  <p className="text-sm font-bold text-emerald-700">{msg.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor Telepon</Label>
                  <p className="text-sm font-bold text-emerald-700">{msg.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subjek</Label>
                  <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">{msg.subject}</p>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Isi Pesan</Label>
                <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMessages.length === 0 && (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <MessageSquare className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">Tidak ada pesan yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
