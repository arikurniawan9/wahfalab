import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Register Montserrat font (optional, using default fonts for now)
Font.register({
  family: 'Montserrat',
  src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff'
});

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
        profile: {
          full_name?: string | null;
          company_name?: string | null;
        };
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
  tagline?: string | null;
  npwp?: string | null;
}

interface TravelOrderPDFProps {
  data: TravelOrderData;
  company?: CompanyProfile;
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669'
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 2
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 15,
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
    width: 120,
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
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd'
  },
  tableCellLast: {
    borderRightWidth: 0
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center'
  },
  signatureTitle: {
    marginBottom: 60,
    fontSize: 10
  },
  signatureName: {
    fontWeight: 'bold',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5
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
  }
});

export const TravelOrderPDF: React.FC<TravelOrderPDFProps> = ({
  data,
  company = {
    company_name: 'WahfaLab',
    address: 'Jl. Laboratorium No. 123, Jakarta',
    phone: '(021) 1234-5678',
    email: 'info@wahfalab.com',
    logo_url: null,
    tagline: 'Laboratorium Analisis & Kalibrasi',
    npwp: null
  }
}) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.logo}>🧪 {company.company_name}</Text>
              <Text style={styles.companyName}>{company.tagline}</Text>
              {company.address && (
                <Text style={styles.companyInfo}>{company.address}</Text>
              )}
              {company.phone && (
                <Text style={styles.companyInfo}>Telp: {company.phone}</Text>
              )}
              {company.email && (
                <Text style={styles.companyInfo}>Email: {company.email}</Text>
              )}
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 10, color: '#666' }}>
                Nomor: {data.document_number}
              </Text>
              <Text style={{ fontSize: 10, color: '#666' }}>
                Tanggal: {formatDate(data.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>SURAT TUGAS PERJALANAN DINAS</Text>

        {/* Assignment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. DATA PETUGAS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{data.assignment.field_officer.full_name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{data.assignment.field_officer.email || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jabatan</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>Petugas Lapangan</Text>
          </View>
        </View>

        {/* Assignment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. PELAKSANAAN TUGAS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Berangkat</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{formatDate(data.departure_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Kembali</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{formatDate(data.return_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lokasi Tujuan</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{data.destination}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dasar Tugas</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>
              Sampling untuk Job Order {data.assignment.job_order.tracking_code}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>
              {data.assignment.job_order.quotation.profile.full_name || '-'}
              {data.assignment.job_order.quotation.profile.company_name && 
                ` (${data.assignment.job_order.quotation.profile.company_name})`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maksud & Tujuan</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={styles.value}>{data.purpose}</Text>
          </View>
        </View>

        {/* Budget Table */}
        {(data.transportation_type || data.accommodation_type || data.daily_allowance || data.total_budget) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>III. RINCIAN BIAYA</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellLast]}>Jenis Biaya</Text>
                <Text style={styles.tableCell}>Keterangan</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>Jumlah</Text>
              </View>
              
              {data.transportation_type && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell]}>Transportasi</Text>
                  <Text style={styles.tableCell}>{data.transportation_type}</Text>
                  <Text style={[styles.tableCell, styles.tableCellLast]}>-</Text>
                </View>
              )}
              
              {data.accommodation_type && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell]}>Akomodasi</Text>
                  <Text style={styles.tableCell}>{data.accommodation_type}</Text>
                  <Text style={[styles.tableCell, styles.tableCellLast]}>-</Text>
                </View>
              )}
              
              {data.daily_allowance && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell]}>Uang Harian</Text>
                  <Text style={styles.tableCell}>Per hari</Text>
                  <Text style={[styles.tableCell, styles.tableCellLast]}>
                    {formatCurrency(data.daily_allowance)}
                  </Text>
                </View>
              )}
              
              {data.total_budget && (
                <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Total Estimasi</Text>
                  <Text style={styles.tableCell}></Text>
                  <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>
                    {formatCurrency(data.total_budget)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Additional Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IV. CATATAN TAMBAHAN</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.4 }}>{data.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>
              Yang Ditugaskan,
            </Text>
            <Text style={styles.signatureName}>
              {data.assignment.field_officer.full_name || '(..........................)'}
            </Text>
          </View>
          
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>
              Mengetahui,
              {'\n'}
              Kepala Laboratorium
            </Text>
            <Text style={styles.signatureName}>
              (..........................)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah.
          {' | '}Dicetak pada: {new Date().toLocaleDateString('id-ID')}
        </Text>
      </Page>
    </Document>
  );
};

export default TravelOrderPDF;
