import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface CompanyProfile {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith("/") ? `${getBaseUrl()}${url}` : url;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 34,
    paddingLeft: 46,
    paddingRight: 46,
    fontSize: 9,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
    color: "#0f172a",
  },
  header: {
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "2pt solid #020617",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  logoContainer: {
    width: 70,
    marginRight: 15,
  },
  logoImage: {
    width: 65,
    height: 65,
    objectFit: "contain",
  },
  logoFallback: {
    width: 65,
    height: 65,
    borderRadius: 8,
    border: "1.5pt solid #047857",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
  },
  logoFallbackText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#047857",
  },
  companyInfoContainer: {
    flex: 1,
    textAlign: "center",
    paddingRight: 70,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
    color: "#064e3b",
  },
  companyTagline: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  companyAddress: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.2,
  },
  titleContainer: {
    marginTop: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textDecoration: "underline",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#020617",
  },
  docNumber: {
    fontSize: 9,
    marginTop: 3,
    color: "#334155",
  },
  metaStrip: {
    flexDirection: "row",
    marginBottom: 12,
    borderRadius: 10,
    border: "1pt solid #d1fae5",
    backgroundColor: "#ecfdf5",
    overflow: "hidden",
  },
  metaCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRight: "1pt solid #d1fae5",
  },
  metaCellLast: {
    borderRight: "0pt solid #d1fae5",
  },
  metaLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#059669",
    marginBottom: 2,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#064e3b",
  },
  paragraph: {
    fontSize: 9.2,
    color: "#1e293b",
    textAlign: "justify",
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
    borderRadius: 10,
    border: "1pt solid #e2e8f0",
    overflow: "hidden",
  },
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#064e3b",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionBody: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
  },
  row: {
    flexDirection: "row",
    minHeight: 18,
    borderBottom: "0.5pt solid #f1f5f9",
    paddingVertical: 3,
  },
  rowLast: {
    borderBottom: "0pt solid #ffffff",
  },
  label: {
    width: 135,
    fontSize: 8.2,
    color: "#64748b",
    fontWeight: "bold",
  },
  separator: {
    width: 12,
    fontSize: 8.2,
    color: "#94a3b8",
  },
  value: {
    flex: 1,
    fontSize: 8.6,
    color: "#0f172a",
    fontWeight: "bold",
  },
  declarationBox: {
    marginTop: 2,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    border: "1pt solid #fde68a",
    backgroundColor: "#fffbeb",
  },
  declarationText: {
    fontSize: 8.5,
    color: "#78350f",
    textAlign: "justify",
  },
  signatureSection: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  signatureBox: {
    width: 220,
    minHeight: 116,
    textAlign: "center",
    borderRadius: 12,
    border: "1pt solid #e2e8f0",
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  signatureLocation: {
    fontSize: 8,
    color: "#334155",
    marginBottom: 5,
  },
  signatureRole: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#064e3b",
    textTransform: "uppercase",
  },
  signatureSubRole: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
  },
  signatureSpace: {
    height: 38,
  },
  signatureName: {
    fontWeight: "bold",
    fontSize: 8.5,
    color: "#020617",
    textDecoration: "underline",
  },
  signatureHint: {
    fontSize: 6.8,
    color: "#94a3b8",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 46,
    right: 46,
    paddingTop: 6,
    borderTop: "0.75pt solid #cbd5e1",
    textAlign: "center",
  },
  footerText: {
    fontSize: 6.8,
    color: "#64748b",
  },
  footerStrong: {
    fontSize: 7,
    color: "#064e3b",
    fontWeight: "bold",
  },
});

export const SampleHandoverPDF = ({
  data,
  company = {
    company_name: "WahfaLab",
    address: "Jl. Laboratorium No. 123, Jakarta",
    phone: "(021) 1234-5678",
    email: "info@wahfalab.com",
    logo_url: "/logo-wahfalab.png",
    tagline: "Laboratorium Analisis & Kalibrasi",
  },
}: {
  data: any;
  company?: CompanyProfile;
}) => {
  const createdAt = data.created_at || data.received_at || new Date().toISOString();
  const dateStr = new Date(createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const logoUrl = resolveAssetUrl(company.logo_url || "/logo-wahfalab.png");
  const quotation = data.job_order?.quotation || data.quotation || {};
  const profile = quotation.profile || data.profile || {};
  const customerName =
    profile.company_name ||
    profile.full_name ||
    data.customer_name ||
    "-";
  const quotationNumber = quotation.quotation_number || data.quotation_number || "-";
  const trackingCode = data.job_order?.tracking_code || data.tracking_code || "-";

  return (
    <Document title={`BAST Sampel - ${data.handover_number || trackingCode}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>W</Text>
                </View>
              )}
            </View>
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyName}>{company.company_name}</Text>
              <Text style={styles.companyTagline}>
                {company.tagline || "Laboratorium Analisis Lingkungan"}
              </Text>
              <Text style={styles.companyAddress}>{company.address || "-"}</Text>
              <Text style={styles.companyAddress}>
                {company.phone ? `Telp: ${company.phone}` : ""}
                {company.email ? ` | Email: ${company.email}` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Berita Acara Serah Terima Sampel</Text>
          <Text style={styles.docNumber}>Nomor: {data.handover_number || "-"}</Text>
        </View>

        <View style={styles.metaStrip}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Tanggal Terima</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Waktu</Text>
            <Text style={styles.metaValue}>{timeStr} WIB</Text>
          </View>
          <View style={[styles.metaCell, styles.metaCellLast]}>
            <Text style={styles.metaLabel}>Status Dokumen</Text>
            <Text style={styles.metaValue}>Tervalidasi Sistem</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          Pada tanggal tersebut di atas telah dilakukan serah terima sampel dari petugas
          lapangan kepada analis laboratorium untuk diproses sesuai ruang lingkup pengujian
          yang tercatat pada sistem manajemen laboratorium.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I. Informasi Pekerjaan</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Text style={styles.label}>Kode Tracking</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{trackingCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nomor Penawaran</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{quotationNumber}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>Klien / Perusahaan</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{customerName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>II. Rincian Kondisi Sampel</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Text style={styles.label}>Jumlah Wadah / Titik</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_qty || "-"} Unit/Botol</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kondisi Fisik / Segel</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_condition || "-"}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>Catatan Tambahan</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_notes || data.notes || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.declarationBox}>
          <Text style={styles.declarationText}>
            Dengan ditandatanganinya dokumen ini, sampel dinyatakan telah diterima oleh
            laboratorium untuk dilakukan proses analisis. Dokumen ini menjadi dasar
            dimulainya pekerjaan pengujian dan tercatat secara elektronik di sistem WahfaLab.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLocation}>Cianjur, {dateStr}</Text>
            <Text style={styles.signatureRole}>Yang Menyerahkan</Text>
            <Text style={styles.signatureSubRole}>Petugas Lapangan</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>{data.sender?.full_name || "-"}</Text>
            <Text style={styles.signatureHint}>Nama jelas dan tanda tangan</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLocation}>Cianjur, {dateStr}</Text>
            <Text style={styles.signatureRole}>Yang Menerima</Text>
            <Text style={styles.signatureSubRole}>Analis Laboratorium</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>{data.receiver?.full_name || "-"}</Text>
            <Text style={styles.signatureHint}>Nama jelas dan tanda tangan</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerStrong}>{company.company_name} - Dokumen Digital Laboratorium</Text>
          <Text style={styles.footerText}>
            Dokumen ini diterbitkan melalui sistem manajemen laboratorium dan dapat diverifikasi
            berdasarkan nomor BAST serta kode tracking pekerjaan.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default SampleHandoverPDF;
