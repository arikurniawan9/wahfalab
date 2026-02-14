'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createQuotation(formData: any) {
  const supabase = await createClient()

  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .insert({
      quotation_number: formData.quotation_number,
      user_id: formData.user_id,
      subtotal: formData.subtotal,
      tax_amount: formData.tax_amount,
      total_amount: formData.total_amount,
      status: 'draft',
    })
    .select()
    .single()

  if (qError) throw qError

  const items = formData.items.map((item: any) => ({
    quotation_id: quotation.id,
    service_id: item.service_id,
    qty: item.qty,
    price_snapshot: item.price,
    parameter_snapshot: item.parameters,
  }))

  const { error: iError } = await supabase
    .from('quotation_items')
    .insert(items)

  if (iError) throw iError

  revalidatePath('/(admin)/quotations')
  return { success: true, id: quotation.id }
}
