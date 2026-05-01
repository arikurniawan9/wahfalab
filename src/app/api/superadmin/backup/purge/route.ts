import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isSuperadminEmail, requireSuperadminEmail } from "@/lib/superadmin";
import type { Prisma } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email: actorEmail } = await requireSuperadminEmail();
    const body = (await request.json()) as { confirm?: string };

    if (body?.confirm !== "DELETE_ALL_EXCEPT_SUPERADMIN") {
      return NextResponse.json(
        { error: "Konfirmasi tidak valid. Gunakan: DELETE_ALL_EXCEPT_SUPERADMIN" },
        { status: 400 },
      );
    }

    const allProfiles = await prisma.profile.findMany({
      select: { id: true, email: true },
    });
    const keptSuperadminIds = allProfiles
      .filter((profile: { id: string; email: string | null }) => isSuperadminEmail(profile.email))
      .map((profile: { id: string; email: string | null }) => profile.id);

    if (keptSuperadminIds.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada akun superadmin yang terdeteksi. Operasi dibatalkan untuk keamanan." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.notification.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.approvalRequest.deleteMany();

      await tx.labReportItem.deleteMany();
      await tx.labReport.deleteMany();
      await tx.labAnalysis.deleteMany();
      await tx.travelOrder.deleteMany();
      await tx.sampleHandover.deleteMany();
      await tx.samplingAssignment.deleteMany();
      await tx.jobOrder.deleteMany();

      await tx.payment.deleteMany();
      await tx.invoice.deleteMany();
      await tx.financialRecord.deleteMany();
      await tx.quotationItem.deleteMany();
      await tx.quotation.deleteMany();

      await tx.operationalHistory.deleteMany();
      await tx.operationalCatalog.deleteMany();
      await tx.regulationParameter.deleteMany();
      await tx.regulation.deleteMany();
      await tx.service.deleteMany();
      await tx.serviceCategory.deleteMany();
      await tx.equipment.deleteMany();
      await tx.bankAccount.deleteMany();
      await tx.fieldAssistant.deleteMany();
      await tx.news.deleteMany();
      await tx.contactMessage.deleteMany();

      await tx.profile.deleteMany({
        where: {
          id: { notIn: keptSuperadminIds },
        },
      });

      return {
        keptSuperadmins: keptSuperadminIds.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Semua data selain akun superadmin berhasil dihapus.",
      keptSuperadmins: result.keptSuperadmins,
      actor: actorEmail,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menjalankan purge data" }, { status: 500 });
  }
}
