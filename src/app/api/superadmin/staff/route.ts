import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperadminEmail } from "@/lib/superadmin";
import { logAudit } from "@/lib/audit-log";
import { UserRole } from "@/generated/prisma";

const ALLOWED_STAFF_ROLES = new Set<string>([
  UserRole.admin,
  UserRole.operator,
  UserRole.field_officer,
  UserRole.finance,
  UserRole.analyst,
  UserRole.reporting,
  UserRole.content_manager,
]);

export async function GET(request: NextRequest) {
  try {
    await requireSuperadminEmail();
    const params = request.nextUrl.searchParams;
    const search = params.get("search") || "";
    const page = Math.max(1, Number(params.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, Number(params.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const where: any = {
      role: { not: "client" },
    };

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          created_at: true,
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return NextResponse.json({
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email } = await requireSuperadminEmail();
    const body = await request.json();
    const userId = String(body.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "userId wajib" }, { status: 400 });
    }

    const data: any = {};
    if (typeof body.full_name === "string") data.full_name = body.full_name;
    if (typeof body.email === "string") data.email = body.email;
    if (typeof body.role === "string") {
      if (!ALLOWED_STAFF_ROLES.has(body.role)) {
        return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
      }
      data.role = body.role;
    }
    if (typeof body.phone === "string") data.phone = body.phone;
    if (typeof body.address === "string") data.address = body.address;

    const before = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, full_name: true, phone: true, address: true },
    });

    const updated = await prisma.profile.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        created_at: true,
      },
    });

    await logAudit({
      action: "superadmin_update_staff",
      entity_type: "profile",
      entity_id: userId,
      user_email: email,
      old_data: before,
      new_data: updated,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal update staff" }, { status: 500 });
  }
}
