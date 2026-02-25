import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image
} from '@react-pdf/renderer';

// Register Montserrat font
Font.register({
  family: 'Montserrat',
  src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff'
});

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
    service_name?: string | null;
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
    fontFamily: 'Montserrat',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: 2,
    borderColor: '#10b981',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  invoiceTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
    border: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: 100,
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'medium',
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#1e293b',
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
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '5%', textAlign: 'center' },
  col2: { width: '45%', textAlign: 'left' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  summary: {
    marginTop: 10,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 15,
    width: 250,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'medium',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: 250,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    border: 1,
    borderColor: '#bbf7d0',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  paymentLabel: {
    width: 120,
    fontSize: 9,
    color: '#166534',
  },
  paymentValue: {
    flex: 1,
    fontSize: 9,
    color: '#14532d',
    fontWeight: 'medium',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  statusPaid: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
  },
  statusCancelled: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderColor: '#e2e8f0',
    paddingTop: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 3,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    border: 1,
    borderColor: '#fde68a',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  trackingCode: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 5,
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
              {data.company.phone && (
                <Text style={styles.companyInfo}>Telp: {data.company.phone}</Text>
              )}
              {data.company.email && (
                <Text style={styles.companyInfo}>Email: {data.company.email}</Text>
              )}
              {data.company.npwp && (
                <Text style={styles.companyInfo}>NPWP: {data.company.npwp}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoice_number}</Text>
            <Text style={styles.invoiceDate}>
              Tanggal: {formatDate(data.issue_date)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kepada Yth:</Text>
          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {data.customer.full_name || '-'}</Text>
            </View>
            {data.customer.company_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Perusahaan</Text>
                <Text style={styles.infoValue}>: {data.customer.company_name}</Text>
              </View>
            )}
            {data.customer.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>: {data.customer.email}</Text>
              </View>
            )}
            {data.customer.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telepon</Text>
                <Text style={styles.infoValue}>: {data.customer.phone}</Text>
              </View>
            )}
            {data.customer.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alamat</Text>
                <Text style={styles.infoValue}>: {data.customer.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Penawaran</Text>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, getStatusStyle(data.payment_status)]}>
              <Text>{getStatusLabel(data.payment_status)}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Layanan</Text>
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
                >
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{item.service_name || 'Layanan'}</Text>
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
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {(data.payment_method || data.paid_at) && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Informasi Pembayaran</Text>
            {data.payment_method && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Metode Pembayaran</Text>
                <Text style={styles.paymentValue}>
                  : {data.payment_method === 'cash' ? 'Tunai' : 'Transfer Bank'}
                </Text>
              </View>
            )}
            {data.paid_at && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tanggal Bayar</Text>
                <Text style={styles.paymentValue}>: {formatDate(data.paid_at)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Catatan Pembayaran:</Text>
          <Text style={styles.notesText}>
            • Pembayaran mohon ditransfer ke rekening: {data.company.company_name}
          </Text>
          <Text style={styles.notesText}>
            • Harap konfirmasi pembayaran dengan mengirimkan bukti transfer
          </Text>
          <Text style={styles.notesText}>
            • Untuk pertanyaan, hubungi kami di {data.company.email || 'finance@wahfalab.com'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Terima kasih atas kepercayaan Anda menggunakan layanan WahfaLab
          </Text>
          <Text style={styles.footerText}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
