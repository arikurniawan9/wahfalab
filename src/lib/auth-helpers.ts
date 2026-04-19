import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  return await prisma.profile.findUnique({
    where: { email: user.email },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (!roles.includes(role)) {
    redirect("/access-denied");
  }
  
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getRedirectPath(role: string): Promise<string> {
  switch (role) {
    case "admin":
      return "/admin";
    case "content_manager":
      return "/content-manager";
    case "operator":
      return "/operator";
    case "field_officer":
      return "/field";
    case "finance":
      return "/finance";
    case "analyst":
      return "/analyst";
    case "reporting":
      return "/reporting";
    default:
      return "/dashboard";
  }
}
