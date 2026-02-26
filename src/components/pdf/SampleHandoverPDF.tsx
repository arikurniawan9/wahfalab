import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    marginLeft: 15,
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#064e3b',
  },
  companySub: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  titleContainer: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  docNumber: {
    fontSize: 9,
    marginTop: 4,
    color: '#666',
  },
  introText: {
    marginBottom: 15,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    color: '#666',
  },
  value: {
    flex: 1,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: 200,
    textAlign: 'center',
  },
  signatureLine: {
    marginTop: 60,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  }
});

export const SampleHandoverPDF = ({ data }: { data: any }) => {
  const dateStr = new Date(data.received_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <Image src="/logo-wahfalab.png" style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>WAHFALAB</Text>
            <Text style={styles.companySub}>Laboratorium Lingkungan & Konsultan Lingkungan</Text>
            <Text style={styles.companySub}>Jl. Raya No. 123, Jakarta, Indonesia</Text>
            <Text style={styles.companySub}>Email: info@wahfalab.com | Web: www.wahfalab.com</Text>
          </View>
        </View>

        {/* Judul Dokumen */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Berita Acara Serah Terima Sampel</Text>
          <Text style={styles.docNumber}>Nomor: {data.handover_number}</Text>
        </View>

        <Text style={styles.introText}>
          Pada hari ini, tanggal {dateStr}, telah dilakukan serah terima sampel laboratorium dengan rincian sebagai berikut:
        </Text>

        {/* Rincian Pekerjaan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. Informasi Pekerjaan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Kode Tracking</Text>
            <Text style={styles.value}>: {data.job_order?.tracking_code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Klien</Text>
            <Text style={styles.value}>: {data.job_order?.quotation?.profile?.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Perusahaan</Text>
            <Text style={styles.value}>: {data.job_order?.quotation?.profile?.company_name || '-'}</Text>
          </View>
        </View>

        {/* Rincian Sampel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. Kondisi Sampel</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Jumlah Wadah</Text>
            <Text style={styles.value}>: {data.sample_qty} Unit/Botol</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kondisi Segel</Text>
            <Text style={styles.value}>: {data.sample_condition}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Catatan Tambahan</Text>
            <Text style={styles.value}>: {data.sample_notes || '-'}</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          Demikian Berita Acara Serah Terima ini dibuat untuk dipergunakan sebagaimana mestinya sebagai dasar dimulainya pengujian di laboratorium.
        </Text>

        {/* Tanda Tangan */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Yang Menyerahkan,</Text>
            <Text style={{fontSize: 8, color: '#666', marginTop: 2}}>(Petugas Lapangan)</Text>
            <View style={styles.signatureLine}>
              <Text style={{fontWeight: 'bold'}}>{data.sender?.full_name}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text>Yang Menerima,</Text>
            <Text style={{fontSize: 8, color: '#666', marginTop: 2}}>(Analis Laboratorium)</Text>
            <View style={styles.signatureLine}>
              <Text style={{fontWeight: 'bold'}}>{data.receiver?.full_name}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Dokumen ini diterbitkan secara digital oleh Sistem Informasi Manajemen Laboratorium WahfaLab
        </Text>
      </Page>
    </Document>
  );
};
