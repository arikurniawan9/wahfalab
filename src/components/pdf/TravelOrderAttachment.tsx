import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

interface TravelOrderData {
  document_number: string;
  departure_date: string;
  return_date: string;
  destination: string;
  purpose: string;
  transportation_type?: string | null;
  accommodation_type?: string | null;
  daily_allowance?: number | null;
  total_budget?: number | null;
  notes?: string | null;
  assignment: {
    field_officer: {
      full_name?: string | null;
      email?: string | null;
    };
    job_order: {
      tracking_code: string;
      quotation: {
        quotation_number: string;
        total_amount: number;
        profile: {
          full_name?: string | null;
          company_name?: string | null;
        };
        items: Array<{
          service?: {
            name?: string | null;
          } | null;
          equipment?: {
            name?: string | null;
          } | null;
          qty: number;
          price_snapshot: number;
        }>;
      };
    };
  };
  created_at: string;
}

interface CompanyProfile {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

interface TravelOrderAttachmentProps {
  data: TravelOrderData;
  company: CompanyProfile;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderColor: '#059669',
    paddingBottom: 10
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoImage: {
    width: 50,
    height: 50,
    objectFit: 'contain'
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669'
  },
  companyName: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  },
  title: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 10,
    textDecoration: 'underline'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#059669',
    textTransform: 'uppercase'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    fontSize: 10
  },
  separator: {
    width: 10
  },
  value: {
    flex: 1,
    fontSize: 10
  },
  table: {
    marginTop: 10,
    border: 1,
    borderColor: '#ddd'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tableHeader: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 6
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#ddd'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    fontSize: 8,
    color: '#999',
    textAlign: 'center'
  },
  watermark: {
    position: 'absolute',
    top: 200,
    left: 150,
    right: 150,
    textAlign: 'center',
    fontSize: 40,
    color: '#f0f0f0',
    fontWeight: 'bold',
    transform: 'rotate(-45deg)',
    opacity: 0.5
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    marginBottom: 15
  }
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('id-ID', options);
};

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const TravelOrderAttachment: React.FC<TravelOrderAttachmentProps> = ({ data, company }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-wahfalab.png` }}
              style={styles.logoImage}
            />
            <View>
              <Text style={styles.logoText}>{company.company_name}</Text>
              {company.address && (
                <Text style={styles.companyName}>{company.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Lampiran Title */}
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <Text style={styles.title}>LAMPIRAN SURAT TUGAS</Text>
          <Text style={{ textAlign: 'center', fontSize: 10, color: '#666', marginTop: -5 }}>
            Nomor: {data.document_number}
          </Text>
        </View>

        {/* Job Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETAIL JOB ORDER</Text>
          <View style={styles.infoBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Tracking Code</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={{ ...styles.value, fontWeight: 'bold', color: '#059669' }}>{data.assignment.job_order.tracking_code}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nomor Penawaran</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.assignment.job_order.quotation.quotation_number || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.assignment.job_order.quotation.profile.full_name || '-'}</Text>
            </View>
            {data.assignment.job_order.quotation.profile.company_name && (
              <View style={styles.row}>
                <Text style={styles.label}>Perusahaan</Text>
                <Text style={styles.separator}>:</Text>
                <Text style={styles.value}>{data.assignment.job_order.quotation.profile.company_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Testing Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAFTAR PENGUJIAN / SAMPLING</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>No</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Layanan / Pengujian</Text>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Harga</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Subtotal</Text>
            </View>
            {data.assignment.job_order.quotation.items && data.assignment.job_order.quotation.items.length > 0 ? (
              data.assignment.job_order.quotation.items.map((item: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.service?.name || item.equipment?.name || 'Item'}</Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.price_snapshot)}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.price_snapshot * item.qty)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { textAlign: 'center', padding: 10 }]}>Tidak ada item pengujian</Text>
              </View>
            )}
          </View>
        </View>

        {/* Total Summary */}
        <View style={{ marginTop: 20, ...styles.infoBox }}>
          <View style={styles.row}>
            <Text style={[styles.label, { flex: 3, textAlign: 'right', fontWeight: 'bold' }]}>TOTAL BIAYA PENGUJIAN</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={{ ...styles.value, fontWeight: 'bold', color: '#059669', fontSize: 12 }}>
              {formatCurrency(data.assignment.job_order.quotation.total_amount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Lampiran ini merupakan bagian tidak terpisahkan dari Surat Tugas Perjalanan Dinas.</Text>
        </View>

        {/* Watermark */}
        <Text style={styles.watermark}>LAMPIRAN</Text>
      </Page>
    </Document>
  );
};
