import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";
import { requireSuperadminEmail } from "@/lib/superadmin";
import { logAudit } from "@/lib/audit-log";

function generateTempPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await requireSuperadminEmail();
    const body = await request.json();
    const userId = String(body.userId || "");
    if (!userId) return NextResponse.json({ error: "userId wajib" }, { status: 400 });

    const tempPassword = generateTempPassword();
    const hashed = await hashPassword(tempPassword);
    await prisma.profile.update({
      where: { id: userId },
      data: { password: hashed },
    });
    await logAudit({
      action: "superadmin_reset_password",
      entity_type: "profile",
      entity_id: userId,
      user_email: email,
      metadata: { reset_method: "temporary_password" },
    });

    return NextResponse.json({ success: true, tempPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal reset password" }, { status: 500 });
  }
}
