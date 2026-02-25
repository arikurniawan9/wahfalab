import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

interface LHUData {
  lhu_number: string;
  tracking_code: string;
  quotation_number: string;
  issue_date: string;
  customer: {
    full_name: string;
    company_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  sampling: {
    location: string;
    date: string;
    field_officer: string;
  };
  analysis: {
    analyst_name: string;
    start_date: string;
    end_date: string;
    test_results: Array<{
      parameter: string;
      result: string;
      unit: string;
      method: string;
      limit?: string;
    }>;
    equipment_used: string[];
    sample_condition: string;
    notes?: string;
  };
  company: {
    company_name: string;
    address: string;
    phone: string;
    email: string;
    logo_url: string;
    npwp?: string;
  };
}

// Simple QR Code pattern generator (visual representation)
// REMOVED - QR code feature deleted

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
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
    marginBottom: 3,
  },
  companyInfo: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 3,
  },
  lhuNumber: {
    fontSize: 9,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: '#ecfdf5',
    padding: 6,
    borderRadius: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 140,
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'medium',
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 'semibold',
  },
  table: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    color: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '5%', textAlign: 'center', fontSize: 9 },
  col2: { width: '35%', textAlign: 'left', fontSize: 9 },
  col3: { width: '20%', textAlign: 'left', fontSize: 9 },
  col4: { width: '20%', textAlign: 'left', fontSize: 9 },
  col5: { width: '20%', textAlign: 'left', fontSize: 9 },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  signatureBox: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 15,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#475569',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 1.4,
  },
  disclaimer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  disclaimerText: {
    fontSize: 8,
    color: '#92400e',
    lineHeight: 1.4,
  },
});

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const LHUPDF: React.FC<{ data: LHUData }> = ({ data }) => {
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
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Laporan Hasil Uji</Text>
          <Text style={styles.subtitle}>Laboratorium Lingkungan & Konsultan Lingkungan</Text>
          <Text style={styles.lhuNumber}>No: {data.lhu_number}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Klien</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Klien</Text>
            <Text style={styles.infoValue}>: {data.customer.full_name}</Text>
          </View>
          {data.customer.company_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Perusahaan</Text>
              <Text style={styles.infoValue}>: {data.customer.company_name}</Text>
            </View>
          )}
          {data.customer.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>: {data.customer.address}</Text>
            </View>
          )}
          {data.customer.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telepon</Text>
              <Text style={styles.infoValue}>: {data.customer.phone}</Text>
            </View>
          )}
          {data.customer.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>: {data.customer.email}</Text>
            </View>
          )}
        </View>

        {/* Job Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pekerjaan</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kode Tracking</Text>
                <Text style={styles.infoValue}>: {data.tracking_code}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nomor Penawaran</Text>
                <Text style={styles.infoValue}>: {data.quotation_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lokasi Sampling</Text>
                <Text style={styles.infoValue}>: {data.sampling.location}</Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Sampling</Text>
                <Text style={styles.infoValue}>: {formatDate(data.sampling.date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Petugas Sampling</Text>
                <Text style={styles.infoValue}>: {data.sampling.field_officer}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Terbit</Text>
                <Text style={styles.infoValue}>: {formatDate(data.issue_date)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Analysis Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Analisis</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Analis</Text>
                <Text style={styles.infoValue}>: {data.analysis.analyst_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Mulai</Text>
                <Text style={styles.infoValue}>: {formatDate(data.analysis.start_date)}</Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Selesai</Text>
                <Text style={styles.infoValue}>: {formatDate(data.analysis.end_date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kondisi Sampel</Text>
                <Text style={styles.infoValue}>: {data.analysis.sample_condition}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Test Results Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hasil Pengujian</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>No</Text>
              <Text style={styles.col2}>Parameter</Text>
              <Text style={styles.col3}>Hasil</Text>
              <Text style={styles.col4}>Metode</Text>
              <Text style={styles.col5}>Batas Limit</Text>
            </View>
            {data.analysis.test_results.length > 0 ? (
              data.analysis.test_results.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{result.parameter}</Text>
                  <Text style={styles.col3}>{result.result} {result.unit}</Text>
                  <Text style={styles.col4}>{result.method}</Text>
                  <Text style={styles.col5}>{result.limit || '-'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.col2}>Tidak ada data pengujian</Text>
              </View>
            )}
          </View>
        </View>

        {/* Equipment & Notes */}
        {data.analysis.equipment_used.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peralatan yang Digunakan</Text>
            <Text style={styles.infoValue}>{data.analysis.equipment_used.join(', ')}</Text>
          </View>
        )}

        {data.analysis.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catatan Analis</Text>
            <Text style={styles.infoValue}>{data.analysis.notes}</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            • Hasil pengujian ini hanya berlaku untuk sampel yang diuji
          </Text>
          <Text style={styles.disclaimerText}>
            • Laporan ini tidak boleh digandakan kecuali secara keseluruhan dan dengan izin tertulis
          </Text>
          <Text style={styles.disclaimerText}>
            • Keraguan terhadap hasil uji dapat diajukan maksimal 7 hari setelah penerbitan
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Disiapkan oleh,</Text>
            <Text style={styles.signatureName}>{data.analysis.analyst_name}</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>Analis Laboratorium</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Diperiksa oleh,</Text>
            <Text style={styles.signatureName}>(...........................)</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>Kepala Laboratorium</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Disetujui oleh,</Text>
            <Text style={styles.signatureName}>(...........................)</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>Direktur Teknis</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {data.company.company_name} - {data.company.address}
          </Text>
          <Text style={styles.footerText}>
            Telp: {data.company.phone} | Email: {data.company.email}
          </Text>
          <Text style={styles.footerText}>
            Dokumen ini ditandatangani secara elektronik dan sah tanpa tanda tangan basah
          </Text>
        </View>
      </Page>
    </Document>
  );
};
