# 🍽️ Sajian Indy - Enterprise POS, Serverless Google Sheets & Gemini AI

**Sajian Indy** adalah aplikasi *Point of Sale* (POS) perusahaan modern berkemampuan tinggi yang didesain secara adaptif dengan sistem *hybrid database* (Google Sheets Serverless & database lokal persisten) serta didukung oleh mesin kecerdasan buatan **Gemini AI** untuk penasihat operasional bisnis real-time.

Aplikasi ini sangat ideal bagi pemilik usaha kuliner atau ritel yang ingin mengelola transaksi multi-cabang tanpa biaya server database konvensional yang mahal (*Zero-Hosting Database Cost*).

---

## 🚀 Fitur Unggulan

1. **Hybrid Database Engine (Resilience Level: High)**:
   * **Utama (Cloud)**: Sinkronisasi instan multi-cabang langsung ke spreadsheet **Google Sheets** pribadi Anda menggunakan Google Apps Script tanpa biaya bulanan (*Serverless Google Sheets API*).
   * **Cadangan (Local Persistence)**: Jika Google Sheets sedang offline atau belum dihubungkan, sistem secara otomatis beralih ke local server database **(`data/db.json`)** di Node.js, atau ke local-storage jika server terputus. Data Anda dijamin 100% aman tanpa gangguan operasional (*Offline-First*).
2. **Kecerdasan Buatan (Gemini AI Consultant)**:
   * **POS-AI-PRO Chatbot**: Tanya jawab interaktif seputar produk terlaris, strategi bisnis, dan masukan taktis berdasarkan data transaksi mutakhir Anda.
   * **Business Insights & Stock Predictions**: Analisis tren otomatis untuk memberikan saran bundling promo, pendeteksian pola belanja, dan prediksi tanggal kritis kehabisan stok bahan baku/produk.
3. **Manajemen Multi-Cabang & Multi-Role**:
   * Mendukung skema multi-toko (Jakarta, Bandung, Surabaya, dll).
   * Hak akses berjenjang: **Owner (ndy)** untuk akses laporan keuangan lintas-cabang secara holistik, **Super Admin** untuk manajemen stok global, serta **Cashier (Siti/Andi)** yang terisolasi khusus di cabang penugasannya masing-masing.
4. **Modul Operasional Terintegrasi**:
   * Kasir penjualan kas, QRIS, atau debit dengan promo diskon voucher terintegrasi dan pencetakan struk digital.
   * Manajemen inventori, pencatatan mutasi sisa stok secara real-time.
   * Modul Pengadaan (*Purchase Order*) dengan proses serah terima barang otomatis.
   * Buku kas arus keuangan keuangan (*Debet/Kredit*) untuk pelacakan Laba & Rugi operasional.
5. **Panel Audit & Keamanan Jaringan**:
   * Pemantauan lalu lintas data log aktivitas karyawan (*Live Audit Trail*).
   * Kontrol IP Rate Limiter & Whitelist CORS Domain di server Apps Script.

---

## 🛠️ Panduan Instalasi Lokal

Untuk mengunduh dan menjalankan aplikasi ini secara lokal di komputer Anda:

### Prasyarat
* [Node.js](https://nodejs.org/) (Rekomendasi versi v18 ke atas)
* npm (Sudah terpasang bersama Node.js)

### Langkah Pemasangan

1. **Unduh Repositori**:
   ```bash
   git clone <URL_REPOSITORI_GITHUB_ANDA>
   cd sajian-indy
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan kunci API Gemini Anda untuk mengaktifkan chatbot konsultasi AI:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."
   VITE_GAS_DEPLOYMENT_URL=""  # Opsional: Masukkan jika ingin Google Sheets terhubung otomatis dari startup
   ```

4. **Jalankan Mode Pengembangan (Development)**:
   ```bash
   npm run dev
   ```
   Buka browser Anda dan akses di `http://localhost:3000`.

5. **Kompilasi ke Produksi (Build)**:
   ```bash
   npm run build
   ```
   Hasil build client-HTML akan disimpan di folder `dist/` dan server backend NodeJS akan dikompilasi menjadi satu file di `dist/server.cjs`.

6. **Jalankan Mode Produksi**:
   ```bash
   npm run start
   ```

---

## 🔗 Integrasi Cloud Database Google Sheets

Aplikasi telah dilengkapi dengan file script backend mandiri yang berada di folder **/apps-script/Code.gs**.

Untuk mengaktifkannya:
1. Buat Google Sheet baru di Google Drive Anda di [sheets.new](https://sheets.new).
2. Di dalam spreadsheet tersebut, klik **Ekstensi > Apps Script**.
3. Di editor Apps Script, hapus seluruh kode bawaan dan tempel kode lengkap dari file `apps-script/Code.gs` dari proyek ini.
4. Ganti nilai variabel `SPREADSHEET_ID` di baris ke-17 dengan ID Google Sheet Anda (karakter acak panjang yang ada di URL browser).
5. Pilih fungsi **`initializePOSDatabase`** di bagian atas editor lalu klik **Jalankan/Run**. Proses ini akan mendesain seluruh struktur baris tabel di sheet Anda secara instan. Beri otorisasi saat diminta.
6. Klik **Terapkan > Penerapan baru (New deployment)**. Pilih jenis **Aplikasi web**, dan atur akses ke **Siapa saja (Anyone)**.
7. Klik Terapkan, salin **Web App URL** yang diberikan, lalu paste ke bagian **Audit & Keamanan > Endpoint & Konfigurasi** di dalam aplikasi Anda!

---

## 📂 Struktur Folder Proyek
* `apps-script/`  - Kode backend Google Apps Script (`Code.gs`) dan dokumen referensi integrasi.
* `data/`          - Lokasi database lokal persisten internal server (`db.json`). *Ini diabaikan di Git untuk keamanan transaksi lokal Anda.*
* `src/`           - Komponen antarmuka visual web (React, Tailwind CSS, Framer Motion, Lucide Icons).
* `server.ts`      - Server backend Express JS yang menjembatani server lokal dengan Gemini AI Gateway.
* `server-db.ts`   - Pengontrol database lokal persisten dengan seed default.
* `vite.config.ts` - Konfigurasi build sistem bundler Vite.

## 🛡️ Lisensi & Hak Cipta
Dibuat dengan cinta untuk **Sajian Indy POS System**. Konten dilindungi secara penuh dan bebas dikustomisasi untuk operasional usaha Anda secara mandiri di GitHub.
