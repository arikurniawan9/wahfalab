import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed, or use defaults
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    paddingBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    width: "45%",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#bfbfbf",
    borderBottomWidth: 1,
    minHeight: 25,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  col1: { width: "5%", textAlign: "center", borderRightWidth: 1, borderColor: "#bfbfbf" },
  col2: { width: "45%", paddingLeft: 5, borderRightWidth: 1, borderColor: "#bfbfbf" },
  col3: { width: "10%", textAlign: "center", borderRightWidth: 1, borderColor: "#bfbfbf" },
  col4: { width: "20%", textAlign: "right", paddingRight: 5, borderRightWidth: 1, borderColor: "#bfbfbf" },
  col5: { width: "20%", textAlign: "right", paddingRight: 5 },
  summarySection: {
    marginLeft: "auto",
    width: "40%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 5,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureSpace: {
    height: 60,
  }
});

interface QuotationItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface QuotationProps {
  data: {
    quotation_number: string;
    date: string;
    client_name: string;
    company_name: string;
    items: QuotationItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
}

export const QuotationDocument = ({ data }: QuotationProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Kop Surat */}
      <View style={styles.header}>
        <Text style={styles.title}>WAHFA LAB</Text>
        <Text style={styles.subtitle}>Laboratorium Pengujian Lingkungan & Kalibrasi</Text>
        <Text style={styles.subtitle}>Jl. Contoh No. 123, Jakarta Selatan | Telp: (021) 12345678</Text>
      </View>

      <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "bold", marginBottom: 20, textDecoration: "underline" }}>
        PENAWARAN HARGA (QUOTATION)
      </Text>

      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Kepada Yth:</Text>
          <Text>{data.client_name}</Text>
          <Text>{data.company_name}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text><Text style={styles.label}>No. Penawaran: </Text>{data.quotation_number}</Text>
          <Text><Text style={styles.label}>Tanggal: </Text>{data.date}</Text>
        </View>
      </View>

      {/* Table Items */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>No</Text>
          <Text style={styles.col2}>Deskripsi Layanan</Text>
          <Text style={styles.col3}>Qty</Text>
          <Text style={styles.col4}>Harga Satuan</Text>
          <Text style={styles.col5}>Total</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.col1}>{index + 1}</Text>
            <Text style={styles.col2}>{item.name}</Text>
            <Text style={styles.col3}>{item.qty}</Text>
            <Text style={styles.col4}>{item.price.toLocaleString("id-ID")}</Text>
            <Text style={styles.col5}>{item.total.toLocaleString("id-ID")}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text>Subtotal</Text>
          <Text>Rp {data.subtotal.toLocaleString("id-ID")}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>PPN (11%)</Text>
          <Text>Rp {data.tax.toLocaleString("id-ID")}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text>TOTAL</Text>
          <Text>Rp {data.total.toLocaleString("id-ID")}</Text>
        </View>
      </View>

      {/* Footer / Signatures */}
      <View style={styles.footer} wrap={false}>
        <View style={styles.signatureBox}>
          <Text>Hormat Kami,</Text>
          <View style={styles.signatureSpace} />
          <Text style={{ fontWeight: "bold", textDecoration: "underline" }}>( Wahfa Lab Admin )</Text>
          <Text>Administrasi</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Menyetujui,</Text>
          <View style={styles.signatureSpace} />
          <Text style={{ fontWeight: "bold", textDecoration: "underline" }}>( ____________________ )</Text>
          <Text>Customer</Text>
        </View>
      </View>
    </Page>
  </Document>
);
