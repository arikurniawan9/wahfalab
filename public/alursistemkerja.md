Alur Sistem Aplikasi

1. Admin / Operator

Admin atau operator membuat penawaran baru berdasarkan permintaan dari customer.

Penawaran disimpan terlebih dahulu dengan status Draft.

Draft penawaran kemudian dikirim ke halaman customer dan sistem akan mengirimkan notifikasi kepada customer.

Proses Persetujuan Penawaran

Keputusan menerima atau menolak penawaran dapat dilakukan oleh:

Customer

Admin / Operator

Kemungkinan hasilnya:

Jika penawaran diterima:

Status berubah menjadi Diterima

Order akan masuk ke halaman Progress Order

Jika penawaran ditolak:

Status berubah menjadi Ditolak

Order tidak masuk ke halaman Progress Order

2. Penjadwalan Pekerjaan

Jika penawaran telah diterima, maka:

Admin / Operator dapat menugaskan pekerjaan kepada petugas lapangan (sampling).

Admin / Operator dapat menambahkan asisten sebanyak 1 orang, 2 orang, atau lebih sesuai kebutuhan.

Setelah penugasan dibuat, status Progress Order berubah menjadi:

Terjadwal

Admin / Operator dapat mengubah jadwal pekerjaan jika diperlukan.

Setiap perubahan jadwal akan mengirimkan notifikasi kepada petugas lapangan.

3. Petugas Lapangan / Sampling

Petugas lapangan menerima notifikasi penugasan sampling.

Respon Petugas Lapangan

Petugas memiliki dua pilihan:

Jika menolak pekerjaan

Sistem mengirimkan notifikasi penolakan kepada operator/admin

Operator/Admin dapat menjadwalkan ulang pekerjaan

Jika menerima pekerjaan

Petugas menekan tombol Terima Job

Status Progress Order berubah menjadi:

Progress Sampling

4. Proses Sampling

Setelah petugas lapangan menyelesaikan proses sampling:

Petugas menandai pekerjaan sebagai Sampling Selesai.

Data sampling akan dikirim ke bagian analis untuk diproses lebih lanjut.

Sistem juga akan mengirimkan invoice ke bagian keuangan.

Status Progress Order berubah menjadi:

Proses Analisis

5. Bagian Analisis

Analis menerima notifikasi dari petugas lapangan bahwa hasil sampling siap dianalisis.

Analis melakukan analisis terhadap sampel yang diterima.

Setelah analisis selesai:

Analis mengunggah hasil analisis berupa:

File PDF

atau Image

Sistem akan mengirimkan notifikasi kepada bagian Reporting.

Status Progress Order berubah menjadi:

Reporting

6. Bagian Reporting

Bagian Reporting menerima notifikasi dari bagian analisis.

Reporting melakukan input hasil pengujian berdasarkan hasil analisis.

Setelah data diinput:

Reporting melakukan generate LHU (Laporan Hasil Uji).

7. Pengiriman Hasil ke Customer

Setelah LHU berhasil dibuat:

Reporting dapat mengirimkan notifikasi kepada customer.

Customer dapat melihat:

File LHU

Status pembayaran (Lunas / Belum Lunas)

Jika seluruh proses telah selesai:

Status Progress Order berubah menjadi:

Selesai

Customer dapat:

Mengunduh LHU / Sertifikat Hasil Uji Laboratorium
