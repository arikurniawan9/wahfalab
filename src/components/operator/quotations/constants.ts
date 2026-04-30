import * as z from "zod";
import { FileText, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

export const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  sampling_location: z.string().optional().nullable(),
  user_id: z.string().min(1, "Pilih pelanggan"),
  use_tax: z.boolean().default(true),
  discount_amount: z.coerce.number().default(0),
  perdiem_name: z.string().optional().nullable(),
  perdiem_price: z.coerce.number().default(0),
  perdiem_qty: z.coerce.number().default(0),
  transport_name: z.string().optional().nullable(),
  transport_price: z.coerce.number().default(0),
  transport_qty: z.coerce.number().default(0),
  items: z.array(z.object({
    service_id: z.string().optional().nullable(),
    equipment_id: z.string().optional().nullable(),
    qty: z.coerce.number().default(1),
    price: z.coerce.number().default(0),
    name: z.string().optional().nullable(),
    parameters: z.array(z.string()).optional(),
  })).default([]),
});

export const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'DRAFT', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
  sent: { label: 'DIKIRIM', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  accepted: { label: 'DITERIMA', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
  rejected: { label: 'DITOLAK', color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
  paid: { label: 'LUNAS', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign }
};

export function getSearchScore(text: string, query: string) {
  const source = (text || "").toLowerCase();
  const target = query.toLowerCase();
  if (!target) return 1;
  if (source === target) return 120;
  if (source.startsWith(target)) return 90;
  if (source.includes(` ${target}`)) return 70;
  if (source.includes(target)) return 50;
  return 0;
}
