import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperadminEmail } from "@/lib/superadmin";

function csvEscape(value: unknown) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }
  return raw;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

function toSqlInsert(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return `-- ${table}: empty`;
  const cols = Object.keys(rows[0]);
  const values = rows
    .map((row) => {
      const cells = cols.map((c) => {
        const v = row[c];
        if (v == null) return "NULL";
        if (typeof v === "number" || typeof v === "bigint") return String(v);
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
        const text = typeof v === "object" ? JSON.stringify(v) : String(v);
        return `'${text.replaceAll("'", "''")}'`;
      });
      return `(${cells.join(", ")})`;
    })
    .join(",\n");

  return `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES\n${values};`;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperadminEmail();
    const format = request.nextUrl.searchParams.get("format") || "json";
    const table = request.nextUrl.searchParams.get("table");

    const [profiles, quotations, jobs, invoices, payments, records] = await Promise.all([
      prisma.profile.findMany(),
      prisma.quotation.findMany(),
      prisma.jobOrder.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
      prisma.financialRecord.findMany(),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      profiles,
      quotations,
      jobs,
      invoices,
      payments,
      financial_records: records,
    };

    const tableMap: Record<string, any[]> = {
      profiles: profiles as any[],
      quotations: quotations as any[],
      job_orders: jobs as any[],
      invoices: invoices as any[],
      payments: payments as any[],
      financial_records: records as any[],
    };

    if (table) {
      const picked = tableMap[table];
      if (!picked) return NextResponse.json({ error: "Table tidak didukung" }, { status: 400 });

      if (format === "json") {
        return new NextResponse(JSON.stringify({ table, rows: picked }, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename=\"backup-${table}-${Date.now()}.json\"`,
          },
        });
      }
      if (format === "csv") {
        return new NextResponse(toCsv(picked), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"backup-${table}-${Date.now()}.csv\"`,
          },
        });
      }
      if (format === "sql") {
        return new NextResponse(toSqlInsert(table, picked), {
          headers: {
            "Content-Type": "application/sql; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"backup-${table}-${Date.now()}.sql\"`,
          },
        });
      }
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=\"backup-${Date.now()}.json\"`,
        },
      });
    }

    if (format === "csv") {
      const blocks = [
        ["profiles", toCsv(profiles as any[])],
        ["quotations", toCsv(quotations as any[])],
        ["job_orders", toCsv(jobs as any[])],
        ["invoices", toCsv(invoices as any[])],
        ["payments", toCsv(payments as any[])],
        ["financial_records", toCsv(records as any[])],
      ]
        .map(([name, csv]) => `### ${name}\n${csv}`)
        .join("\n\n");

      return new NextResponse(blocks, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"backup-${Date.now()}.csvbundle.txt\"`,
        },
      });
    }

    if (format === "sql") {
      const sql = [
        "-- Superadmin SQL backup (PostgreSQL-oriented)",
        `-- generated_at: ${new Date().toISOString()}`,
        "BEGIN;",
        toSqlInsert("profiles", profiles as any[]),
        toSqlInsert("quotations", quotations as any[]),
        toSqlInsert("job_orders", jobs as any[]),
        toSqlInsert("invoices", invoices as any[]),
        toSqlInsert("payments", payments as any[]),
        toSqlInsert("financial_records", records as any[]),
        "COMMIT;",
      ].join("\n\n");

      return new NextResponse(sql, {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"backup-${Date.now()}.sql\"`,
        },
      });
    }

    return NextResponse.json({ error: "Format tidak didukung" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
