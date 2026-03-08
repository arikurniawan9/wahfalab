import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

interface CompanyProfile {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
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
    textAlign: 'left'
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
    fontSize: 10,
    fontWeight: 'bold'
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
  signatureRole: {
    fontSize: 10,
    marginBottom: 50
  },
  signatureName: {
    fontWeight: 'bold',
    fontSize: 10,
    textDecoration: 'underline'
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

export const SampleHandoverPDF = ({ 
  data, 
  company = {
    company_name: 'WahfaLab',
    address: 'Jl. Laboratorium No. 123, Jakarta',
    phone: '(021) 1234-5678',
    email: 'info@wahfalab.com',
    logo_url: null,
    tagline: 'Laboratorium Analisis & Kalibrasi'
  }
}: { 
  data: any, 
  company?: CompanyProfile 
}) => {
  const dateStr = new Date(data.created_at || data.received_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document title={`BAST Sampel - ${data.handover_number}`}>
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

        {/* Judul Dokumen */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.title}>BERITA ACARA SERAH TERIMA SAMPEL</Text>
          <Text style={styles.docNumber}>Nomor: {data.handover_number}</Text>
        </View>

        <Text style={{ marginBottom: 15, marginTop: 10 }}>
          Pada hari ini, tanggal {dateStr} WIB, telah dilakukan serah terima sampel laboratorium untuk pengujian dengan rincian sebagai berikut:
        </Text>

        {/* Rincian Pekerjaan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. INFORMASI PEKERJAAN</Text>
          <View style={{ marginLeft: 10 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Kode Tracking</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.job_order?.tracking_code}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nama Klien / Perusahaan</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>
                {data.job_order?.quotation?.profile?.company_name || data.job_order?.quotation?.profile?.full_name || '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ID Penawaran</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.job_order?.quotation?.quotation_number}</Text>
            </View>
          </View>
        </View>

        {/* Rincian Sampel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. KONDISI SAMPEL</Text>
          <View style={{ marginLeft: 10 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Jumlah Wadah/Titik</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_qty} Unit/Botol</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kondisi Fisik / Segel</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_condition}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Catatan Tambahan</Text>
              <Text style={styles.separator}>:</Text>
              <Text style={styles.value}>{data.sample_notes || data.notes || '-'}</Text>
            </View>
          </View>
        </View>

        <Text style={{ marginTop: 10 }}>
          Demikian Berita Acara Serah Terima ini dibuat untuk dipergunakan sebagaimana mestinya sebagai dasar dimulainya pengujian di laboratorium.
        </Text>

        {/* Tanda Tangan */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureRole}>Yang Menyerahkan, {'\n'}(Petugas Lapangan)</Text>
            <View style={{ height: 50 }} />
            <Text style={styles.signatureName}>{data.sender?.full_name || '-'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureRole}>Yang Menerima, {'\n'}(Analis Laboratorium)</Text>
            <View style={{ height: 50 }} />
            <Text style={styles.signatureName}>{data.receiver?.full_name || '-'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>WahfaLab LIMS Digital Document | Cianjur, Jawa Barat</Text>
          <Text>Dokumen ini sah dan diterbitkan secara elektronik melalui sistem manajemen laboratorium.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SampleHandoverPDF;
