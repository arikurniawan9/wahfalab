import { auth } from "@/lib/auth";

function parseSuperadminEmails() {
  const raw = process.env.SUPERADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmail(email?: string | null) {
  if (!email) return false;
  return parseSuperadminEmails().includes(email.toLowerCase());
}

export async function requireSuperadminEmail() {
  const session = await auth();
  const email = session?.user?.email || null;

  if (!email || !isSuperadminEmail(email)) {
    throw new Error("Forbidden");
  }

  return { email };
}
