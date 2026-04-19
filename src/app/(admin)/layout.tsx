import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PremiumPageWrapper } from "@/components/layout/PremiumPageWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user || null;

  if (!user) {
    redirect("/login");
  }

  // Double Check Role di level Server Component (Absolute Security)
  const profile = await prisma.profile.findUnique({
    where: { email: user.email! },
    select: { role: true, full_name: true, email: true }
  });

  if (!profile || profile.role !== "admin") {
    console.log("Layout Security - Access Denied for ID:", user.id, "Role:", profile?.role);
    redirect("/access-denied");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title="Dashboard Admin" 
          subtitle="Kelola laboratorium Anda"
          profile={{ 
            full_name: profile.full_name, 
            email: profile.email, 
            role: profile.role 
          }} 
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-24 md:pb-0">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <PremiumPageWrapper>
              {children}
            </PremiumPageWrapper>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
