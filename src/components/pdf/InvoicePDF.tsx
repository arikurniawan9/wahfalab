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

// Register Montserrat font for a more modern look
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTURjIg1_i6t8kCHKm45_dJE330EBz998Q.woff', fontWeight: 'bold' }
  ]
});

interface InvoiceData {
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string | null;
  created_at: string;
  notes?: string | null;
  job_order: {
    tracking_code: string;
    quotation: {
      quotation_number: string;
      subtotal: number;
      tax_amount: number;
      use_tax: boolean;
      total_amount: number;
      perdiem_price?: number | null;
      perdiem_qty?: number | null;
      perdiem_name?: string | null;
      transport_price?: number | null;
      transport_qty?: number | null;
      transport_name?: string | null;
      profile: {
        full_name?: string | null;
        company_name?: string | null;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
      };
      items: Array<{
        id: string;
        qty: number;
        price_snapshot: number;
        parameter_snapshot?: string | null;
        service?: {
          name: string;
          category?: string | null;
          regulation?: string | null;
        } | null;
        equipment?: {
          name: string;
        } | null;
      }>;
    };
  };
}

interface CompanyProfile {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  npwp?: string | null;
  leader_name?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
}

interface InvoicePDFProps {
  data: InvoiceData;
  company?: CompanyProfile;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingLeft: 60,
    paddingRight: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
    color: '#1a1a1a'
  },
  header: {
    marginBottom: 5,
    paddingBottom: 5,
    borderBottom: '2pt solid #000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  logoContainer: {
    width: 70,
    marginRight: 15
  },
  logoImage: {
    width: 65,
    height: 65,
    objectFit: 'contain'
  },
  companyInfoContainer: {
    flex: 1,
    textAlign: 'center',
    paddingRight: 70
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    color: '#064e3b'
  },
  companyTagline: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  companyAddress: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.2
  },
  invoiceHeader: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  invoiceTitleBox: {
    width: '40%'
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#064e3b',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  invoiceNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  customerBox: {
    width: '55%',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#059669'
  },
  boxTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  customerName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2
  },
  customerInfo: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.3
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15
  },
  metaItem: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151'
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    color: '#fff',
    fontWeight: 'bold',
    minHeight: 25,
    alignItems: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 25,
    alignItems: 'center'
  },
  tableCell: {
    padding: 6,
    fontSize: 8
  },
  colNum: { width: '5%', textAlign: 'center' },
  colDesc: { flex: 1 },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  summarySection: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  summaryBox: {
    width: '45%'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6'
  },
  summaryLabel: {
    fontSize: 9,
    color: '#4b5563'
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#064e3b',
    color: '#fff',
    borderRadius: 4,
    marginTop: 5
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  paymentInfo: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7'
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  paymentText: {
    fontSize: 8,
    color: '#166534',
    marginBottom: 2
  },
  signatureArea: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 20
  },
  signatureBox: {
    width: 180,
    alignItems: 'center'
  },
  signatureTitle: {
    fontSize: 9,
    marginBottom: 45,
    textAlign: 'center'
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
    textTransform: 'uppercase'
  },
  stampContainer: {
    position: 'absolute',
    top: -15,
    left: -20,
    width: 70,
    height: 70,
    opacity: 0.5,
    zIndex: 1
  },
  signatureImage: {
    position: 'absolute',
    top: -30,
    width: 90,
    height: 50,
    zIndex: 2,
    objectFit: 'contain'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    fontStyle: 'italic'
  }
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  data,
  company = {
    company_name: 'WahfaLab',
    address: 'Jl. Raya Cianjur - Bandung No. 123, Cianjur',
    phone: '(0263) 123456',
    email: 'finance@wahfalab.com',
    logo_url: null,
    tagline: 'Laboratorium Lingkungan & Analisis Teknis',
    leader_name: 'Kepala Operasional'
  }
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  };

  const fullLogoUrl = company.logo_url?.startsWith('/') ? `${getBaseUrl()}${company.logo_url}` : company.logo_url;
  const fullSignatureUrl = company.signature_url?.startsWith('/') ? `${getBaseUrl()}${company.signature_url}` : company.signature_url;
  const fullStampUrl = company.stamp_url?.startsWith('/') ? `${getBaseUrl()}${company.stamp_url}` : company.stamp_url;

  const quotation = data.job_order.quotation;
  const hasAdditionalCosts = (quotation.perdiem_price || 0) > 0 || (quotation.transport_price || 0) > 0;

  return (
    <Document title={`INVOICE - ${data.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              {fullLogoUrl ? (
                <Image source={{ uri: fullLogoUrl }} style={styles.logoImage} />
              ) : (
                <View style={{ width: 60, height: 60, backgroundColor: '#f3f4f6', borderRadius: 8 }} />
              )}
            </View>
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyName}>{company.company_name}</Text>
              <Text style={styles.companyTagline}>{company.tagline || 'Laboratorium Analisis Lingkungan'}</Text>
              <Text style={styles.companyAddress}>{company.address}</Text>
              <Text style={styles.companyAddress}>
                {company.phone && `Telp: ${company.phone}`}
                {company.email && ` | Email: ${company.email}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Header Section */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceTitleBox}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoice_number}</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 4 }}>
              Tracking Code: {data.job_order.tracking_code}
            </Text>
          </View>
          
          <View style={styles.customerBox}>
            <Text style={styles.boxTitle}>Tagihan Kepada:</Text>
            <Text style={styles.customerName}>{quotation.profile.company_name || quotation.profile.full_name}</Text>
            {quotation.profile.company_name && (
              <Text style={styles.customerInfo}>u.p. {quotation.profile.full_name}</Text>
            )}
            <Text style={styles.customerInfo}>{quotation.profile.address || '-'}</Text>
            <Text style={styles.customerInfo}>{quotation.profile.phone || '-'}</Text>
          </View>
        </View>

        {/* Meta Info Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tanggal Terbit</Text>
            <Text style={styles.metaValue}>{formatDate(data.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Jatuh Tempo</Text>
            <Text style={styles.metaValue}>{formatDate(data.due_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>No. Penawaran</Text>
            <Text style={styles.metaValue}>{quotation.quotation_number}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={[styles.metaValue, { color: data.status === 'paid' ? '#059669' : '#d97706' }]}>
              {data.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colNum]}>No</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>Deskripsi Layanan / Item</Text>
            <Text style={[styles.tableCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>Harga Satuan</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>Jumlah</Text>
          </View>
          
          {quotation.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
              <View style={[styles.tableCell, styles.colDesc]}>
                <Text style={{ fontWeight: 'bold' }}>{item.service?.name || item.equipment?.name || 'Item'}</Text>
                {item.parameter_snapshot && (
                  <Text style={{ fontSize: 7, color: '#6b7280' }}>Parameter: {item.parameter_snapshot}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(Number(item.price_snapshot))}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(Number(item.qty * Number(item.price_snapshot)))}</Text>
            </View>
          ))}

          {/* Additional Costs Rows */}
          {(quotation.perdiem_price || 0) > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{quotation.items.length + 1}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>{quotation.perdiem_name || 'Uang Harian / Perdiem'}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{quotation.perdiem_qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(Number(quotation.perdiem_price))}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(Number(quotation.perdiem_qty! * Number(quotation.perdiem_price)))}</Text>
            </View>
          )}
          {(quotation.transport_price || 0) > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{quotation.items.length + (Number(quotation.perdiem_price) > 0 ? 2 : 1)}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>{quotation.transport_name || 'Biaya Transportasi'}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{quotation.transport_qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(Number(quotation.transport_price))}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(Number(quotation.transport_qty! * Number(quotation.transport_price)))}</Text>
            </View>
          )}
        </View>

        {/* Calculation Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(Number(quotation.subtotal))}</Text>
            </View>
            
            {quotation.use_tax && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>PPN (11%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(Number(quotation.tax_amount))}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalValue}>{formatCurrency(Number(quotation.total_amount))}</Text>
            </View>
          </View>
        </View>

        {/* Payment & Terms */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Informasi Pembayaran:</Text>
          <Text style={styles.paymentText}>• Pembayaran dapat dilakukan melalui transfer Bank:</Text>
          <Text style={[styles.paymentText, { fontWeight: 'bold' }]}>  BANK MANDIRI - 1234567890 a.n. WAHFALAB INDONESIA</Text>
          <Text style={styles.paymentText}>• Mohon cantumkan No. Invoice {data.invoice_number} pada berita transfer.</Text>
          <Text style={styles.paymentText}>• Pembayaran dianggap sah jika dana sudah masuk ke rekening kami.</Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Hormat Kami,{'\n'}WahfaLab Finance</Text>
            
            <View style={{ height: 60, justifyContent: 'center', position: 'relative' }}>
              {fullStampUrl && <Image source={{ uri: fullStampUrl }} style={styles.stampContainer} />}
              {fullSignatureUrl && <Image source={{ uri: fullSignatureUrl }} style={styles.signatureImage} />}
            </View>

            <Text style={styles.signatureName}>{company.leader_name}</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>Finance Manager</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Dokumen ini diterbitkan secara elektronik oleh WahfaLab LIMS dan sah tanpa tanda tangan basah.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
