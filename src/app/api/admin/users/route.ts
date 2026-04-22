import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeData } from "@/lib/utils/serialize";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {
      NOT: [{ role: "admin" }, { role: "client" }],
    };

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company_name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.profile.count({ where }),
    ]);

    return NextResponse.json({
      users: serializeData(users),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load users" },
      { status: 500 }
    );
  }
}
