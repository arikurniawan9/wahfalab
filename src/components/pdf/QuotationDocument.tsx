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
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: "auto",
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#064e3b",
  },
  companySub: {
    fontSize: 7,
    color: "#666",
    marginTop: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 15,
    color: "#064e3b",
    textTransform: "uppercase"
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 5,
  },
  infoCol: {
    width: "48%",
  },
  label: {
    fontWeight: "bold",
    color: "#064e3b",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 15,
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
    minHeight: 30,
    paddingVertical: 5,
  },
  colNo: { width: "6%", textAlign: "center" },
  colDesc: { width: "54%", paddingLeft: 8 },
  colQty: { width: "8%", textAlign: "center" },
  colPrice: { width: "16%", textAlign: "right", paddingRight: 8 },
  colTotal: { width: "16%", textAlign: "right", paddingRight: 8 },
  
  categoryText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#059669",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
  },
  parameters: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 3,
    fontStyle: "italic",
    paddingLeft: 2,
  },
  regulation: {
    fontSize: 7,
    color: "#0f172a",
    marginTop: 2,
    backgroundColor: "#f1f5f9",
    padding: 2,
  },

  summarySection: {
    marginLeft: "auto",
    width: "35%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#059669",
    marginTop: 4,
    paddingTop: 4,
    fontWeight: "bold",
    fontSize: 10,
    color: "#064e3b",
  },
  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBox: {
    width: "35%",
    textAlign: "center",
  },
  signSpace: {
    height: 50,
  },
  note: {
    marginTop: 20,
    fontSize: 7,
    color: "#94a3b8",
  }
});

export const QuotationDocument = ({ data }: any) => {
  const itemsSubtotal = data.items.reduce((acc: any, item: any) => acc + (item.qty * Number(item.price_snapshot)), 0);
  const perdiemSubtotal = Number(data.perdiem_price) * data.perdiem_qty;
  const transportSubtotal = Number(data.transport_price) * data.transport_qty;
  const subtotalBeforeDiscount = itemsSubtotal + perdiemSubtotal + transportSubtotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo-wahfalab.png" style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>WahfaLab</Text>
            <Text style={styles.companySub}>Laboratorium Pengujian Lingkungan & Kalibrasi Terakreditasi</Text>
            <Text style={styles.companySub}>Jl. Contoh No. 123, Jakarta Selatan | (021) 12345678 | info@wahfalab.com</Text>
          </View>
        </View>

        <Text style={styles.title}>Penawaran Harga / Faktur Uji</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>PELANGGAN:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 2 }}>{data.profile?.full_name}</Text>
            <Text>{data.profile?.company_name || "Personal"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={{ textAlign: "right" }}><Text style={styles.label}>No. Faktur: </Text>{data.quotation_number}</Text>
            <Text style={{ textAlign: "right" }}><Text style={styles.label}>Tanggal: </Text>{new Date(data.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={{ textAlign: "right" }}><Text style={styles.label}>Status: </Text>{data.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Table Content */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colDesc}>Deskripsi Layanan & Parameter</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga (Rp)</Text>
            <Text style={styles.colTotal}>Total (Rp)</Text>
          </View>

          {/* Render Original Items */}
          {data?.items?.map((item: any, index: number) => {
            const itemName = item.name || item.service?.name || item.equipment?.name || "Item Layanan/Alat";
            const categoryName = item.service?.category_ref?.name || item.service?.category || (item.equipment ? "ALAT LAB" : "Layanan Lab");
            
            let parameterList = "";
            if (item.service?.parameters) {
              try {
                const params = typeof item.service.parameters === 'string' ? JSON.parse(item.service.parameters) : item.service.parameters;
                parameterList = Array.isArray(params) ? params.map((p: any) => p.name).join(", ") : "";
              } catch (e) {
                parameterList = String(item.service.parameters);
              }
            }

            return (
              <View key={`item-${index}`} style={styles.tableRow} wrap={false}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.categoryText}>{categoryName}</Text>
                  <Text style={styles.serviceName}>{itemName}</Text>
                  {parameterList && <Text style={styles.parameters}>Parameter: {parameterList}</Text>}
                  {item.service?.regulation && <Text style={styles.regulation}>Acuan: {item.service.regulation}</Text>}
                </View>
                <Text style={styles.colQty}>{item.qty}</Text>
                <Text style={styles.colPrice}>{Number(item.price_snapshot).toLocaleString("id-ID")}</Text>
                <Text style={styles.colTotal}>{(Number(item.qty) * Number(item.price_snapshot)).toLocaleString("id-ID")}</Text>
              </View>
            );
          })}

          {/* Baris Tambahan: Perdiem */}
          {Number(data.perdiem_price) > 0 && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={styles.colNo}>{data.items.length + 1}</Text>
              <View style={styles.colDesc}>
                <Text style={styles.categoryText}>BIAYA OPERASIONAL</Text>
                <Text style={styles.serviceName}>{data.perdiem_name || 'Biaya Perdiem / Engineer'}</Text>
              </View>
              <Text style={styles.colQty}>{data.perdiem_qty}</Text>
              <Text style={styles.colPrice}>{Number(data.perdiem_price).toLocaleString("id-ID")}</Text>
              <Text style={styles.colTotal}>{(Number(data.perdiem_qty) * Number(data.perdiem_price)).toLocaleString("id-ID")}</Text>
            </View>
          )}

          {/* Baris Tambahan: Transport */}
          {Number(data.transport_price) > 0 && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={styles.colNo}>{data.items.length + (Number(data.perdiem_price) > 0 ? 2 : 1)}</Text>
              <View style={styles.colDesc}>
                <Text style={styles.categoryText}>BIAYA OPERASIONAL</Text>
                <Text style={styles.serviceName}>{data.transport_name || 'Transportasi & Akomodasi'}</Text>
              </View>
              <Text style={styles.colQty}>{data.transport_qty}</Text>
              <Text style={styles.colPrice}>{Number(data.transport_price).toLocaleString("id-ID")}</Text>
              <Text style={styles.colTotal}>{(Number(data.transport_qty) * Number(data.transport_price)).toLocaleString("id-ID")}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>Rp {Number(
              data.items.reduce((acc: any, item: any) => acc + (item.qty * Number(item.price_snapshot)), 0) +
              (Number(data.perdiem_price) * data.perdiem_qty) +
              (Number(data.transport_price) * data.transport_qty)
            ).toLocaleString("id-ID")}</Text>
          </View>

          {Number(data.discount_amount) > 0 && (
            <View style={[styles.summaryRow, { color: "#dc2626" }]}>
              <Text>Diskon</Text>
              <Text>- Rp {Number(data.discount_amount).toLocaleString("id-ID")}</Text>
            </View>
          )}

          {data.use_tax && (
            <View style={styles.summaryRow}>
              <Text>PPN (11%)</Text>
              <Text>Rp {Number(data.tax_amount).toLocaleString("id-ID")}</Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text>TOTAL AKHIR</Text>
            <Text>Rp {Number(data.total_amount).toLocaleString("id-ID")}</Text>
          </View>
        </View>

        <Text style={styles.note}>* Dokumen ini sah dan diterbitkan secara elektronik oleh sistem WahfaLab.</Text>

        {/* Signatures */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.signBox}>
            <Text>Dicetak Oleh,</Text>
            <View style={styles.signSpace} />
            <Text style={{ fontWeight: "bold" }}>( WahfaLab Administration )</Text>
          </View>
          <View style={styles.signBox}>
            <Text>Penerima / Pelanggan,</Text>
            <View style={styles.signSpace} />
            <Text style={{ fontWeight: "bold" }}>( ____________________ )</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
