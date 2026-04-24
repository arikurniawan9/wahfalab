import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ContentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user || null;

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { email: user.email },
    select: { role: true, full_name: true, email: true },
  });

  if (!profile || !["content_manager", "admin"].includes(profile.role)) {
    redirect("/access-denied");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          profile={{
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role
          }} 
          title="Content Manager"
          subtitle="Area Pengelolaan Website"
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
