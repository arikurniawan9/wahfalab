import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

// Use basic fonts only to avoid any formatting issues
// Helvetica is built-in to all PDF viewers and react-pdf

interface InvoiceData {
  invoice_number: string;
  quotation_number?: string | null;
  tracking_code: string;
  issue_date: string;
  due_date: string;
  amount: number;
  payment_status: string;
  payment_method?: string | null;
  paid_at?: string | null;
  customer: {
    full_name?: string | null;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items?: Array<{
    category_name?: string | null;
    service_name?: string | null;
    parameters?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  company: {
    company_name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logo_url?: string | null;
    npwp?: string | null;
  };
}

interface InvoicePDFProps {
  data: InvoiceData;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    borderBottomStyle: 'solid',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: 'bold',
    marginBottom: 2,
    marginLeft: 10,
  },
  companyInfo: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
    marginLeft: 10,
    maxWidth: 250,
  },
  invoiceTitleSection: {
    textAlign: 'right',
  },
  invoiceTitleText: {
    fontSize: 20,
    color: '#065f46',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceNumberLabel: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  // New Two-Column Info Section
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 20,
  },
  infoBox: {
    flex: 1,
  },
  infoSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065f46',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 85,
    color: '#64748b',
    fontSize: 8,
  },
  infoValue: {
    flex: 1,
    color: '#1e293b',
    fontSize: 8,
    fontWeight: 'bold',
  },

  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    color: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderBottomStyle: 'solid',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '5%', textAlign: 'center' },
  col2: { width: '50%', textAlign: 'left', paddingRight: 5 },
  categoryText: {
    fontSize: 7,
    color: '#10b981',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  serviceNameText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  parameterText: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  
  summary: {
    marginTop: 15,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    width: 200,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 200,
    backgroundColor: '#10b981',
    borderRadius: 4,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 100,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },

  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderTopStyle: 'solid',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ data }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return styles.statusPaid;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'LUNAS';
      case 'cancelled':
        return 'DIBATALKAN';
      default:
        return 'BELUM BAYAR';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {data.company.logo_url ? (
              <Image style={styles.logo} src={data.company.logo_url} />
            ) : (
              <View style={[styles.logo, { backgroundColor: '#10b981', borderRadius: 8 }]} />
            )}
            <View>
              <Text style={styles.companyName}>{data.company.company_name}</Text>
              {data.company.address && (
                <Text style={styles.companyInfo}>{data.company.address}</Text>
              )}
              <Text style={styles.companyInfo}>
                Telp: {data.company.phone || '-'} | Email: {data.company.email || '-'}
              </Text>
              {data.company.npwp && (
                <Text style={styles.companyInfo}>NPWP: {data.company.npwp}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <Text style={styles.invoiceNumberLabel}>{data.invoice_number}</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
              Tanggal Terbit: {formatDate(data.issue_date)}
            </Text>
          </View>
        </View>

        {/* Two-Column Info Section */}
        <View style={styles.infoContainer}>
          {/* Column Left: Customer Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoSectionTitle}>Kepada Yth:</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {data.customer.full_name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Perusahaan</Text>
              <Text style={styles.infoValue}>: {data.customer.company_name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>: {data.customer.email || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telepon</Text>
              <Text style={styles.infoValue}>: {data.customer.phone || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>: {data.customer.address || '-'}</Text>
            </View>
          </View>

          {/* Column Right: Invoice Details */}
          <View style={[styles.infoBox, { maxWidth: 200 }]}>
            <Text style={styles.infoSectionTitle}>Detail Tagihan:</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. Penawaran</Text>
              <Text style={styles.infoValue}>: {data.quotation_number || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job Order</Text>
              <Text style={styles.infoValue}>: {data.tracking_code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jatuh Tempo</Text>
              <Text style={styles.infoValue}>: {formatDate(data.due_date)}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 5 }]}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadge, getStatusStyle(data.payment_status)]}>
                <Text>{getStatusLabel(data.payment_status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={[styles.infoSectionTitle, { marginBottom: 5 }]}>Rincian Layanan & Pengujian</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>No</Text>
              <Text style={styles.col2}>Deskripsi</Text>
              <Text style={styles.col3}>Qty</Text>
              <Text style={styles.col4}>Harga Satuan</Text>
              <Text style={styles.col5}>Subtotal</Text>
            </View>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <Text style={styles.col1}>{index + 1}</Text>
                  <View style={styles.col2}>
                    {item.category_name && (
                      <Text style={styles.categoryText}>{item.category_name}</Text>
                    )}
                    <Text style={styles.serviceNameText}>{item.service_name || 'Layanan'}</Text>
                    {item.parameters && (
                      <Text style={styles.parameterText}>Parameter: {item.parameters}</Text>
                    )}
                  </View>
                  <Text style={styles.col3}>{item.quantity}</Text>
                  <Text style={styles.col4}>{formatCurrency(item.unit_price)}</Text>
                  <Text style={styles.col5}>{formatCurrency(item.subtotal)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.col2}>Layanan sampling dan analisis laboratorium</Text>
                <Text style={styles.col3}>1</Text>
                <Text style={styles.col4}>{formatCurrency(data.amount)}</Text>
                <Text style={styles.col5}>{formatCurrency(data.amount)}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.amount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info & Notes */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Instruksi Pembayaran:</Text>
          <Text style={styles.notesText}>• Pembayaran dilakukan melalui transfer ke rekening perusahaan.</Text>
          <Text style={styles.notesText}>• Mohon lampirkan nomor invoice {data.invoice_number} pada berita transfer.</Text>
          <Text style={styles.notesText}>• Harap konfirmasi pembayaran kepada admin kami setelah transfer berhasil.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas kepercayaan Anda menggunakan layanan WahfaLab</Text>
          <Text style={[styles.footerText, { marginTop: 2, fontSize: 6 }]}>Dokumen ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.</Text>
        </View>
      </Page>
    </Document>
  );
};
