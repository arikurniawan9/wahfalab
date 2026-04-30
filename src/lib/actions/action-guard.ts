"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma";

export async function requireActionRole(allowedRoles: readonly UserRole[]) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, full_name: true, role: true },
  });

  if (!profile) {
    throw new Error("Unauthorized");
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error("Forbidden");
  }

  return profile;
}
