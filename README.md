<div align="center">

# ⭐ STARLIGHT

### MULTI-PROVIDER URL RESOLVER & DOWNLOADER

**One Engine. Multiple Providers. One Interface.**

A JavaScript-powered CLI project designed for Termux and Node.js.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**13 PROVIDERS · JAVASCRIPT · NODE.JS · TERMUX**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

# 📖 DAFTAR ISI

- [1. Tentang STARLIGHT](#-1-tentang-starlight)
- [2. Filosofi Project](#-2-filosofi-project)
- [3. Fitur Utama](#-3-fitur-utama)
- [4. Daftar Provider](#-4-daftar-provider)
- [5. Cara Kerja](#-5-cara-kerja)
- [6. Persyaratan Sistem](#-6-persyaratan-sistem)
- [7. Instalasi di Termux](#-7-instalasi-di-termux)
- [8. Instalasi di Linux](#-8-instalasi-di-linux)
- [9. Instalasi di Windows](#-9-instalasi-di-windows)
- [10. Tutorial Penggunaan](#-10-tutorial-penggunaan)
- [11. Penjelasan Dependencies](#-11-penjelasan-dependencies)
- [12. Struktur Project](#-12-struktur-project)
- [13. Mengatasi Masalah](#-13-mengatasi-masalah)
- [14. Keamanan](#-14-keamanan)
- [15. Batasan Sistem](#-15-batasan-sistem)
- [16. FAQ](#-16-frequently-asked-questions)
- [17. License](#-17-license)
- [18. Copyright](#-18-copyright)

---

# ⭐ 1. TENTANG STARLIGHT

**STARLIGHT** adalah project berbasis JavaScript yang dirancang untuk
menyatukan berbagai workflow resolusi URL dan pengambilan media
dalam satu antarmuka command-line.

Project ini menggunakan Node.js sebagai runtime dan sejumlah library
JavaScript untuk mendukung pemrosesan HTTP, parsing HTML, interaksi
terminal, serta tampilan informasi.

STARLIGHT dikembangkan dengan tujuan membuat penggunaan berbagai
provider lebih praktis tanpa harus berpindah-pindah aplikasi atau
menjalankan banyak tools yang berbeda.

Dengan pendekatan multi-provider, pengguna dapat memilih layanan yang
didukung melalui satu lingkungan kerja.

STARLIGHT dirancang untuk pengguna yang membutuhkan:

- Pengelolaan berbagai URL dari satu CLI.
- Workflow resolusi tautan yang didukung.
- Integrasi sejumlah provider dalam satu project.
- Penggunaan melalui terminal Android.
- Penggunaan melalui lingkungan Node.js lainnya.
- Antarmuka yang sederhana dan mudah dipahami.
- Penanganan error yang jelas.
- Pengembangan dan pemeliharaan source code yang terstruktur.

STARLIGHT merupakan project independen dan tidak menyatakan afiliasi
resmi dengan penyedia layanan pihak ketiga yang tercantum di dalam
dokumentasi ini.

## 🎯 Tujuan Utama

Tujuan STARLIGHT bukan sekadar mengumpulkan banyak provider dalam satu
program.

Project ini juga menekankan pentingnya konsistensi workflow,
kemudahan penggunaan, pemeliharaan kode, dan pengalaman pengguna
yang baik.

Jumlah provider bukan satu-satunya ukuran kualitas sebuah resolver.
Keandalan, kompatibilitas, keamanan, dan penanganan error juga
merupakan bagian penting dari pengembangan.

---

# 🧠 2. FILOSOFI PROJECT

STARLIGHT dibangun berdasarkan beberapa prinsip.

## 2.1 One Engine, Multiple Providers

Pengguna tidak harus mempelajari cara menjalankan banyak tools
yang berbeda untuk setiap provider.

STARLIGHT bertujuan menyediakan satu tempat untuk mengakses berbagai
workflow yang didukung.

## 2.2 Simple Interface

Antarmuka terminal sebaiknya mudah dipahami.

Pengguna baru harus dapat mengetahui langkah berikutnya tanpa perlu
membaca seluruh source code terlebih dahulu.

## 2.3 Reliability First

Sebuah provider tidak cukup hanya muncul di daftar.

Implementasinya harus mampu menangani respons yang tidak sesuai,
kegagalan jaringan, URL yang tidak valid, dan perubahan layanan
pihak ketiga.

## 2.4 Responsible Usage

STARLIGHT ditujukan untuk penggunaan yang sah.

Pengguna harus menghormati izin akses, hak cipta, ketentuan layanan,
serta privasi pemilik konten.

## 2.5 Maintainable Code

Source code yang mudah dipahami akan lebih mudah diperiksa,
diperbaiki, dan dipelihara ketika provider mengalami perubahan.

---

# 🚀 3. FITUR UTAMA

Fitur yang tersedia bergantung pada implementasi versi STARLIGHT
yang digunakan.

## 🔗 Multi-Provider Support

STARLIGHT mencantumkan 13 provider yang menjadi target dukungan
project.

Setiap provider dapat memiliki mekanisme akses, format URL,
dan keterbatasan yang berbeda.

## ⚡ URL Resolution Workflow

Resolver bertujuan memproses URL untuk memperoleh informasi tujuan
atau URL hasil resolusi apabila proses tersebut didukung.

Tidak semua tautan dapat diselesaikan secara otomatis.

## 📥 Downloader Workflow

Beberapa provider mendukung workflow pengambilan file atau media.

Keberhasilan proses bergantung pada provider, izin akses, format
konten, dan implementasi downloader.

## 🖥️ Command-Line Interface

STARLIGHT berjalan melalui terminal menggunakan Node.js.

Apabila versi yang digunakan menyediakan menu interaktif, pengguna
dapat memilih provider dan memasukkan URL melalui menu tersebut.

## 📱 Termux Compatibility

STARLIGHT dapat dijalankan di Termux selama versi Node.js,
dependencies, dan seluruh komponen yang digunakan kompatibel.

## 🌐 HTTP Request Processing

Axios dapat digunakan untuk melakukan request HTTP dan menangani
respons dari layanan web.

## 🧩 HTML Parsing

Cheerio dapat digunakan untuk membaca struktur HTML apabila
implementasi provider memerlukannya.

## 📊 Terminal Output

cli-table3 dapat digunakan untuk menampilkan data dalam bentuk tabel
terminal.

## ⌨️ Interactive Prompts

Prompts dapat digunakan untuk meminta input pengguna melalui
command-line interface.

## 🛠️ Error Handling

Implementasi yang baik perlu menangani kondisi seperti:

- URL tidak valid.
- Provider tidak dikenal.
- Koneksi internet terputus.
- Request mengalami timeout.
- Server menolak request.
- Konten tidak tersedia.
- Akses file dibatasi.
- Struktur halaman berubah.
- Respons server tidak sesuai harapan.

Ketersediaan setiap fitur tersebut bergantung pada implementasi
yang digunakan.

---

# 🌐 4. DAFTAR PROVIDER

STARLIGHT mencantumkan 13 provider berikut.

| No. | Provider | Kategori |
|:---:|---|---|
| 01 | Rekonise | Link unlock |
| 02 | MediaFire | File hosting |
| 03 | SFile | File hosting |
| 04 | Safelinku | URL redirect |
| 05 | Sub2Unlock | Link unlock |
| 06 | Unshorten | URL redirection |
| 07 | Pixeldrain | File hosting |
| 08 | KrakenFiles | File hosting |
| 09 | Google Drive | Cloud storage |
| 10 | DoodStream | Video hosting |
| 11 | Catbox | File hosting |
| 12 | TikTok | Video workflow |
| 13 | TeraBox | Cloud storage |

**Penting:** Daftar ini menunjukkan cakupan provider yang dicantumkan
oleh project. Daftar tersebut bukan jaminan bahwa setiap provider
selalu tersedia atau seluruh fiturnya berhasil pada setiap kondisi.

## 4.1 Rekonise

Kategori: Link unlock.

Rekonise termasuk dalam daftar provider STARLIGHT untuk workflow
tautan yang didukung.

Keberhasilan pemrosesan bergantung pada format tautan, mekanisme
layanan, dan implementasi resolver.

## 4.2 MediaFire

Kategori: File hosting.

MediaFire merupakan layanan penyimpanan dan berbagi file.

STARLIGHT dapat digunakan untuk workflow MediaFire yang didukung
oleh implementasinya.

Akses terhadap file tetap bergantung pada izin, ketersediaan file,
dan ketentuan layanan.

## 4.3 SFile

Kategori: File hosting.

SFile tercantum sebagai salah satu provider dalam STARLIGHT.

Dukungan aktual bergantung pada format URL dan implementasi
yang tersedia.

## 4.4 Safelinku

Kategori: URL redirect.

Safelinku termasuk dalam daftar provider yang ditangani oleh
STARLIGHT.

Proses resolusi dapat dipengaruhi oleh perubahan alur redirect,
sesi, validasi, atau mekanisme layanan.

STARLIGHT tidak menjamin semua tautan dapat diproses dalam setiap
kondisi.

## 4.5 Sub2Unlock

Kategori: Link unlock.

Sub2Unlock tercantum sebagai provider untuk workflow tautan yang
didukung.

Ketersediaan hasil bergantung pada implementasi dan ketentuan
layanan terkait.

## 4.6 Unshorten

Kategori: URL redirection.

Unshorten berkaitan dengan workflow penelusuran tujuan URL.

Tidak semua redirect dapat diikuti secara otomatis. Beberapa URL
memerlukan autentikasi, interaksi pengguna, atau akses yang
tidak tersedia bagi resolver.

## 4.7 Pixeldrain

Kategori: File hosting.

Pixeldrain merupakan layanan berbagi file.

STARLIGHT mencantumkannya sebagai salah satu provider untuk workflow
yang didukung.

Akses file dan kecepatan proses bergantung pada koneksi, izin akses,
respons server, serta kondisi layanan.

## 4.8 KrakenFiles

Kategori: File hosting.

KrakenFiles tercantum sebagai salah satu provider STARLIGHT.

Keberhasilan proses bergantung pada ketersediaan file dan dukungan
implementasi terhadap mekanisme layanan.

## 4.9 Google Drive

Kategori: Cloud storage.

Google Drive merupakan layanan penyimpanan cloud.

Akses file dapat dibatasi oleh pemilik, pengaturan berbagi,
autentikasi, atau kebijakan layanan.

Jika suatu file menghasilkan HTTP 403, periksa izin aksesnya
terlebih dahulu.

STARLIGHT tidak dapat menjamin akses terhadap file privat atau
file yang tidak diizinkan untuk diakses pengguna.

## 4.10 DoodStream

Kategori: Video hosting.

DoodStream tercantum sebagai provider untuk workflow video yang
didukung.

Respons layanan dapat berubah dan akses terhadap konten dapat
bergantung pada kebijakan layanan, sesi, serta ketersediaan konten.

## 4.11 Catbox

Kategori: File hosting.

Catbox tercantum sebagai provider untuk workflow file yang didukung.

Ketersediaan file dan keberhasilan request tetap bergantung pada
layanan terkait.

## 4.12 TikTok

Kategori: Video workflow.

TikTok tercantum sebagai provider dalam daftar STARLIGHT.

Dukungan fitur aktual dapat berbeda bergantung pada implementasi
versi yang digunakan.

Ketersediaan video, pembatasan akun, privasi, dan ketentuan platform
dapat memengaruhi hasil.

## 4.13 TeraBox

Kategori: Cloud storage.

TeraBox tercantum sebagai provider untuk workflow yang didukung.

Akses file, autentikasi, pembatasan layanan, dan perubahan mekanisme
akses dapat memengaruhi keberhasilan proses.

---

# ⚙️ 5. CARA KERJA STARLIGHT

Secara umum, workflow resolver dapat dibagi menjadi beberapa tahap.

## Tahap 1 — Input

Pengguna memberikan URL yang ingin diproses.

Input perlu diperiksa untuk memastikan URL memiliki format yang valid.

## Tahap 2 — Provider Identification

Program menentukan provider berdasarkan URL atau pilihan pengguna.

Metode identifikasi bergantung pada implementasi STARLIGHT.

## Tahap 3 — Request Processing

Program menjalankan workflow yang sesuai.

Pada tahap ini, implementasi dapat melakukan request HTTP atau
membaca respons yang diperlukan.

## Tahap 4 — Response Processing

Respons dari layanan diproses untuk mendapatkan informasi yang
dibutuhkan.

Jika menggunakan HTML parsing, implementasi dapat menggunakan
Cheerio untuk membaca struktur halaman.

## Tahap 5 — Result

Program menampilkan hasil yang tersedia.

Hasil dapat berupa informasi tujuan, status proses, URL hasil
resolusi, atau pesan error sesuai kemampuan implementasi.

## Tahap 6 — Error Handling

Jika proses gagal, program sebaiknya menampilkan pesan yang
menjelaskan masalah tanpa membocorkan data sensitif.

Urutan di atas merupakan gambaran umum workflow resolver, bukan
jaminan bahwa seluruh provider menggunakan mekanisme yang identik.

---

# 📋 6. PERSYARATAN SISTEM

Sebelum menggunakan STARLIGHT, siapkan lingkungan berikut.

## Perangkat

- Android dengan Termux, atau komputer dengan lingkungan Node.js.
- Koneksi internet.
- Ruang penyimpanan yang cukup.
- Source code STARLIGHT.

## Software

- Node.js.
- npm.
- Dependencies project.

## Dependencies

STARLIGHT menggunakan paket berikut:

| Package | Kegunaan |
|---|---|
| axios | HTTP requests |
| cheerio | HTML parsing |
| prompts | Input interaktif |
| cli-table3 | Tabel terminal |

Pastikan seluruh package di atas sesuai dengan kebutuhan versi
source code yang digunakan.

---

# 📱 7. INSTALASI DI TERMUX

Bagian ini menjelaskan instalasi dari awal untuk pengguna Android.

## Langkah 1 — Buka Termux

Buka aplikasi Termux.

Pastikan aplikasi dapat mengakses internet.

## Langkah 2 — Install Node.js

Jalankan:

```bash
pkg install nodejs -y
```

Tunggu sampai instalasi selesai.

Perintah tersebut memasang Node.js dari repository package Termux
yang tersedia.

## Langkah 3 — Periksa Instalasi

Jalankan:

```bash
node --version
```

Kemudian:

```bash
npm --version
```

Jika kedua perintah menampilkan nomor versi, Node.js dan npm
dapat ditemukan oleh terminal.

Jika muncul pesan bahwa command tidak ditemukan, periksa instalasi
package dan konfigurasi PATH.

## Langkah 4 — Aktifkan Akses Penyimpanan

Jalankan:

```bash
termux-setup-storage
```

Jika Android menampilkan permintaan izin, berikan izin penyimpanan
yang diperlukan.

Perintah ini membantu Termux mengakses lokasi penyimpanan bersama
yang diizinkan oleh Android.

**Catatan:** Akses penyimpanan tidak berarti Termux memperoleh
akses tanpa batas terhadap seluruh data perangkat.

## Langkah 5 — Masuk ke Direktori Project

Jika source code berada di folder home bernama `STARLIGHT`, jalankan:

```bash
cd ~/STARLIGHT
```

Jika source code berada di lokasi berbeda, gunakan path direktori
yang sebenarnya.

Pastikan file utama tersedia:

```bash
ls
```

Cari file:

```text
starlight.js
```

Jika file tidak ditemukan, periksa lokasi project sebelum melanjutkan.

## Langkah 6 — Install Dependencies

Jalankan:

```bash
npm i axios cheerio prompts cli-table3
```

npm akan mengunduh package yang diperlukan dari registry npm.

Pastikan proses instalasi selesai tanpa error.

Jika project memiliki `package.json` yang sudah mencantumkan semua
dependencies, perintah berikut juga dapat digunakan:

```bash
npm install
```

Gunakan cara instalasi yang sesuai dengan struktur repository.

## Langkah 7 — Jalankan STARLIGHT

Jalankan:

```bash
node starlight.js
```

Jika file utama benar dan dependencies tersedia, Node.js akan
menjalankan program.

Jika program menyediakan menu interaktif, ikuti pilihan yang
ditampilkan pada terminal.

## Ringkasan Instalasi

Berikut seluruh perintah dasar yang dapat digunakan:

```bash
pkg install nodejs -y
termux-setup-storage
npm i axios cheerio prompts cli-table3
node starlight.js
```

**Penting:** Perintah di atas mengasumsikan lu sudah berada di
direktori yang berisi `starlight.js`.

Jika belum, masuklah ke direktori project terlebih dahulu.

---

# 🐧 8. INSTALASI DI LINUX

Pastikan Node.js dan npm tersedia pada sistem.

Periksa:

```bash
node --version
npm --version
```

Masuk ke direktori project:

```bash
cd STARLIGHT
```

Install dependencies:

```bash
npm install
```

Jalankan program:

```bash
node starlight.js
```

Perintah instalasi Node.js dapat berbeda menurut distribusi Linux.

Gunakan dokumentasi resmi distribusi yang digunakan untuk memilih
metode instalasi yang sesuai.

---

# 🪟 9. INSTALASI DI WINDOWS

Pastikan Node.js telah terpasang.

Buka PowerShell atau terminal yang mendukung Node.js.

Periksa instalasi:

```powershell
node --version
npm --version
```

Masuk ke direktori project:

```powershell
cd STARLIGHT
```

Install dependencies:

```powershell
npm install
```

Jalankan:

```powershell
node starlight.js
```

Jika terjadi error terkait dependency, periksa pesan error dan
pastikan semua package yang dibutuhkan telah terpasang.

---

# 🎮 10. TUTORIAL PENGGUNAAN

## 10.1 Menjalankan Program

Dari direktori project, jalankan:

```bash
node starlight.js
```

Jangan menjalankan perintah tersebut dari direktori yang tidak
berisi file utama, kecuali menggunakan path lengkap yang benar.

## 10.2 Memilih Provider

Jika STARLIGHT menampilkan menu provider, pilih layanan yang sesuai
dengan URL yang ingin diproses.

Contohnya, URL MediaFire seharusnya diproses melalui workflow
MediaFire apabila implementasi tersebut tersedia.

Nama pilihan dan cara navigasi mengikuti tampilan versi program.

## 10.3 Memasukkan URL

Masukkan URL lengkap pada input yang disediakan.

Pastikan:

- URL tidak terpotong.
- Tidak ada spasi yang tidak diperlukan.
- URL berasal dari layanan yang didukung.
- URL dapat diakses secara sah.
- File atau konten masih tersedia.

## 10.4 Menunggu Hasil

Setelah URL dimasukkan, tunggu sampai program menyelesaikan proses.

Jangan menganggap proses gagal hanya karena provider membutuhkan
waktu lebih lama.

Jika proses berhenti atau menampilkan error, catat pesan yang muncul
untuk membantu pemeriksaan.

## 10.5 Memeriksa Hasil

Periksa output terminal.

Jika program menghasilkan URL, pastikan hasilnya berasal dari
proses yang benar dan tidak mengarah ke domain yang mencurigakan.

Jangan membuka atau mengunduh file yang tidak dipercaya.

## 10.6 Mengakhiri Program

Gunakan mekanisme keluar yang disediakan oleh aplikasi.

Jika tidak tersedia dan program perlu dihentikan, terminal umumnya
mendukung:

```text
Ctrl + C
```

Pada perangkat Android, kombinasi tombol dapat bergantung pada
keyboard atau konfigurasi Termux.

---

# 📦 11. PENJELASAN DEPENDENCIES

## 11.1 Axios

Axios merupakan library JavaScript untuk HTTP request.

Dalam sebuah resolver, Axios dapat digunakan untuk mengirim request
dan membaca respons dari layanan web.

Instalasi:

```bash
npm install axios
```

## 11.2 Cheerio

Cheerio menyediakan API untuk memproses struktur HTML.

Library ini dapat digunakan apabila implementasi membutuhkan
pembacaan elemen halaman.

Instalasi:

```bash
npm install cheerio
```

## 11.3 Prompts

Prompts merupakan library untuk menerima input melalui command line.

Library ini dapat membantu membuat menu dan pertanyaan interaktif.

Instalasi:

```bash
npm install prompts
```

## 11.4 cli-table3

cli-table3 dapat digunakan untuk menampilkan data berbentuk tabel
di terminal.

Instalasi:

```bash
npm install cli-table3
```

## 11.5 Install Seluruh Dependencies

Untuk menginstal semua package yang disebutkan:

```bash
npm i axios cheerio prompts cli-table3
```

---

# 📂 12. STRUKTUR PROJECT

Contoh struktur sederhana:

```text
STARLIGHT/
├── starlight.js
├── package.json
├── package-lock.json
├── README.md
├── LICENSE
└── node_modules/
```

Penjelasan:

| File/Folder | Fungsi |
|---|---|
| starlight.js | Contoh entry point program |
| package.json | Metadata dan dependencies npm |
| package-lock.json | Catatan versi dependency hasil instalasi npm |
| README.md | Dokumentasi project |
| LICENSE | Ketentuan lisensi project |
| node_modules | Package yang dipasang melalui npm |

Struktur tersebut merupakan contoh dokumentasi.

Struktur sebenarnya harus mengikuti source code STARLIGHT yang
dipublikasikan.

Folder `node_modules` biasanya tidak perlu diunggah ke repository
karena dependencies dapat dipasang kembali menggunakan npm.

---

# 🛠️ 13. MENGATASI MASALAH

Bagian ini menjelaskan beberapa masalah umum yang mungkin ditemui
ketika menjalankan aplikasi Node.js.

## Masalah 1 — `node: command not found`

Penyebab:

Node.js belum terpasang atau tidak tersedia pada PATH.

Solusi di Termux:

```bash
pkg install nodejs -y
```

Kemudian periksa:

```bash
node --version
```

## Masalah 2 — `npm: command not found`

Periksa instalasi Node.js dan npm.

Jalankan:

```bash
node --version
npm --version
```

Jika salah satunya tidak tersedia, periksa package yang terpasang
dan konfigurasi lingkungan.

## Masalah 3 — `Cannot find module 'axios'`

Penyebab:

Package belum dipasang atau terminal sedang berada di direktori
project yang salah.

Solusi:

```bash
npm i axios cheerio prompts cli-table3
```

Pastikan perintah dijalankan di direktori project yang benar.

## Masalah 4 — `Cannot find module 'cheerio'`

Install package:

```bash
npm install cheerio
```

Jika error tetap terjadi, periksa `package.json` dan pastikan
program menggunakan nama module yang benar.

## Masalah 5 — `Cannot find module 'prompts'`

Install:

```bash
npm install prompts
```

## Masalah 6 — `Cannot find module 'cli-table3'`

Install:

```bash
npm install cli-table3
```

## Masalah 7 — `Cannot find module './...'`

Penyebab yang mungkin:

- File internal tidak tersedia.
- Nama file berbeda.
- Huruf besar dan kecil pada nama file tidak cocok.
- Struktur direktori tidak sesuai.
- Program dijalankan dari lokasi yang salah.

Solusi:

Periksa isi direktori:

```bash
ls
```

Pastikan seluruh file source code yang dibutuhkan tersedia.

## Masalah 8 — `Invalid URL`

Pastikan URL lengkap dan memiliki format yang valid.

Periksa kembali apakah URL terpotong ketika disalin.

## Masalah 9 — HTTP 403 Forbidden

HTTP 403 menunjukkan bahwa server menolak permintaan.

Penyebab yang mungkin:

- File memerlukan izin akses.
- Pemilik membatasi akses file.
- Autentikasi yang diperlukan tidak tersedia.
- Server menerapkan pembatasan akses.
- Request tidak memenuhi ketentuan layanan.

Solusi:

Periksa izin akses dan pastikan pengguna memang berhak membuka file
tersebut.

HTTP 403 tidak selalu berarti source code STARLIGHT mengalami bug.

## Masalah 10 — HTTP 404 Not Found

Sumber yang diminta tidak ditemukan atau tidak tersedia pada alamat
tersebut.

Periksa URL dan pastikan file atau konten masih tersedia.

## Masalah 11 — Request Timeout

Penyebab yang mungkin:

- Koneksi internet lambat.
- Server sedang mengalami gangguan.
- Request memerlukan waktu lebih lama.
- Provider sedang tidak tersedia.

Periksa koneksi internet dan coba kembali setelah beberapa saat.

## Masalah 12 — HTML Berubah

Provider dapat memperbarui struktur halaman webnya.

Jika implementasi bergantung pada struktur HTML tertentu, perubahan
tersebut dapat menyebabkan proses parsing gagal.

Periksa respons dan log error sebelum melakukan perubahan source code.

## Masalah 13 — Provider Tidak Tersedia

Provider dapat mengalami gangguan, pembatasan, atau perubahan sistem.

Pastikan masalah bukan berasal dari koneksi lokal atau izin akses.

STARLIGHT tidak menjamin semua layanan pihak ketiga selalu tersedia.

---

# 🔐 14. KEAMANAN

Keamanan merupakan tanggung jawab penting dalam penggunaan dan
pemeliharaan STARLIGHT.

## 14.1 Lindungi Informasi Pribadi

Jangan membagikan:

- Password.
- API key rahasia.
- Access token.
- Cookie autentikasi.
- Session ID.
- Informasi pribadi.
- File konfigurasi yang mengandung kredensial.

## 14.2 Periksa Source Code

Sebelum menjalankan source code dari pihak lain, periksa fungsi
program dan dependensi yang digunakan.

Jangan menjalankan kode yang tidak dipercaya hanya karena memiliki
nama project atau tampilan terminal yang meyakinkan.

## 14.3 Periksa URL

Sebelum membuka hasil resolusi, periksa domain dan tujuan URL.

Jangan menganggap seluruh URL yang dihasilkan otomatis aman.

## 14.4 Tidak Ada API Key Bukan Berarti Tanpa Risiko

Project yang tidak membutuhkan API key tetap dapat memiliki risiko
keamanan melalui request jaringan, dependensi, input pengguna,
atau pemrosesan data.

Lakukan pemeriksaan yang sesuai sebelum memublikasikan source code.

---

# ⚖️ 15. BATASAN SISTEM

STARLIGHT memiliki batasan yang perlu dipahami pengguna.

## 15.1 Ketergantungan pada Provider

STARLIGHT bergantung pada layanan pihak ketiga untuk provider
yang terintegrasi.

Jika layanan mengubah sistemnya, implementasi terkait mungkin
tidak lagi berfungsi sebagaimana mestinya.

## 15.2 Koneksi Internet

Proses yang membutuhkan request jaringan memerlukan koneksi internet
yang memadai.

## 15.3 Izin Akses

Program tidak dapat menjamin akses terhadap file privat atau
konten yang dibatasi pemiliknya.

## 15.4 Perubahan Kebijakan

Ketentuan layanan dapat berubah dan memengaruhi ketersediaan fitur.

## 15.5 Kompatibilitas

Kompatibilitas bergantung pada versi Node.js, package, sistem operasi,
dan implementasi yang digunakan.

## 15.6 Tidak Ada Jaminan Keberhasilan Universal

Tidak ada jaminan bahwa setiap URL akan berhasil diproses.

Hasil bergantung pada provider, izin akses, jaringan, format URL,
dan kondisi sistem.

---

# ❓ 16. FREQUENTLY ASKED QUESTIONS

## Q1. Apa itu STARLIGHT?

STARLIGHT adalah project JavaScript untuk workflow resolusi URL dan
downloader dengan dukungan provider yang dicantumkan dalam project.

## Q2. Apakah STARLIGHT bisa dijalankan di Android?

STARLIGHT dapat dijalankan melalui Termux jika runtime, dependencies,
dan implementasinya kompatibel.

## Q3. Apakah STARLIGHT membutuhkan Node.js?

Ya. Project ini menggunakan Node.js untuk menjalankan file JavaScript.

## Q4. Bagaimana cara memasang dependencies?

Jalankan:

```bash
npm i axios cheerio prompts cli-table3
```

Perintah tersebut menginstal package yang disebutkan dalam dokumentasi.

## Q5. Bagaimana cara menjalankan STARLIGHT?

Dari direktori yang berisi file utama:

```bash
node starlight.js
```

## Q6. Apakah semua provider selalu berfungsi?

Tidak ada jaminan demikian. Provider dapat berubah, mengalami gangguan,
atau membatasi akses.

## Q7. Mengapa URL tertentu gagal diproses?

Penyebabnya dapat berupa URL tidak valid, izin akses, gangguan jaringan,
perubahan layanan, atau keterbatasan implementasi.

## Q8. Apakah STARLIGHT dapat membuka semua file privat?

Tidak. STARLIGHT tidak memberikan hak akses yang tidak dimiliki
pengguna.

## Q9. Apakah STARLIGHT memerlukan API key?

Kebutuhan autentikasi bergantung pada implementasi dan provider.
Dokumentasi ini tidak menyatakan bahwa semua provider dapat digunakan
tanpa kredensial.

## Q10. Bolehkah source code STARLIGHT dimodifikasi?

Hak untuk memodifikasi ditentukan oleh lisensi yang benar-benar
menyertai source code.

Periksa file `LICENSE` sebelum menggunakan project.

## Q11. Bolehkah STARLIGHT dijual kembali?

Hal tersebut bergantung pada ketentuan lisensi yang berlaku dan
izin yang diberikan oleh pemegang hak cipta.

## Q12. Apakah STARLIGHT merupakan layanan resmi dari provider?

Tidak ada afiliasi resmi yang dinyatakan dalam dokumentasi ini.
Nama layanan pihak ketiga digunakan untuk mengidentifikasi provider
yang dicantumkan oleh project.

---

# 📜 17. LICENSE

STARLIGHT menggunakan lisensi yang ditentukan oleh pemegang hak cipta.

Pengguna wajib membaca file `LICENSE` sebelum menggunakan,
menyalin, mendistribusikan, atau mengintegrasikan source code.

Jika pemilik project bermaksud melarang modifikasi, redistribusi,
atau penjualan ulang, larangan tersebut harus dituliskan secara jelas
dalam dokumen lisensi yang sesuai.

README ini hanya menjelaskan kebijakan yang dimaksudkan oleh pemilik.
README bukan pengganti dokumen lisensi lengkap.

**Jangan menyebut project ini open-source apabila lisensinya tidak
memberikan hak yang dipersyaratkan oleh definisi open-source.**

Untuk distribusi dengan batasan khusus, gunakan lisensi proprietary
atau custom license yang disusun sesuai kebutuhan dan hukum yang
berlaku.

---

# © 18. COPYRIGHT

Copyright (c) [2026] [CLOVER TEAM]

All rights reserved, subject to the terms of the accompanying LICENSE.

STARLIGHT is an independently developed project.

All third-party names, logos, and trademarks belong to their
respective owners.

Their inclusion in this documentation does not imply sponsorship,
endorsement, or official affiliation.

---

<div align="center">

# ⭐ STARLIGHT

### ONE ENGINE. MULTIPLE PROVIDERS. ONE CLI.

**Built with JavaScript. Designed for terminal workflows.**

</div>