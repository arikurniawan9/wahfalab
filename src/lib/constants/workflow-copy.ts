export const ANALYST_STATUS_LABELS = {
  scheduled: "Terjadwal",
  sampling: "Sampling",
  analysis_ready: "Siap Analisis",
  analysis: "Analisis",
  analysis_done: "Siap Reporting",
  reporting: "Sedang Di Reporting",
  completed: "LHU Terbit",
} as const;

export const ANALYST_CLAIM_LABELS = {
  claimed: "Sudah Diambil",
  unclaimed: "Belum Diambil",
  claimedByOther: "Diambil Analis",
} as const;

export const REPORTING_STATUS_LABELS = {
  analysis_done: "Siap Reporting",
  reporting: "Sedang Di Reporting",
  completed: "LHU Terbit",
} as const;

export const FIELD_TRAVEL_ORDER_LABELS = {
  view: "Lihat Surat Tugas",
  download: "Unduh PDF",
  active: "Surat Tugas Aktif",
  ready: "Siap Buka",
  missing: "Belum PDF",
} as const;

export const FIELD_ASSIGNMENT_LABELS = {
  pdfSection: "Lampiran PDF Sampling",
  pdfSubtitle: "Upload lampiran PDF pendukung hasil sampling",
  fileAvailable: "Dokumen Tersedia",
  viewPdf: "Lihat PDF",
  deletePdf: "Hapus",
  uploadHint: "Klik untuk upload hasil sampling",
  externalForm: "Buka Form Eksternal",
  readyToSend: "Siap Dikirim",
  sendResults: "Kirim Hasil Sampling",
  confirmTask: "Konfirmasi Tugas",
  samplingDoneQuestion: "Sampling Selesai?",
  startOperational: "Mulai Operasional",
  sendToAnalystNow: "Kirim ke Analis Sekarang",
  readyStatusNote: "Siap Analisis",
  docTitlePrefix: "Lampiran_Sampling_",
  docAvailablePrefix: "Lampiran_Sampling_",
} as const;

export const FIELD_SAMPLING_STATUS_LABELS = {
  pending: "Menunggu",
  in_progress: "Dalam Proses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  newTask: "Tugas Baru",
  activeSampling: "Sampling Aktif",
  samplingDone: "Sampling Selesai",
  rejected: "Ditolak",
  startNext: "Mulai Tugas Berikutnya",
  continueSampling: "Lanjutkan Sampling",
  startShort: "Mulai",
  continueShort: "Lanjut",
} as const;

export const ADMIN_STATUS_LABELS = {
  scheduled: "Terjadwal",
  sampling: "Sampling",
  analysis_ready: "Siap Analisis",
  analysis: "Analisis",
  analysis_done: "Selesai Analisis",
  reporting: "Pelaporan",
  completed: "Selesai",
  pending_payment: "Menunggu Pembayaran",
  paid: "Lunas",
} as const;

export const ADMIN_WORKFLOW_LABELS = {
  scheduled: "Penjadwalan",
  sampling: "Sampling",
  analysis_ready: "Siap Analisis",
  analysis: "Analisis",
  analysis_done: "Selesai Analisis",
  reporting: "Pelaporan",
  completed: "Selesai",
} as const;

export const ANALYST_DETAIL_LABELS = {
  travelOrder: {
    view: "Buka Surat Tugas",
    attachment: "Buka Lampiran Sampling",
    form: "Buka Form Eksternal",
    claim: "Konfirmasi Ambil Tugas",
    claimShort: "Ambil Tugas",
    start: "Mulai Analisis Lab",
    startShort: "Mulai Uji",
    sent: "Sudah Dikirim ke Reporting",
    sentShort: "Sudah Dikirim",
    send: "Kirim ke Reporting",
    sendShort: "Kirim",
    confirmSend: "Konfirmasi Kirim",
    confirmSendShort: "Konfirmasi",
    draft: "Simpan Draft",
    bast: "Cetak BAST",
    receive: "Terima Sampel & BAST",
    receiveShort: "Terima Sampel",
  },
  sections: {
    perihal: "Perihal Uji Lab",
    scope: "Cakupan Pengujian",
    worksheet: "Lembar Kerja Analis",
    uploads: "Berkas Analisis",
  },
} as const;

export const REPORTING_DETAIL_LABELS = {
  status: {
    analysisDone: "Siap Diproses Reporting",
    reporting: "Sedang Disusun Reporting",
    completed: "LHU Terbit (Selesai)",
  },
  actions: {
    saveDraft: "Simpan Draft Reporting",
    preview: "Preview LHU Final",
    generateTitle: "Preview Laporan Hasil Uji",
    viewDocument: "Lihat Dokumen",
    publish: "TERBITKAN LHU",
  },
  sections: {
    results: "Hasil Parameter Uji",
    reference: "Referensi Analis",
    customer: "Data Customer",
  },
} as const;
