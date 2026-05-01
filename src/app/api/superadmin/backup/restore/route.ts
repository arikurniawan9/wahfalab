import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperadminEmail } from "@/lib/superadmin";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperadminEmail();
    const body = await request.json();
    const data = body as Record<string, unknown>;

    if (!isPlainObject(data)) {
      return NextResponse.json({ error: "Payload backup tidak valid" }, { status: 400 });
    }

    if (data.__confirm_full_restore__ !== true) {
      return NextResponse.json(
        { error: "Restore diblokir. Sertakan __confirm_full_restore__: true untuk melanjutkan." },
        { status: 400 },
      );
    }

    const profiles = data.profiles ?? [];
    const quotations = data.quotations ?? [];
    const jobs = data.jobs ?? [];
    const invoices = data.invoices ?? [];
    const payments = data.payments ?? [];
    const records = data.financial_records ?? [];

    if (
      !isRecordArray(profiles) ||
      !isRecordArray(quotations) ||
      !isRecordArray(jobs) ||
      !isRecordArray(invoices) ||
      !isRecordArray(payments) ||
      !isRecordArray(records)
    ) {
      return NextResponse.json({ error: "Format data backup tidak valid" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.financialRecord.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.jobOrder.deleteMany(),
      prisma.quotation.deleteMany(),
      prisma.profile.deleteMany(),
    ]);

    if (profiles.length) await prisma.profile.createMany({ data: profiles, skipDuplicates: true });
    if (quotations.length) await prisma.quotation.createMany({ data: quotations, skipDuplicates: true });
    if (jobs.length) await prisma.jobOrder.createMany({ data: jobs, skipDuplicates: true });
    if (invoices.length) await prisma.invoice.createMany({ data: invoices, skipDuplicates: true });
    if (payments.length) await prisma.payment.createMany({ data: payments, skipDuplicates: true });
    if (records.length) await prisma.financialRecord.createMany({ data: records, skipDuplicates: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Restore gagal" }, { status: 500 });
  }
}
