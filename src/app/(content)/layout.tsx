import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getProfile } from "@/lib/actions/auth";

export default async function ContentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          profile={profile ? {
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role
          } : undefined} 
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
