# Agan Dev Tools v2

<p align="center">
  <strong>Modern Developer Toolkit</strong><br>
  19+ productivity tools for programmers, system administrators, and IT professionals.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-black" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Cara Menjalankan](#cara-menjalankan)
- [Daftar Tools](#daftar-tools)
  - [Encoders & Decoders](#encoders--decoders)
  - [Generators](#generators)
  - [Converters](#converters)
  - [Text & Code](#text--code)
  - [Network & Web](#network--web)
  - [Sysadmin & Utils](#sysadmin--utils)
- [Script Commands](#script-commands)
- [Struktur Folder](#struktur-folder)
- [License](#license)

---

## Fitur Utama

- **19 tools** dalam satu aplikasi web
- **Dark/Light mode** dengan toggle otomatis
- **Command Palette** tekan `Ctrl+K` untuk cari tools cepat
- **Responsive** berjalan di desktop dan mobile
- **Sidebar navigasi** dengan kategori terorganisir
- **Copy to clipboard** di hampir semua tools
- **Offline-ready** semua proses berjalan di browser (client-side)

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Next.js | 16 | Full-stack React framework |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first CSS |
| shadcn/ui | latest | UI component library |
| Zustand | 5 | State management |
| Lucide React | 0.525 | Icon library |

---

## Cara Menjalankan

### Prasyarat

- **Node.js** v18 atau lebih baru (disarankan v20+)
- **npm** v9+ (atau bun/yarn)

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/agansulisfiana/agan-dev-tools-v2.git
cd agan-dev-tools-v2

# 2. Install dependencies
npm install

# 3. Buat file .env
echo "DATABASE_URL=file:./db/custom.db" > .env

# 4. Jalankan development server
npm run dev
```

### Buka di Browser

```
http://localhost:3000
```

### Production Build

```bash
# Build
npm run build

# Jalankan production server
npm run start
```

---

## Daftar Tools

### Encoders & Decoders

#### 1. JSON Formatter
Format, validasi, dan beautify data JSON dengan syntax highlighting. Mendukung minify, copy, dan indentasi kustom (2/4 spasi atau tab).

**Fungsi:**
- Format JSON yang acak menjadi rapi dan terstruktur
- Validasi JSON apakah syntax-nya benar
- Minify JSON untuk mengurangi ukuran
- Copy output dengan satu klik
- Tampilkan error detail jika JSON tidak valid

---

#### 2. Base64 Codec
Encode dan decode string dan file ke format Base64. Mendukung teks biasa dan upload file.

**Fungsi:**
- Encode teks ke Base64
- Decode Base64 ke teks asli
- Upload file dan encode/decode otomatis
- Tampilkan ukuran file sebelum dan sesudah encoding
- Copy hasil dengan satu klik

---

#### 3. URL Encoder
Encode dan decode komponen URL dan query parameter. Mendukung encode full URI atau per-komponen.

**Fungsi:**
- Encode teks untuk aman digunakan di URL
- Decode URL yang sudah di-encode
- Encode seluruh URI atau hanya komponen tertentu
- Reverse encode/decode dengan tombol swap
- Copy hasil dengan satu klik

---

#### 4. JWT Decoder
Decode dan inspeksi JSON Web Token (JWT). Menampilkan header, payload, dan signature.

**Fungsi:**
- Decode JWT dan tampilkan header + payload dalam format JSON
- Tampilkan issued-at, expiration, dan claims lain dalam format yang mudah dibaca
- Deteksi apakah token sudah expired
- Highlight token yang tidak valid
- Copy decoded data dengan satu klik

---

### Generators

#### 5. Password Generator
Generate password yang kuat dan bisa dikustomisasi sesuai kebutuhan.

**Fungsi:**
- Atur panjang password (4-128 karakter)
- Pilih karakter: huruf besar, huruf kecil, angka, simbol
- Exclude karakter tertentu yang tidak diinginkan
- Generate multiple password sekaligus
- Hitung kekuatan password (entropy)
- Copy password dengan satu klik

---

#### 6. Hash Generator
Generate hash dari teks atau file menggunakan berbagai algoritma.

**Fungsi:**
- Hash teks dengan MD5, SHA-1, SHA-256, SHA-512
- Hash file dengan drag & drop atau upload
- Tampilkan hash dalam format uppercase/lowercase
- Compare hash untuk verifikasi integritas
- Copy hash dengan satu klik

---

#### 7. UUID Generator
Generate UUID (Universally Unique Identifier) versi 4 dan 7 dalam jumlah banyak.

**Fungsi:**
- Generate UUID v4 (random) dan v7 (time-ordered)
- Generate banyak UUID sekaligus (1-100)
- Pilih format: uppercase, lowercase, tanpa hyphen
- Copy satu atau semua UUID
- History UUID yang pernah di-generate

---

#### 8. QR Code Generator
Generate QR Code dari teks, URL, WiFi, email, atau vCard.

**Fungsi:**
- Generate QR dari teks bebas atau URL
- Preset WiFi (SSID, password, tipe enkripsi)
- Preset Email (to, subject, body)
- Preset vCard (nama, telepon, email)
- Atur ukuran, warna foreground/background, error correction level
- Download QR Code sebagai gambar PNG
- Copy QR Code ke clipboard

---

#### 9. Barcode Generator
Generate barcode dalam berbagai format: CODE128, EAN-13, UPC-A, CODE39, ITF-14, MSI, Pharmacode.

**Fungsi:**
- Pilih format barcode
- Atur lebar bar, tinggi, dan tampilan teks
- Preview barcode secara real-time
- Download barcode sebagai gambar PNG
- Copy barcode ke clipboard

---

### Converters

#### 10. Color Picker
Konversi warna antar format HEX, RGB, HSL, HSV, dan lainnya.

**Fungsi:**
- Color picker visual dengan palette
- Input warna dalam format HEX, RGB, HSL
- Konversi otomatis ke semua format
- Tampilkan warna yang kontras (accessible)
- Copy kode warna dalam format apapun
- Adjustment sliders untuk HSL/RGB

---

#### 11. Timestamp Converter
Konversi antara Unix timestamp, ISO 8601, dan format tanggal manusia.

**Fungsi:**
- Konversi Unix timestamp (seconds/milliseconds) ke tanggal
- Konversi tanggal ke Unix timestamp
- Tampilkan timestamp saat ini (live)
- Support relative time (5 menit lalu, 3 hari yang lalu)
- Konversi antar timezone
- Copy hasil dengan satu klik

---

#### 12. Unit Converter
Konversi antar berbagai satuan pengukuran.

**Fungsi:**
- Panjang: meter, feet, inch, km, mile, cm, yard
- Berat: kg, pound, ounce, gram, ton
- Suhu: Celsius, Fahrenheit, Kelvin
- Volume: liter, gallon, ml, cup, oz
- Data: byte, KB, MB, GB, TB
- Area: m2, ft2, acre, hectare
- Kecepatan: m/s, km/h, mph, knot

---

### Text & Code

#### 13. Regex Tester
Test dan debug regular expression dengan matching real-time.

**Fungsi:**
- Input regex pattern dan test string
- Highlight semua match yang ditemukan
- Tampilkan semua match groups (capture groups)
- Toggle flags: global (g), case-insensitive (i), multiline (m), dotall (s), unicode (u)
- Library regex patterns yang sering dipakai (email, URL, IP, dll)
- Hitung jumlah match

---

#### 14. Diff Compare
Bandingkan dua teks dan highlight perbedaannya side by side atau inline.

**Fungsi:**
- Input dua teks untuk dibandingkan
- Mode: side by side (dua kolom) atau inline (satu kolom)
- Statistik: jumlah addition, deletion, change, unchanged
- Opsi ignore whitespace dan ignore case
- Nomor baris di kedua sisi
- Copy diff result
- Swap teks kiri-kanan

---

#### 15. Cron Generator
Buat dan jelaskan cron expression dengan editor visual.

**Fungsi:**
- Input cron expression (5 field: minute, hour, day, month, weekday)
- Editor visual untuk setiap field
- Jelaskan cron expression dalam bahasa manusia (human-readable)
- Tampilkan next 10 execution times
- Preset cron yang sering dipakai (setiap menit, hourly, daily, dll)
- Copy cron expression

---

### Network & Web

#### 16. HTTP Request Tester
Test HTTP/HTTPS request dengan custom headers dan body.

**Fungsi:**
- Pilih method: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Input URL lengkap
- Custom headers (key-value pairs, bisa tambah/hapus)
- Request body (raw JSON, form data, dll)
- Tampilkan response: status code, headers, body
- History request yang pernah dilakukan
- Copy response

---

#### 17. Network Calculator
Kalkulator IP address, CIDR, dan subnet.

**Fungsi:**
- Input IP address dan subnet mask atau CIDR
- Hitung network address, broadcast address
- Tampilkan range IP yang tersedia (first/last host)
- Hitung jumlah host dalam subnet
- Konversi CIDR ke subnet mask dan sebaliknya
- Tampilkan representasi binary
- Wildcard mask

---

### Sysadmin & Utils

#### 18. Command Cheatsheet
Referensi cepat untuk command line Linux dan Windows.

**Fungsi:**
- Kategori: File, Process, Network, System, Package Manager, Docker, Git
- Search/filter command berdasarkan keyword
- Contoh penggunaan setiap command
- Toggle antara Linux dan Windows
- Copy command dengan satu klik

---

#### 19. File Hash Checker
Hitung dan verifikasi checksum file (MD5, SHA-1, SHA-256, SHA-512).

**Fungsi:**
- Upload file atau drag & drop
- Hitung hash otomatis dengan semua algoritma
- Bandingkan hash dengan hash yang diinput (untuk verifikasi)
- Tampilkan indikator match/mismatch
- Copy hash dengan satu klik
- Tampilkan nama dan ukuran file

---

## Script Commands

| Command | Fungsi |
|---------|--------|
| `npm run dev` | Jalankan development server (port 3000) |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Cek kualitas kode dengan ESLint |

---

## Struktur Folder

```
src/
├── app/
│   ├── globals.css          # Global styles & Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Halaman utama
├── components/
│   ├── layout/
│   │   ├── app-header.tsx   # Header dengan search & theme toggle
│   │   └── app-sidebar.tsx  # Sidebar navigasi tools
│   ├── tools/               # 19 tool components
│   │   ├── json-formatter.tsx
│   │   ├── jwt-decoder.tsx
│   │   ├── hash-generator.tsx
│   │   ├── password-generator.tsx
│   │   ├── uuid-generator.tsx
│   │   ├── url-encoder.tsx
│   │   ├── base64-codec.tsx
│   │   ├── color-picker.tsx
│   │   ├── timestamp-converter.tsx
│   │   ├── regex-tester.tsx
│   │   ├── qr-generator.tsx
│   │   ├── cron-generator.tsx
│   │   ├── diff-compare.tsx
│   │   ├── barcode-generator.tsx
│   │   ├── unit-converter.tsx
│   │   ├── network-tools.tsx
│   │   ├── command-cheatsheet.tsx
│   │   ├── http-tester.tsx
│   │   └── file-hash.tsx
│   ├── ui/                  # shadcn/ui components
│   └── providers.tsx        # Client-side providers (theme)
├── hooks/
│   ├── use-mobile.ts        # Mobile detection hook
│   └── use-toast.ts         # Toast notification hook
├── lib/
│   ├── tools-data.ts        # Tool definitions & search
│   └── utils.ts             # Utility functions (cn, etc.)
└── stores/
    └── app-store.ts         # Zustand global state
```

---

## License

MIT License - lihat file [LICENSE](LICENSE) untuk detail lengkap.