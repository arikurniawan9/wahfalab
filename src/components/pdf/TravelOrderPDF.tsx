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
    paddingTop: 30,
    paddingBottom: 50,
    paddingLeft: 60,
    paddingRight: 60,
    fontSize: 10,
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
    paddingRight: 70 // Balance for the logo on the left
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    color: '#064e3b' // Emerald 900
  },
  companyTagline: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669', // Emerald 600
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  companyAddress: {
    fontSize: 8,
    color: '#4b5563', // Slate 600
    lineHeight: 1.2
  },
  titleContainer: {
    marginTop: 25,
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  docNumber: {
    fontSize: 10,
    marginTop: 2
  },
  mainContent: {
    marginTop: 10
  },
  section: {
    marginBottom: 15
  },
  sectionHeader: {
    flexDirection: 'row',
    marginBottom: 8
  },
  sectionLabel: {
    width: 100,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  sectionSeparator: {
    width: 20
  },
  sectionValue: {
    flex: 1
  },
  instructionText: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'justify'
  },
  detailsGrid: {
    marginLeft: 20,
    marginBottom: 15
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  detailLabel: {
    width: 120,
    color: '#4b5563'
  },
  detailSeparator: {
    width: 15,
    textAlign: 'center'
  },
  detailValue: {
    flex: 1,
    fontWeight: 'bold'
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 25,
    alignItems: 'center'
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#000',
  },
  tableCellNum: { width: 30, textAlign: 'center' },
  tableCellService: { flex: 2 },
  tableCellReg: { flex: 2 },
  tableCellParams: { flex: 3, borderRightWidth: 0 },
  
  signatureArea: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20
  },
  signatureBox: {
    width: 200,
    alignItems: 'center'
  },
  signatureTitle: {
    fontSize: 10,
    marginBottom: 40,
    textAlign: 'center'
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
    textTransform: 'uppercase'
  },
  signatureMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2
  },
  stampContainer: {
    position: 'absolute',
    top: -20,
    left: -30,
    width: 80,
    height: 80,
    opacity: 0.5,
    zIndex: 1
  },
  signatureImage: {
    position: 'absolute',
    top: -35,
    width: 100,
    height: 60,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
    fontStyle: 'italic'
  }
});

export const TravelOrderPDF: React.FC<TravelOrderPDFProps> = ({
  data,
  company = {
    company_name: 'WahfaLab',
    address: 'Jl. Raya Cianjur - Bandung No. 123, Cianjur',
    phone: '(0263) 123456',
    email: 'admin@wahfalab.com',
    logo_url: null,
    tagline: 'Laboratorium Lingkungan & Analisis Teknis',
    leader_name: 'Kepala Laboratorium'
  }
}) => {
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

  return (
    <Document title={`SURAT TUGAS - ${data.document_number}`}>
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

        {/* Judul Dokumen */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SURAT TUGAS PENGAMBILAN CONTOH</Text>
          <Text style={styles.docNumber}>Nomor : {data.document_number}</Text>
        </View>

        {/* Isi Surat */}
        <View style={styles.mainContent}>
          {/* Dasar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>DASAR</Text>
              <Text style={styles.sectionSeparator}>:</Text>
              <Text style={styles.sectionValue}>
                Permohonan Pengujian/Sampling dari {data.assignment.job_order.quotation.profile.company_name || data.assignment.job_order.quotation.profile.full_name} 
                dengan Nomor Penawaran {data.assignment.job_order.quotation.quotation_number}.
              </Text>
            </View>
          </View>

          <Text style={[styles.instructionText, { fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }]}>
            MENUGASKAN :
          </Text>

          {/* Kepada */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>KEPADA</Text>
              <Text style={styles.sectionSeparator}>:</Text>
              <View style={styles.sectionValue}>
                <Text style={{ fontWeight: 'bold' }}>1. {data.assignment.field_officer.full_name}</Text>
                {data.assignment.assistants?.map((ast, idx) => (
                  <Text key={ast.id}>{idx + 2}. {ast.full_name}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Untuk */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>UNTUK</Text>
              <Text style={styles.sectionSeparator}>:</Text>
              <View style={styles.sectionValue}>
                <Text style={styles.instructionText}>Melaksanakan pengambilan contoh uji (sampling) dan pengukuran lapangan dengan rincian sebagai berikut:</Text>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lokasi / Perusahaan</Text>
                    <Text style={styles.detailSeparator}>:</Text>
                    <Text style={styles.detailValue}>{data.destination}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Waktu Pelaksanaan</Text>
                    <Text style={styles.detailSeparator}>:</Text>
                    <Text style={styles.detailValue}>{formatDate(data.departure_date)} s/d {formatDate(data.return_date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Maksud Perjalanan</Text>
                    <Text style={styles.detailSeparator}>:</Text>
                    <Text style={styles.detailValue}>{data.purpose}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Tabel Ruang Lingkup */}
          <View style={styles.section}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 5 }}>RUANG LINGKUP SAMPLING & PENGUJIAN :</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableCellNum]}>No</Text>
                <Text style={[styles.tableCell, styles.tableCellService]}>Jenis Contoh / Lokasi</Text>
                <Text style={[styles.tableCell, styles.tableCellReg]}>Baku Mutu / Regulasi</Text>
                <Text style={[styles.tableCell, styles.tableCellParams]}>Parameter Uji</Text>
              </View>
              {data.assignment.job_order.quotation.items.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellNum]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.tableCellService]}>{item.service?.name || item.equipment?.name || 'Item'}</Text>
                  <Text style={[styles.tableCell, styles.tableCellReg]}>{item.service?.regulation_ref?.name || item.service?.regulation || '-'}</Text>
                  <Text style={[styles.tableCell, styles.tableCellParams]}>{item.parameter_snapshot || '-'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Penutup */}
          <Text style={[styles.instructionText, { marginTop: 10 }]}>
            Demikian surat tugas ini diberikan agar dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya setelah selesai melaksanakan tugas.
          </Text>
        </View>

        {/* Tanda Tangan */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Diterima Oleh,{'\n'}Petugas Pelaksana</Text>
            <View style={{ height: 60 }} />
            <Text style={styles.signatureName}>{data.assignment.field_officer.full_name}</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Ditetapkan di Cianjur{'\n'}Pada Tanggal {formatDate(data.created_at)}</Text>
            
            <View style={{ height: 60, justifyContent: 'center', position: 'relative' }}>
              {fullStampUrl && <Image source={{ uri: fullStampUrl }} style={styles.stampContainer} />}
              {fullSignatureUrl && <Image source={{ uri: fullSignatureUrl }} style={styles.signatureImage} />}
            </View>

            <Text style={styles.signatureName}>{company.leader_name}</Text>
            <Text style={styles.signatureMeta}>Kepala Operasional</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>WahfaLab Digital Signature ID: {data.assignment.job_order.tracking_code}</Text>
          <Text>Halaman 1 dari 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TravelOrderPDF;
