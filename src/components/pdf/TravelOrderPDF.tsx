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
    assistants?: {
      id: string;
      full_name?: string | null;
      email?: string | null;
    }[] | null;
    job_order: {
      tracking_code: string;
      quotation: {
        quotation_number: string;
        total_amount?: number | null;
        profile: {
          full_name?: string | null;
          company_name?: string | null;
        };
        items: {
          id: string;
          qty: number;
          parameter_snapshot?: string | null;
          service?: {
            name: string;
            category?: string | null;
            regulation?: string | null;
            regulation_ref?: {
              name: string;
            } | null;
          } | null;
          equipment?: {
            name: string;
          } | null;
        }[];
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
  leader_name?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
}

interface TravelOrderPDFProps {
  data: TravelOrderData;
  company?: CompanyProfile;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 50,
    paddingRight: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#1a1a1a'
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
    position: 'relative'
  },
  headerDoubleLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    marginTop: 1,
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  logoContainer: {
    width: 65,
    marginRight: 15
  },
  logoImage: {
    width: 60,
    height: 60,
    objectFit: 'contain'
  },
  companyInfoContainer: {
    flex: 1,
    textAlign: 'left',
    marginRight: 0
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  companyTagline: {
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 2
  },
  companyAddress: {
    fontSize: 8,
    color: '#333'
  },
  title: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 2,
    textDecoration: 'underline'
  },
  docNumber: {
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 20
  },
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    textDecoration: 'underline',
    textTransform: 'uppercase'
  },
  grid: {
    marginLeft: 10
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3
  },
  label: {
    width: 130,
    fontSize: 10
  },
  separator: {
    width: 15,
    textAlign: 'center'
  },
  value: {
    flex: 1,
    fontSize: 10
  },
  table: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid'
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid'
  },
  tableCellNum: {
    width: 25,
    textAlign: 'center'
  },
  tableCellService: {
    flex: 2
  },
  tableCellReg: {
    flex: 2
  },
  tableCellParams: {
    flex: 3
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signatureBox: {
    width: 200,
    textAlign: 'center'
  },
  signatureDate: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'center'
  },
  signatureRole: {
    fontSize: 10,
    marginBottom: 5,
    minHeight: 25 // Ensure consistent height for multiline roles
  },
  signatureName: {
    fontWeight: 'bold',
    fontSize: 10,
    textDecoration: 'underline',
    paddingTop: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 5
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

  return (
    <Document title={`Surat Tugas - ${data.document_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header (Kop Surat) */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              {company.logo_url ? (
                <Image
                  source={{ 
                    uri: company.logo_url.startsWith('/') 
                      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${company.logo_url}`
                      : company.logo_url 
                  }}
                  style={styles.logoImage}
                />
              ) : (
                <View style={{ width: 60, height: 60, backgroundColor: '#f5f5f5', borderRadius: 4, alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' }}>
                  <Text style={{ fontSize: 20 }}>🧪</Text>
                </View>
              )}
            </View>
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyName}>{company.company_name}</Text>
              {company.tagline && <Text style={styles.companyTagline}>{company.tagline}</Text>}
              <Text style={styles.companyAddress}>{company.address}</Text>
              <Text style={styles.companyAddress}>
                {company.phone && `Telp: ${company.phone}`}
                {company.email && ` | Email: ${company.email}`}
              </Text>
            </View>
          </View>
          <View style={styles.headerDoubleLine} />
        </View>

        {/* Document Title */}
        <Text style={styles.title}>SURAT TUGAS PERJALANAN DINAS</Text>
        <Text style={styles.docNumber}>Nomor: {data.document_number}</Text>

        {/* Personnel Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. PERSONALIA BERTUGAS</Text>
          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={styles.label}>Petugas Utama</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>{data.assignment.field_officer.full_name || '-'}</Text>
            </View>
            {data.assignment.assistants && data.assignment.assistants.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Asisten</Text>
                <Text style={styles.separator}>:</Text>
                <View style={styles.value}>
                  {data.assignment.assistants.map((a, i) => (
                    <Text key={i}>{i + 1}. {a.full_name}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Execution Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. RINCIAN PELAKSANAAN</Text>
          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={styles.label}>Lokasi / Tujuan</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.destination}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Waktu</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{formatDate(data.departure_date)} s/d {formatDate(data.return_date)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Maksud Tugas</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.purpose}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>
                {data.assignment.job_order.quotation.profile.full_name || '-'}
                {data.assignment.job_order.quotation.profile.company_name && ` (${data.assignment.job_order.quotation.profile.company_name})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Sampling Scope Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. RUANG LINGKUP SAMPLING & PENGUJIAN</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellNum]}>No</Text>
              <Text style={[styles.tableCell, styles.tableCellService]}>Nama Pengujian / Sampel</Text>
              <Text style={[styles.tableCell, styles.tableCellReg]}>Regulasi / Baku Mutu</Text>
              <Text style={[styles.tableCell, styles.tableCellParams, { borderRightWidth: 0 }]}>Parameter Analisis</Text>
            </View>
            
            {data.assignment.job_order.quotation.items?.map((item, index) => {
              const isService = !!item.service;
              return (
                <View key={item.id} style={[styles.tableRow, { borderBottomWidth: index === data.assignment.job_order.quotation.items.length - 1 ? 0 : 1 }]}>
                  <Text style={[styles.tableCell, styles.tableCellNum]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.tableCellService]}>
                    {isService ? item.service?.name : (item.equipment?.name || 'Item Kustom')}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellReg]}>
                    {isService 
                      ? (item.service?.regulation_ref?.name || item.service?.regulation || item.service?.category || '-') 
                      : 'Penyewaan Alat / Peralatan'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellParams, { borderRightWidth: 0 }]}>
                    {isService 
                      ? (item.parameter_snapshot || 'Sesuai standar operasional') 
                      : `Jumlah: ${item.qty} unit`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Instructions / Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IV. INSTRUKSI KHUSUS</Text>
            <Text style={{ fontSize: 9 }}>{data.notes}</Text>
          </View>
        )}

        {/* Signature Area */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={{ height: 15 }} />
            <Text style={styles.signatureRole}>Petugas Pelaksana,</Text>
            <View style={{ height: 50 }} />
            <Text style={styles.signatureName}>{data.assignment.field_officer.full_name}</Text>
          </View>
          
          <View style={styles.signatureBox}>
            <Text style={styles.signatureDate}>Cianjur, {formatDate(data.created_at)}</Text>
            <Text style={styles.signatureRole}>Mengesahkan, {'\n'}Kepala Operasional</Text>
            
            {/* Digital Validation Container */}
            <View style={{ height: 60, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              {company.signature_url && (
                <Image 
                  source={{ 
                    uri: company.signature_url.startsWith('/') 
                      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${company.signature_url}`
                      : company.signature_url 
                  }} 
                  style={{ width: 100, height: 50, zIndex: 2 }} 
                />
              )}
              {company.stamp_url && (
                <Image 
                  source={{ 
                    uri: company.stamp_url.startsWith('/') 
                      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${company.stamp_url}`
                      : company.stamp_url 
                  }} 
                  style={{ width: 70, height: 70, position: 'absolute', opacity: 0.6, zIndex: 1, left: 10 }} 
                />
              )}
            </View>

            <Text style={styles.signatureName}>{company.leader_name || '( ........................................... )'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>WahfaLab - LIMS Digital Document | Tracking Code: {data.assignment.job_order.tracking_code}</Text>
          <Text>Surat tugas ini diterbitkan secara resmi melalui sistem dan sah sebagai instruksi kerja lapangan.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TravelOrderPDF;
