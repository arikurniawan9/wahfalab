import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

type CompanyProfile = {
  company_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
};

type BankAccount = {
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  balance?: number | null;
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

type BankLedgerPDFProps = {
  company?: CompanyProfile | null;
  bank: BankAccount;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netMovement: number;
    transactionCount: number;
  };
  transactions: LedgerTransaction[];
  startDate?: string;
  endDate?: string;
  isCashAccount?: boolean;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 34,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.35
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#065f46",
    paddingBottom: 10,
    marginBottom: 14
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12
  },
  logo: {
    width: 54,
    height: 54,
    objectFit: "contain"
  },
  brandText: {
    flex: 1
  },
  companyName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#065f46",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  companyMeta: {
    fontSize: 7.5,
    color: "#475569",
    marginTop: 2
  },
  reportTitleBlock: {
    alignItems: "flex-end"
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#065f46",
    textTransform: "uppercase"
  },
  reportSubtitle: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 2
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f0fdf4"
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#047857",
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 4
  },
  bankBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#ffffff"
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827"
  },
  bankMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  bankMeta: {
    fontSize: 8,
    color: "#374151"
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#065f46",
    color: "#ffffff"
  },
  th: {
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  tr: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9"
  },
  td: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 7.8,
    color: "#1f2937"
  },
  footer: {
    marginTop: 12,
    fontSize: 7.2,
    color: "#6b7280"
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

export function BankLedgerPDF({
  company,
  bank,
  summary,
  transactions,
  startDate,
  endDate,
  isCashAccount
}: BankLedgerPDFProps) {
  const logoUrl = company?.logo_url || "";
  const reportRange =
    startDate || endDate
      ? `${startDate || "Awal"} s.d. ${endDate || "Akhir"}`
      : "Seluruh periode";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View style={styles.brandText}>
              <Text style={styles.companyName}>{company?.company_name || "WahfaLab"}</Text>
              <Text style={styles.companyMeta}>{company?.tagline || "Laboratorium Analisis & Kalibrasi"}</Text>
              <Text style={styles.companyMeta}>{company?.address || "-"}</Text>
              <Text style={styles.companyMeta}>
                {company?.phone || "-"} | {company?.email || "-"}
              </Text>
            </View>
          </View>
          <View style={styles.reportTitleBlock}>
            <Text style={styles.reportTitle}>Laporan Mutasi Rekening</Text>
            <Text style={styles.reportSubtitle}>{reportRange}</Text>
          </View>
        </View>

        <View style={styles.bankBox}>
          <Text style={styles.bankTitle}>{isCashAccount ? "Kas Tunai" : "Rekening Bank"}</Text>
          <View style={styles.bankMetaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankMeta}>Bank: {bank.bank_name || "-"}</Text>
              <Text style={styles.bankMeta}>Nomor: {bank.account_number || "-"}</Text>
              <Text style={styles.bankMeta}>Pemilik: {bank.account_holder || "-"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankMeta}>Saldo saat ini: {money(Number(bank.balance || 0))}</Text>
              <Text style={styles.bankMeta}>Total transaksi: {summary.transactionCount}</Text>
              <Text style={styles.bankMeta}>{isCashAccount ? "Rekening sistem untuk pencatatan cash" : "Audit mutasi rekening aktif"}</Text>
            </View>
          </View>
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Movement</Text>
            <Text style={[styles.summaryValue, { color: summary.netMovement >= 0 ? "#047857" : "#b91c1c" }]}>
              {money(summary.netMovement)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: "20%" }]}>Tanggal</Text>
            <Text style={[styles.th, { width: "12%" }]}>Jenis</Text>
            <Text style={[styles.th, { width: "18%" }]}>Kategori</Text>
            <Text style={[styles.th, { width: "30%" }]}>Deskripsi</Text>
            <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Jumlah</Text>
            <Text style={[styles.th, { width: "8%" }]}>Pic</Text>
          </View>

          {transactions.map((item) => (
            <View key={item.id} style={styles.tr}>
              <Text style={[styles.td, { width: "20%" }]}>{formatDate(item.transaction_date)}</Text>
              <Text style={[styles.td, { width: "12%" }]}>{item.type === "income" ? "Masuk" : "Keluar"}</Text>
              <Text style={[styles.td, { width: "18%" }]}>{String(item.category || "").replace(/_/g, " ")}</Text>
              <Text style={[styles.td, { width: "30%" }]}>{item.description}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{item.type === "income" ? `+ ${money(Number(item.amount))}` : `- ${money(Number(item.amount))}`}</Text>
              <Text style={[styles.td, { width: "8%" }]}>{item.handler?.full_name || "System"}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Dokumen ini diterbitkan secara elektronik oleh sistem WahfaLab dan dapat digunakan untuk keperluan audit internal.
        </Text>
      </Page>
    </Document>
  );
}
