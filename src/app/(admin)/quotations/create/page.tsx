"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, FileDown, Save } from "lucide-react";
import { createQuotation } from "@/lib/actions/quotation";

const schema = z.object({
  quotation_number: z.string().min(1, "No. Penawaran wajib diisi"),
  client_name: z.string().min(1, "Nama Klien wajib diisi"),
  company_name: z.string().min(1, "Nama Perusahaan wajib diisi"),
  items: z.array(z.object({
    service_id: z.string(),
    name: z.string(),
    qty: z.number().min(1),
    price: z.number().min(0),
  })).min(1, "Minimal 1 item layanan"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateQuotationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quotation_number: `QT-${Date.now()}`,
      items: [{ service_id: "", name: "", qty: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        subtotal,
        tax_amount: tax,
        total_amount: total,
        user_id: "66270b2e-0b0b-4b0b-8b0b-0b0b0b0b0b0b", // Placeholder: replace with actual user selection
      };
      
      // await createQuotation(payload);
      
      setPdfData({
        ...payload,
        date: new Date().toLocaleDateString("id-ID"),
        items: payload.items.map(i => ({ ...i, total: i.qty * i.price })),
        tax: payload.tax_amount,
        total: payload.total_amount
      });

      alert("Penawaran berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan penawaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Buat Penawaran Baru</CardTitle>
          <div className="flex gap-2">
            {pdfData && (
              <PDFDownloadLink
                document={<QuotationDocument data={pdfData} />}
                fileName={`${pdfData.quotation_number}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {loading ? "Menyiapkan PDF..." : "Unduh PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Penawaran</label>
                <Input {...register("quotation_number")} />
                {errors.quotation_number && <p className="text-red-500 text-xs">{errors.quotation_number.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Klien</label>
                <Input {...register("client_name")} />
                {errors.client_name && <p className="text-red-500 text-xs">{errors.client_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Perusahaan</label>
                <Input {...register("company_name")} />
                {errors.company_name && <p className="text-red-500 text-xs">{errors.company_name.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daftar Layanan</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", name: "", qty: 1, price: 0 })}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Item
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi Layanan</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-40">Harga Satuan</TableHead>
                    <TableHead className="w-40 text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input {...register(`items.${index}.name`)} placeholder="Nama layanan..." />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          {...register(`items.${index}.qty`, { valueAsNumber: true })} 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          {...register(`items.${index}.price`, { valueAsNumber: true })} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {(watchedItems[index]?.qty * watchedItems[index]?.price || 0).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-end space-y-2 border-t pt-4">
              <div className="flex justify-between w-64">
                <span>Subtotal:</span>
                <span className="font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between w-64">
                <span>PPN (11%):</span>
                <span className="font-semibold">Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan & Generate PDF"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
