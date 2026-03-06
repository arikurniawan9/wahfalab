"use client";

import React, { useState } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/actions/news";
import { toast } from "sonner";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await sendContactMessage(formData);

    if (result.success) {
      toast.success("Pesan Anda telah terkirim! Tim kami akan segera menghubungi Anda.");
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error("Gagal mengirim pesan: " + result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-slate-50 p-8 md:p-12 rounded-[3rem] border-2 border-white shadow-2xl shadow-slate-200/50">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Kirim Pesan</h3>
            <p className="text-[10px] font-black uppercase text-emerald-600/70 tracking-widest">Kami akan membalas dalam 24 jam</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Input name="name" placeholder="Nama Lengkap" className="h-14 rounded-2xl bg-white border-transparent focus:border-emerald-500 font-bold" required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Input name="email" type="email" placeholder="Alamat Email" className="h-14 rounded-2xl bg-white border-transparent focus:border-emerald-500 font-bold" required disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Input name="phone" placeholder="Nomor Telepon" className="h-14 rounded-2xl bg-white border-transparent focus:border-emerald-500 font-bold" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Input name="subject" placeholder="Subjek / Keperluan" className="h-14 rounded-2xl bg-white border-transparent focus:border-emerald-500 font-bold" required disabled={submitting} />
            </div>
          </div>
          <div className="space-y-2">
            <Textarea name="message" placeholder="Tuliskan pesan Anda di sini..." className="min-h-[150px] rounded-2xl bg-white border-transparent focus:border-emerald-500 font-medium leading-relaxed p-6" required disabled={submitting} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 group">
            {submitting ? (
              <>Mengirim Pesan... <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
            ) : (
              <>Kirim Pesan Sekarang <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
