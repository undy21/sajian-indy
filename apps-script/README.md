# 📋 Panduan Integrasi Google Sheets Cloud Database - Sajian Indy

Panduan ini menjelaskan langkah demi langkah untuk menyiapkan **Google Sheets** dan **Google Apps Script** sebagai pusat database cloud (serverless) untuk aplikasi **Sajian Indy POS**. 

Dengan integrasi ini, seluruh transaksi, mutasi stok, pendaftaran member/supplier, dan histori keuangan Anda akan tersimpan secara terpusat, aman, dan dapat digunakan secara real-time antar-cabang.

---

## ⚡ Langkah Rangkuman Cepat

Integrasi ini sangat mudah karena semua fungsi database sudah digabungkan ke dalam satu file tunggal: `Code.gs`. Anda hanya perlu:
1. **Membuat Google Sheet** baru.
2. **Menyalin isi `apps-script/Code.gs`** ke dalam Google Apps Script editor.
3. **Memasukkan ID Spreadsheet** Anda ke dalam kode tersebut.
4. **Menjalankan inisialisasi otomatis** untuk membuat seluruh tabel database & akun kasir demo.
5. **Mendeploy sebagai Web App** dan menyalin URL-nya ke aplikasi Sajian Indy.

---

## 🛠️ Langkah-Langkah Detail Terperinci

### Langkah 1: Buat Google Sheet Baru & Dapatkan ID-nya
1. Buka browser Anda dan buat spreadsheet baru di Google Drive melalui [sheets.new](https://sheets.new).
2. Beri nama spreadsheet Anda, misalnya: `Database Sajian Indy POS`.
3. Perhatikan URL Google Sheet Anda di bar alamat browser:
   ```text
   https://docs.google.com/spreadsheets/d/1A2bC3dE4fGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0
   ```
4. **Salin ID Spreadsheet** Anda. ID spreadsheet Anda adalah rangkaian karakter acak panjang di antara `/d/` dan `/edit` (pada contoh di atas, ID-nya adalah `1A2bC3dE4fGhIjKlMnOpQrStUvWxYz1234567890`).

### Langkah 2: Buka Google Apps Script Editor
1. Di dalam Google Sheet yang baru dibuat, klik menu utama di bagian atas: **Ekstensi** > **Apps Script** (atau *Extensions > Apps Script*).
2. Hapus seluruh kode bawaan yang ada di editor (fungsi `myFunction() {}`).

### Langkah 3: Salin & Tempel Kode Backend
1. Buka file `/apps-script/Code.gs` dari folder repositori aplikasi Sajian Indy ini.
2. Salin (**Copy**) seluruh isi kode dari file `Code.gs` tersebut (kurang lebih 660 baris kode).
3. Tempelkan (**Paste**) kode tersebut seluruhnya ke dalam editor Google Apps Script Anda.
4. Beri nama proyek Apps Script Anda, contoh: `Backend Sajian Indy API`.

### Langkah 4: Hubungkan Spreadsheet dengan Memasukkan ID
1. Cari baris **nomor 17** di dalam script yang Anda tempel:
   ```javascript
   var SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";
   ```
2. Ganti teks `"MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI"` dengan ID Spreadsheet yang sudah Anda salin di **Langkah 1**.
   *Contoh:*
   ```javascript
   var SPREADSHEET_ID = "1A2bC3dE4fGhIjKlMnOpQrStUvWxYz1234567890";
   ```
3. Klik tombol **Simpan** (ikon disket di bagian atas) atau tekan `Ctrl + S` (`Cmd + S` di Mac).

### Langkah 5: Jalankan Pembuatan Database Otomatis (Sangat Penting!)
Anda tidak perlu membuat lembar sheet/tabel satu per satu secara manual. Script ini sudah dilengkapi modul pembangun tabel otomatis (**`initializePOSDatabase`**).
1. Pada menu bar bagian atas Google Apps Script, perhatikan dropdown pilihan fungsi (biasanya secara default bertuliskan `doGet` atau `doPost`).
2. Klik dropdown tersebut dan pilih fungsi bernama **`initializePOSDatabase`**.
3. Klik tombol **Jalankan** (ikon segitiga *Run*) di sebelah kirinya.
4. **Otorisasi Izin Akses**:
   * Google akan menampilkan pop-up meminta otorisasi akun karena script memerlukan akses untuk mengubah Spreadsheet Anda.
   * Klik **Tinjau Izin** (*Review Permissions*).
   * Pilih akun Google Anda.
   * Klik **Lanjutan** (*Advanced*) di bagian kiri bawah, lalu pilih **Buka Backend Sajian Indy API (tidak aman)** (*Go to Backend Sajian Indy API (unsafe)*).
   * Gulir ke bawah dan klik **Izinkan** (*Allow*).
5. Tunggu hingga proses eksekusi selesai. 
6. Sekarang, periksa kembali Google Sheet Anda! Anda akan melihat Google Sheet Anda kini otomatis terisi dengan 11 lembar sheet/tabel database baru beserta header kolomnya yang lengkap dan 4 akun demo utama (Super Admin, Owner `ndy`, Kasir Jakarta `Siti`, dan Kasir Bandung `Andi`).

### Langkah 6: Deploy Sebagai Web App (Publikasi Database)
Agar aplikasi web Sajian Indy dapat membaca dan menulis data ke Google Sheet, Anda harus mendeploy script ini sebagai Web App publik yang aman.
1. Di kanan atas halaman Google Apps Script, klik tombol biru **Terapkan** > **Terapkan baru** (*Deploy > New deployment*).
2. Klik ikon gir (Jenis penerapan) di sebelah tulisan "Pilih jenis", lalu pilih **Aplikasi web** (*Web app*).
3. Isi konfigurasi sebagai berikut:
   * **Deskripsi**: `Sajian Indy Cloud POS V1`
   * **Jalankan sebagai** (*Execute as*): Pilih **Saya (indychintia@gmail.com)**.
   * **Yang memiliki akses** (*Who has access*): Pilih **Siapa saja** (*Anyone*). ini wajib dipilih agar aplikasi web POS eksternal dapat melakukan panggilan API dengan aman tanpa login akun pribadi Google di browser pelanggan. (Keamanan data tetap terkunci dengan token rahasia backend di Code.gs).
4. Klik tombol **Terapkan** (*Deploy*).
5. Setelah beberapa detik, deployment berhasil. Cari bagian **Aplikasi web** dan **Salin URL Aplikasi Web** yang diberikan.
   *Contoh URL-nya:*
   ```text
   https://script.google.com/macros/s/AKfycbz...abc...123/exec
   ```

---

## 🔗 Menghubungkan ke Aplikasi Web Sajian Indy

Setelah Anda mendapatkan URL Web App dari langkah di atas:
1. Jalankan aplikasi web **Sajian Indy**.
2. Masuk menggunakan akun admin default:
   * **Username**: `admin`
   * **Password**: `admin`
3. Di bilah menu utama, cari opsi konfigurasi database Google Sheets (atau klik tombol status cloud/database di bagian header/sidebar).
4. **Tempelkan (Paste) URL Web App** Google Apps Script yang sudah Anda salin ke dalam kolom input *"Google Apps Script Web App Deployment URL"*.
5. Klik **Simpan & Hubungkan** (*Save & Connect*).
6. Aplikasi akan memuat ulang secara dinamis. Anda bebas bertransaksi dan semua data kini bersinkronisasi secara langsung ke cloud Google Sheets Anda!

---

## 📊 Skema Struktur Tabel Database (Referensi)

Tiga belas lembar sheet database otomatis yang dibuat oleh fungsi inisialisasi adalah sebagai berikut:

| Nama Sheet | Keterangan Data | Kolom Utama / Header |
| :--- | :--- | :--- |
| `USERS` | Kredensial Pengguna & Otoritas Akses | `id`, `username`, `password`, `name`, `role`, `branchId`, `active` |
| `PRODUCTS` | Katalog Menu / Produk & Harga Jual | `sku`, `barcode`, `name`, `description`, `category`, `buyPrice`, `sellPrice`, `memberPrice`, `stock`, `minStock`, `branchId`, `image`, `active` |
| `STOCKS` | Riwayat Mutasi Pasokan Stok Masuk/Keluar | `id`, `sku`, `branchId`, `type`, `qty`, `notes`, `date`, `user` |
| `TRANSACTIONS`| Ringkasan Bukti Transaksi Penjualan POS | `id`, `date`, `totalAmount`, `discountAmount`, `taxAmount`, `finalAmount`, `paymentMethod`, `changeAmount`, `customerId`, `branchId`, `cashierId`, `cashierName` |
| `TRANSACTION_ITEMS` | Detail Item Produk yang Terjual | `id`, `transactionId`, `sku`, `productName`, `price`, `qty`, `total`, `discount` |
| `CUSTOMERS` | CRM / Data Pelanggan Member & Poin Reward| `id`, `name`, `phone`, `email`, `point`, `memberRank`, `notes` |
| `SUPPLIERS` | Data Kontak Produsen/Supplier Bahan Baku | `id`, `name`, `contact`, `phone`, `address` |
| `PURCHASES` | Riwayat Pembelian Bahan Baku (Purchase Order)| `id`, `code`, `supplierId`, `supplierName`, `date`, `totalAmount`, `status`, `branchId`, `items` |
| `CASHFLOWS` | Buku Kas Arus Keuangan (Debet/Kredit) | `id`, `date`, `type`, `category`, `amount`, `description`, `branchId`, `user` |
| `ACTIVITY_LOG`| Rekaman Jejak Audit Keamanan Sistem | `id`, `userId`, `username`, `action`, `ip`, `timestamp`, `details` |
| `NOTIFICATIONS`| Notifikasi Sistem Berjalan & Stok Kritis | `id`, `type`, `title`, `message`, `timestamp`, `read` |

---

## 🛡️ Dukungan Pemulihan Lokal (Keamanan Ganda)
Jika koneksi internet terputus atau Google Sheets Anda belum dikonfigurasi, aplikasi **Sajian Indy** secara cerdas akan langsung beralih ke database lokal browser (LocalStorage) demi kenyamanan Anda saat mengelola POS tanpa jeda atau *crash*. Ketika internet pulih dan URL dimasukkan, data akan tersimpan dengan lancar ke awan. Selamat berkembang! 📈🚀
