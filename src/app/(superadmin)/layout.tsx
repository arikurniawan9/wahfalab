import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSuperadminEmail } from "@/lib/superadmin";
import { Shield, Users, History, Database, Home, Menu } from "lucide-react";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) redirect("/login");
  if (!isSuperadminEmail(email)) redirect("/access-denied");

  const nav = [
    { href: "/superadmin", label: "Beranda", icon: Home },
    { href: "/superadmin/staff", label: "Manajemen Staff", icon: Users },
    { href: "/superadmin/staff/history", label: "Histori Staff", icon: History },
    { href: "/superadmin/backup", label: "Backup & Restore", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">SUPERADMIN CONTROL</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700/80">High Privilege Workspace</p>
            </div>
          </div>
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {nav.map((item) => (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          <nav className="hidden flex-wrap gap-2 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
