import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuperadminHomePage() {
  const [staffTotal, adminTotal, auditTotal, backupReady] = await Promise.all([
    prisma.profile.count({ where: { role: { not: "client" } } }),
    prisma.profile.count({ where: { role: "admin" } }),
    prisma.auditLog.count(),
    prisma.profile.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900">Dashboard Superadmin</h2>
        <p className="mt-2 text-sm text-slate-600">
        Area ini khusus pengelolaan staff lintas role, audit histori, serta backup dan restore data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Staff" value={staffTotal} tone="cyan" />
        <StatCard title="Akun Admin" value={adminTotal} tone="indigo" />
        <StatCard title="Audit Logs" value={auditTotal} tone="amber" />
        <StatCard title="Dataset Siap Backup" value={backupReady} tone="emerald" />
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 text-slate-900 shadow-sm animate-in fade-in duration-500">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Secure Operations</p>
        <h3 className="mt-2 text-xl font-black">Mode Superadmin Aktif</h3>
        <p className="mt-1 text-sm text-slate-600">
          Semua aksi di area ini bersifat high-privilege. Selalu verifikasi perubahan akun, rotasi password, dan backup sebelum restore.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Manajemen Staff" desc="Kelola seluruh akun termasuk admin." href="/superadmin/staff" />
        <Card title="Histori Staff" desc="Pantau histori manajemen akun staff." href="/superadmin/staff/history" />
        <Card title="Backup & Restore" desc="Export JSON/CSV/SQL dan restore backup." href="/superadmin/backup" />
      </div>
    </div>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-1">
      <h3 className="font-black text-slate-900 group-hover:text-emerald-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </a>
  );
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "cyan" | "indigo" | "amber" | "emerald";
}) {
  const toneMap = {
    cyan: "from-cyan-500 to-sky-600",
    indigo: "from-indigo-500 to-violet-600",
    amber: "from-amber-500 to-orange-600",
    emerald: "from-emerald-500 to-teal-600",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${toneMap[tone]}`} />
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
