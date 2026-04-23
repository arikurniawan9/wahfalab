import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type CompanyProfile = {
  company_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
};

type LedgerTransaction = {
  id: string;
  transaction_date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  handler?: { full_name?: string | null } | null;
  bank_account?: {
    bank_name?: string | null;
    account_number?: string | null;
    account_holder?: string | null;
  } | null;
};

type TransactionLedgerPDFProps = {
  company?: CompanyProfile | null;
  filters: {
    type: string;
    bank: string;
    generatedAt: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netMovement: number;
    transactionCount: number;
  };
  transactions: LedgerTransaction[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 28,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#0f172a"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f766e",
    paddingBottom: 8,
    marginBottom: 10
  },
  brandSide: {
    flexDirection: "row",
    flexGrow: 1
  },
  logo: {
    width: 46,
    height: 46,
    marginRight: 10,
    objectFit: "contain"
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f766e",
    textTransform: "uppercase"
  },
  companyMeta: {
    fontSize: 7,
    marginTop: 2,
    color: "#475569"
  },
  titleSide: {
    alignItems: "flex-end"
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f766e",
    textTransform: "uppercase"
  },
  subtitle: {
    fontSize: 7,
    marginTop: 2,
    color: "#64748b"
  },
  filterBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8
  },
  filterTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  filterText: {
    fontSize: 7.5,
    color: "#334155",
    marginBottom: 1.5
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  summaryCard: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 8,
    padding: 7,
    backgroundColor: "#f0fdf4",
    marginRight: 6
  },
  summaryCardLast: {
    marginRight: 0
  },
  summaryLabel: {
    fontSize: 7,
    color: "#047857",
    textTransform: "uppercase",
    fontWeight: "bold"
  },
  summaryValue: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold"
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f766e"
  },
  th: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9"
  },
  td: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 7.3,
    color: "#1e293b"
  },
  footer: {
    marginTop: 8,
    fontSize: 6.8,
    color: "#64748b"
  }
});

const money = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount || 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const short = (value: string, max = 44) => {
  if (!value) return "-";
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
};

export function TransactionLedgerPDF({
  company,
  filters,
  summary,
  transactions
}: TransactionLedgerPDFProps) {
  const logoUrl = company?.logo_url || "";
  const generatedAt = new Date(filters.generatedAt).toLocaleString("id-ID");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandSide}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View>
              <Text style={styles.companyName}>{company?.company_name || "WahfaLab"}</Text>
              <Text style={styles.companyMeta}>{company?.tagline || "Laboratorium Analisis & Kalibrasi"}</Text>
              <Text style={styles.companyMeta}>{company?.address || "-"}</Text>
              <Text style={styles.companyMeta}>
                {company?.phone || "-"} | {company?.email || "-"}
              </Text>
            </View>
          </View>
          <View style={styles.titleSide}>
            <Text style={styles.title}>Laporan Riwayat Transaksi</Text>
            <Text style={styles.subtitle}>WahfaLab Finance Ledger</Text>
          </View>
        </View>

        <View style={styles.filterBox}>
          <Text style={styles.filterTitle}>Filter Laporan</Text>
          <Text style={styles.filterText}>Jenis: {filters.type}</Text>
          <Text style={styles.filterText}>Rekening: {filters.bank}</Text>
          <Text style={styles.filterText}>Dibuat: {generatedAt}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Masuk</Text>
            <Text style={[styles.summaryValue, { color: "#047857" }]}>{money(summary.totalIncome)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Keluar</Text>
            <Text style={[styles.summaryValue, { color: "#b91c1c" }]}>{money(summary.totalExpense)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardLast]}>
            <Text style={styles.summaryLabel}>Net Movement</Text>
            <Text style={[styles.summaryValue, { color: summary.netMovement >= 0 ? "#047857" : "#b91c1c" }]}>
              {money(summary.netMovement)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: "19%" }]}>Tanggal</Text>
            <Text style={[styles.th, { width: "11%" }]}>Jenis</Text>
            <Text style={[styles.th, { width: "14%" }]}>Kategori</Text>
            <Text style={[styles.th, { width: "29%" }]}>Deskripsi</Text>
            <Text style={[styles.th, { width: "17%" }]}>Rekening</Text>
            <Text style={[styles.th, { width: "10%", textAlign: "right" }]}>Jumlah</Text>
          </View>

          {transactions.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={[styles.td, { width: "19%" }]}>{formatDate(item.transaction_date)}</Text>
              <Text style={[styles.td, { width: "11%" }]}>{item.type === "income" ? "Masuk" : "Keluar"}</Text>
              <Text style={[styles.td, { width: "14%" }]}>{String(item.category || "").replace(/_/g, " ")}</Text>
              <Text style={[styles.td, { width: "29%" }]}>{short(item.description || "-", 58)}</Text>
              <Text style={[styles.td, { width: "17%" }]}>
                {item.bank_account ? short(`${item.bank_account.bank_name || "-"} ${item.bank_account.account_number || ""}`, 26) : "-"}
              </Text>
              <Text style={[styles.td, { width: "10%", textAlign: "right" }]}>
                {item.type === "income" ? `+ ${money(Number(item.amount || 0))}` : `- ${money(Number(item.amount || 0))}`}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Total transaksi: {summary.transactionCount}. Dokumen ini dihasilkan otomatis oleh sistem WahfaLab.
        </Text>
      </Page>
    </Document>
  );
}
