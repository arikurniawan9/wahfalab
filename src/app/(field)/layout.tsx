import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double Check Role di level Server Component (Absolute Security)
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || profile.role !== "field_officer") {
    redirect("/access-denied");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-24 md:pb-0">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
