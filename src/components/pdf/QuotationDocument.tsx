import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Registering a font. Using a standard one to avoid embedding issues.
// Let's assume a simple sans-serif font is close enough.
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "" }, // default
    { src: "", fontWeight: "bold" },
    { src: "", fontStyle: "italic" },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 42,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },
  // Header
  header: {
    marginBottom: 10,
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 78,
    height: 36,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4b5563",
    marginLeft: 4,
    letterSpacing: -0.3,
  },
  quotationBar: {
    backgroundColor: "#067a62",
    height: 18,
    justifyContent: "center",
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  quotationTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
    fontStyle: "italic",
    letterSpacing: 0.4,
  },
  headerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
    fontSize: 9,
  },
  headerLeft: {
    width: "58%",
    fontSize: 9,
  },
  headerRight: {
    width: "42%",
    fontSize: 9,
    alignItems: "flex-end",
  },
  leftLabel: {
    width: 76,
    fontWeight: "bold",
  },
  leftValue: {
    flex: 1,
    fontWeight: "bold",
    color: "#111827",
  },
  rightLabel: {
    width: 52,
    textAlign: "right",
    fontWeight: "bold",
  },
  rightValue: {
    width: 120,
    textAlign: "right",
    color: "#111827",
  },
  recipientBlock: {
    marginTop: 2,
    marginBottom: 8,
  },
  perihalRow: {
    flexDirection: 'row',
    marginTop: 0,
    marginBottom: 0,
    alignItems: "flex-start",
  },
  // Body
  perihal: {
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 1.1,
    fontWeight: "bold",
  },
  openingText: {
    marginBottom: 2,
    lineHeight: 1.2, // A little space for paragraph readability
  },
  // Table
  table: {
    width: "auto",
    borderStyle: "solid",
    borderTopWidth: 1.5,
    borderTopColor: "#059669",
    borderBottomWidth: 1.5,
    borderBottomColor: "#059669",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#059669",
    color: "white",
    fontWeight: "bold",
    minHeight: 22, // reduced
    alignItems: "center",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    paddingVertical: 3, // reduced
  },
  // Table Columns
  colNo: { width: "5%", textAlign: "center", paddingVertical: 2 },
  colDesc: { width: "40%", paddingHorizontal: 5 },
  colSatuan: { width: "10%", textAlign: "center" },
  colVol: { width: "8%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right", paddingRight: 5 },
  colTotal: { width: "19%", textAlign: "right", paddingRight: 5 },
  // Table Cell Content
  itemUraian: {
    fontWeight: "bold",
    fontSize: 8.5,
  },
  itemDetail: {
    fontSize: 7.5,
    color: "#475569",
    paddingLeft: 4,
    marginTop: 2,
    lineHeight: 1.2,
  },
  notes: {
    marginTop: 5, // reduced
    fontSize: 8,
  },
  // Summary Section (right aligned)
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 3, // reduced
  },
  summaryTable: {
    width: "45%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2, // reduced
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  summaryLabel: {
    textAlign: "left",
    fontSize: 8.5,
  },
  summaryValue: {
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 8.5,
  },
  grandTotalRow: {
    backgroundColor: "#059669",
    color: "white",
    fontWeight: "bold",
    paddingVertical: 3, // added padding
  },
  // Footer
  closingText: {
    marginTop: 12, // reduced
    fontSize: 9,
  },
  syaratBox: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 8, // reduced
    marginTop: 12, // reduced
  },
  syaratTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4, // reduced
    fontSize: 8.5,
  },
  syaratItem: {
    fontSize: 7.5,
    lineHeight: 1.3, // reduced
  },
  signatureSection: {
    marginTop: 15, // reduced
    flexDirection: "row",
    justifyContent: "space-between",
    textAlign: "center",
  },
  signBox: {
    width: "30%",
    paddingTop: 8, // reduced
  },
  signTitle: {
    fontSize: 8, // reduced
    marginBottom: 45, // reduced
  },
qrPlaceholder: {
    height: 50, // reduced
    width: 50, // reduced
    border: "1px solid #e2e8f0",
    margin: "auto",
    marginBottom: 4, // reduced
  },
  signName: {
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 4, // reduced
    fontSize: 8.5,
  },
  signPosition: {
    fontSize: 8, // reduced
  },
  pageFooter: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7, // reduced
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#059669",
    paddingTop: 4, // reduced
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 10,
    right: 40,
    color: 'grey',
  },
});

export const QuotationDocument = ({ data }: any) => {
  return (
      <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBrandRow}>
            <Image src="/logo-wahfalab.png" style={styles.logo} />
            <Text style={styles.companyName}>Wahfalab</Text>
          </View>

          <View style={styles.quotationBar}>
            <Text style={styles.quotationTitle}>QUOTATION</Text>
          </View>

          <View style={styles.headerInfoRow}>
              <View style={styles.headerLeft}>
                <View style={styles.headerInfoRow}>
                  <Text style={styles.leftLabel}>Kepada Yth</Text>
                  <Text style={styles.leftValue}>: {data.profile?.company_name || "PT. ABCD"}</Text>
                </View>
                <View style={styles.headerInfoRow}>
                  <Text style={styles.leftLabel}>Nama</Text>
                  <Text style={styles.leftValue}>: {data.profile?.full_name || "Bpk/Ibu"}</Text>
                </View>
                <View style={styles.headerInfoRow}>
                  <Text style={styles.leftLabel}>Alamat</Text>
                  <Text style={styles.leftValue}>: {data.profile?.address || "Jl."}</Text>
                </View>
                <View style={styles.headerInfoRow}>
                  <Text style={styles.leftLabel}>Lokasi Sampling</Text>
                  <Text style={styles.leftValue}>: {data.sampling_location || data.title || "-"}</Text>
                </View>
              </View>

            <View style={{ ...styles.headerRight, width: "40%" }}>
              <View style={styles.headerInfoRow}>
                <Text style={styles.rightLabel}>Tanggal</Text>
                <Text style={styles.rightValue}>: {new Date(data.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</Text>
              </View>
              <View style={styles.headerInfoRow}>
                <Text style={styles.rightLabel}>Nomor</Text>
                <Text style={styles.rightValue}>: {data.quotation_number}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.recipientBlock}>
          <View style={styles.perihalRow}>
            <Text style={styles.leftLabel}>Perihal</Text>
            <Text style={styles.leftValue}>: {data.title || "Penawaran Jasa Pengujian Lingkungan"}</Text>
          </View>
        </View>

        <Text style={styles.openingText}>Dengan Hormat,</Text>
        <Text style={styles.openingText}>
          Menindaklanjuti permintaan penawaran harga perihal tersebut di atas, dengan ini kami sampaikan rincian penawaran harga sebagai berikut:
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, { paddingVertical: 0 }]}>No</Text>
            <Text style={[styles.colDesc, { textAlign: "center" }]}>Uraian</Text>
            <Text style={styles.colSatuan}>Satuan</Text>
            <Text style={styles.colVol}>Vol</Text>
            <Text style={styles.colPrice}>Harga Satuan</Text>
            <Text style={styles.colTotal}>Jumlah</Text>
          </View>

          {data?.items?.map((item: any, index: number) => {
            const itemName = item.name || item.service?.name || item.equipment?.name || "Item Layanan/Alat";
            let parameterList = item.parameter_snapshot || "";
            if (!parameterList && item.service?.parameters) {
              try {
                const params = typeof item.service.parameters === 'string' ? JSON.parse(item.service.parameters) : item.service.parameters;
                parameterList = Array.isArray(params) ? params.map((p: any) => p.name).join(", ") : "";
              } catch (e) { /* ignore */ }
            }

            return (
              <View key={`item-${index}`} style={styles.tableRow} wrap={false}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.itemUraian}>{itemName}</Text>
                  {(item.service?.regulation || item.service?.regulation_ref?.name) && (
                    <Text style={styles.itemDetail}>Regulasi: {item.service?.regulation || item.service?.regulation_ref?.name}</Text>
                  )}
                  {parameterList && <Text style={styles.itemDetail}>Parameter: {parameterList}</Text>}
                </View>
                <Text style={styles.colSatuan}>{item.service?.unit || "Titik"}</Text>
                <Text style={styles.colVol}>{item.qty}</Text>
                <Text style={styles.colPrice}>Rp {Number(item.price_snapshot).toLocaleString("id-ID")}</Text>
                <Text style={styles.colTotal}>Rp {(Number(item.qty) * Number(item.price_snapshot)).toLocaleString("id-ID")}</Text>
              </View>
            );
          })}
          
          {Number(data.perdiem_price) > 0 && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={styles.colNo}>{data.items.length + 1}</Text>
              <Text style={styles.colDesc}>{data.perdiem_name || 'Engineer/Perdiem'}</Text>
              <Text style={styles.colSatuan}>Hari</Text>
              <Text style={styles.colVol}>{data.perdiem_qty}</Text>
              <Text style={styles.colPrice}>Rp {Number(data.perdiem_price).toLocaleString("id-ID")}</Text>
              <Text style={styles.colTotal}>Rp {(Number(data.perdiem_qty) * Number(data.perdiem_price)).toLocaleString("id-ID")}</Text>
            </View>
          )}

          {Number(data.transport_price) > 0 && (
             <View style={styles.tableRow} wrap={false}>
              <Text style={styles.colNo}>{data.items.length + (Number(data.perdiem_price) > 0 ? 2 : 1)}</Text>
              <Text style={styles.colDesc}>{data.transport_name || 'Transportasi dan Akomodasi'}</Text>
              <Text style={styles.colSatuan}>Hari</Text>
              <Text style={styles.colVol}>{data.transport_qty}</Text>
              <Text style={styles.colPrice}>Rp {Number(data.transport_price).toLocaleString("id-ID")}</Text>
              <Text style={styles.colTotal}>Rp {(Number(data.transport_qty) * Number(data.transport_price)).toLocaleString("id-ID")}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.notes}>Notes: </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sub total</Text>
              <Text style={styles.summaryValue}>Rp {Number(data.subtotal).toLocaleString("id-ID")}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon</Text>
              <Text style={styles.summaryValue}>Rp {Number(data.discount_amount).toLocaleString("id-ID")}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>Rp {(Number(data.subtotal) - Number(data.discount_amount)).toLocaleString("id-ID")}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PPN 11%</Text>
              <Text style={styles.summaryValue}>Rp {Number(data.tax_amount).toLocaleString("id-ID")}</Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>Rp {Number(data.total_amount).toLocaleString("id-ID")}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.closingText}>
          Demikian penawaran ini kami sampaikan, atas perhatian serta kerjasama yang baik kami mengucapkan terima kasih.
        </Text>

        <View style={styles.syaratBox} wrap={false}>
          <Text style={styles.syaratTitle}>Syarat & Ketentuan</Text>
          <Text style={styles.syaratItem}>- Waktu Pengujian di Laboratorium 10 hari kerja sejak sampel diterima oleh Laboratorium</Text>
          <Text style={styles.syaratItem}>- Untuk kategori Udara, sudah termasuk parameter meteorologi (Suhu, Kecepatan Angin, Arah Angin, kelembaban & Cuaca)</Text>
          <Text style={styles.syaratItem}>- Bagi perusahaan yang tidak menerbitkan PO atau SPK, dapat menandatangani dan di stempel perusahaan pada penawaran harga yang kami sampaikan, sebagai Tanda Bukti Persetujuan Pelaksanaan Pekerjaan</Text>
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Dibuat Oleh</Text>
            <View style={styles.qrPlaceholder} />
            <Text style={styles.signName}>Bag. Marketing</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Disetujui Oleh</Text>
            <View style={styles.qrPlaceholder} />
            <Text style={styles.signName}>Direktur</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Persetujuan Customer</Text>
            <View style={{height: 65, marginBottom: 5}}/>
            <Text style={styles.signName}>*)Paraf, Nama, Tanggal & Stempel Perusahaan</Text>
          </View>
        </View>

        <View style={styles.pageFooter} fixed>
          <Image src="/logo-wahfalab.png" style={{width: 15, height: 'auto', position: 'absolute', left: 0, top: 5}}/>
          <Text>PT. WAHFA LAB INDONESIA</Text>
          <Text>Bangau Village Residence Ruko No. 1 Bojong, Karangtengah, Cianjur, Jawa Barat 43281</Text>
          <Text>wahfalabindonesia@gmail.com | 0858-6028-4760 | www.wahfalab.com</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};
