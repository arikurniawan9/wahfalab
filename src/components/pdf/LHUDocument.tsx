import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: "auto",
  },
  headerText: {
    marginLeft: 15,
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#064e3b",
  },
  companySub: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#064e3b",
    textDecoration: "underline",
  },
  subTitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    fontWeight: "bold",
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontWeight: "bold",
    color: "#64748b",
  },
  value: {
    flex: 1,
    fontWeight: "bold",
    color: "#1e293b",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#064e3b",
    color: "white",
    fontWeight: "bold",
    minHeight: 25,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    minHeight: 25,
    paddingVertical: 5,
    alignItems: "center",
  },
  colNo: { width: "5%", textAlign: "center" },
  colParam: { width: "35%", paddingLeft: 8 },
  colUnit: { width: "10%", textAlign: "center" },
  colLimit: { width: "15%", textAlign: "center" },
  colResult: { width: "15%", textAlign: "center" },
  colMethod: { width: "20%", paddingLeft: 5 },
  
  resultQualified: {
    color: "#059669",
    fontWeight: "bold",
  },
  resultNotQualified: {
    color: "#dc2626",
    fontWeight: "bold",
  },

  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signBox: {
    width: 200,
    textAlign: "center",
    padding: 10,
  },
  signTitle: {
    fontSize: 9,
    marginBottom: 50,
    color: "#64748b",
  },
  signName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    textDecoration: "underline",
  },
  signRole: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  note: {
    marginTop: 20,
    fontSize: 7,
    color: "#94a3b8",
    fontStyle: "italic",
  }
});

export const LHUDocument = ({ data }: { data: any }) => {
  return (
    <Document title={`LHU-${data.report_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo-wahfalab.png" style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>WahfaLab</Text>
            <Text style={styles.companySub}>Laboratorium Pengujian Lingkungan & Kalibrasi Terakreditasi</Text>
            <Text style={styles.companySub}>ISO/IEC 17025:2017 Certified Laboratory</Text>
          </View>
        </View>

        <Text style={styles.title}>LAPORAN HASIL UJI</Text>
        <Text style={styles.subTitle}>Nomor: {data.report_number}</Text>

        {/* Administration Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pelanggan</Text>
              <Text style={styles.value}>: {data.company_name || data.client_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Alamat</Text>
              <Text style={styles.value}>: {data.address || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Jenis Sampel</Text>
              <Text style={styles.value}>: {data.sample_type || "-"}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tgl Sampling</Text>
              <Text style={styles.value}>: {data.sampling_date ? new Date(data.sampling_date).toLocaleDateString("id-ID") : "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tgl Terima</Text>
              <Text style={styles.value}>: {data.received_date ? new Date(data.received_date).toLocaleDateString("id-ID") : "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tgl Analisis</Text>
              <Text style={styles.value}>: {data.analysis_date ? new Date(data.analysis_date).toLocaleDateString("id-ID") : "-"}</Text>
            </View>
          </View>
        </View>

        {/* Results Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colParam}>Parameter Uji</Text>
            <Text style={styles.colUnit}>Satuan</Text>
            <Text style={styles.colLimit}>Baku Mutu</Text>
            <Text style={styles.colResult}>Hasil</Text>
            <Text style={styles.colMethod}>Metode</Text>
          </View>

          {data.items?.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colParam}>{item.parameter}</Text>
              <Text style={styles.colUnit}>{item.unit || "-"}</Text>
              <Text style={styles.colLimit}>{item.standard_value || "-"}</Text>
              <Text style={[styles.colResult, item.is_qualified === false ? styles.resultNotQualified : styles.resultQualified]}>
                {item.result_value}
              </Text>
              <Text style={styles.colMethod}>{item.method || "SOP Internal"}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 8, marginBottom: 10 }}>
          Keterangan: Baku mutu sesuai dengan {data.regulation?.name || "persyaratan pelanggan"}.
        </Text>

        {/* Signature Section */}
        <View style={styles.footer}>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Diterbitkan di Jakarta, {new Date(data.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.signName}>Manajer Teknis</Text>
            <Text style={styles.signRole}>( WahfaLab Authority )</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Text>1. Hasil uji ini hanya berlaku untuk sampel yang diuji.</Text>
          <Text>2. Laporan Hasil Uji ini tidak boleh digandakan tanpa persetujuan tertulis dari WahfaLab.</Text>
          <Text>3. Pengaduan terhadap hasil uji maksimal 7 hari setelah LHU diterima.</Text>
        </View>
      </Page>
    </Document>
  );
};
