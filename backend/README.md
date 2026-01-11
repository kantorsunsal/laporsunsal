# Backend Setup - LaporSunsal

## 📖 Daftar Isi

- [Arsitektur](#arsitektur)
- [File yang Tersedia](#file-yang-tersedia)
- [Sistem Role](#sistem-role)
- [Setup Google Apps Script](#setup-google-apps-script)
- [Setup Cloudflare Worker & R2](#setup-cloudflare-worker--r2)
- [API Endpoints](#api-endpoints)
- [Kredensial Default](#kredensial-default)

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 16 + shadcn/ui                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│   Cloudflare Worker     │     │   Google Apps Script (Auth)     │
│   (Upload + Forward)    │     │   Login, Register, Verify       │
└─────────────────────────┘     └─────────────────────────────────┘
              │                               │
    ┌─────────┴─────────┐                     │
    ▼                   ▼                     ▼
┌───────────┐   ┌───────────────────┐   ┌───────────────────┐
│ R2 Bucket │   │ Google Apps Script │   │   Google Sheets   │
│  (Image)  │   │      (API)         │   │    (Database)     │
└───────────┘   └───────────────────┘   └───────────────────┘
```

---

## File yang Tersedia

| File                          | Deskripsi                                            |
| ----------------------------- | ---------------------------------------------------- |
| `google-apps-script/Setup.gs` | **UTAMA** - Auto-setup database + semua API          |
| `google-apps-script/Auth.gs`  | API autentikasi (legacy, sudah digabung ke Setup.gs) |
| `google-apps-script/Code.gs`  | API konfirmasi (legacy, sudah digabung ke Setup.gs)  |
| `cloudflare-worker/worker.js` | Worker untuk upload gambar ke R2                     |

> **Catatan**: Gunakan `Setup.gs` saja karena sudah mencakup semua fungsi.

---

## Sistem Role

### Hierarki Role

```
👑 super_admin (Level 3)
    │
    ├── Semua akses
    ├── Hapus data
    ├── Kelola user & admin
    └── Verifikasi konfirmasi

🛡️ admin (Level 2)
    │
    ├── Lihat semua data
    └── Verifikasi konfirmasi

👤 user (Level 1)
    │
    ├── Submit konfirmasi
    └── Lihat data sendiri
```

### Cara Pembuatan User

| Role          | Cara Buat                                                    |
| ------------- | ------------------------------------------------------------ |
| `user`        | Register via aplikasi (halaman login)                        |
| `admin`       | Via Google Sheets menu: 👑 Super Admin → ➕ Buat Admin       |
| `super_admin` | Via Google Sheets menu: 👑 Super Admin → ➕ Buat Super Admin |

### ID Prefix

| Role        | Prefix ID |
| ----------- | --------- |
| Super Admin | `SPA-xxx` |
| Admin       | `ADM-xxx` |
| User        | `USR-xxx` |

---

## Setup Google Apps Script

### Langkah 1: Buat Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **+ Blank** untuk buat spreadsheet baru
3. Beri nama: `LaporSunsal Database`

### Langkah 2: Buka Apps Script

1. Klik menu **Extensions** → **Apps Script**
2. Hapus semua kode default di `Code.gs`

### Langkah 3: Paste Kode

1. Buka file `Setup.gs` dari folder `backend/google-apps-script/`
2. Copy seluruh isi file
3. Paste ke Apps Script
4. Klik **Save** (Ctrl+S)

### Langkah 4: Jalankan Setup

1. Pilih fungsi `setupDatabase` dari dropdown
2. Klik tombol **▶ Run**
3. Klik **Review Permissions** → pilih akun Google → **Allow**
4. Ikuti dialog yang muncul

### Langkah 5: Deploy Web App

1. Klik **Deploy** → **New deployment**
2. Klik ⚙️ icon → pilih **Web app**
3. Konfigurasi:
   - Description: `LaporSunsal API v1.0`
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Klik **Deploy**
5. **SALIN URL Web App** yang muncul

### Langkah 6: Update Frontend

Ganti URL di file frontend:

```typescript
// src/components/AuthForm.tsx
const AUTH_API_URL = "URL_WEB_APP_ANDA";

// src/components/ConfirmationForm.tsx
const API_URL = "URL_WEB_APP_ANDA";
```

---

## Setup Cloudflare Worker & R2

### Langkah 1: Buat R2 Bucket

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Klik **R2** di sidebar
3. Klik **Create bucket**
4. Nama bucket: `laporsunsal-images`
5. Klik **Create bucket**

### Langkah 2: Aktifkan Public Access

1. Klik bucket yang baru dibuat
2. Klik tab **Settings**
3. Di bagian **Public access**, klik **Allow Access**
4. Salin **Public bucket URL** (format: `https://pub-xxx.r2.dev`)

### Langkah 3: Buat Worker

1. Klik **Workers & Pages** di sidebar
2. Klik **Create application** → **Create Worker**
3. Nama: `laporsunsal-api`
4. Klik **Deploy**

### Langkah 4: Edit Worker

1. Klik **Edit code**
2. Hapus semua kode default
3. Paste kode dari `cloudflare-worker/worker.js`
4. Update konfigurasi:
   ```javascript
   const CONFIG = {
     GAS_URL: "URL_WEB_APP_GAS_ANDA",
     R2_PUBLIC_URL: "https://pub-xxx.r2.dev",
     ALLOWED_ORIGINS: ["http://localhost:3000", "https://your-domain.com"],
   };
   ```
5. Klik **Save and Deploy**

### Langkah 5: Bind R2 ke Worker

1. Kembali ke halaman Worker
2. Klik tab **Settings** → **Variables**
3. Scroll ke **R2 Bucket Bindings**
4. Klik **Add binding**
5. Variable name: `MY_BUCKET`
6. R2 Bucket: pilih `laporsunsal-images`
7. Klik **Save**

### Langkah 6: Update Frontend

```typescript
// src/components/ConfirmationForm.tsx
const WORKER_URL = "https://laporsunsal-api.your-account.workers.dev";
```

---

## API Endpoints

### Authentication

| Action         | Method | Deskripsi                     |
| -------------- | ------ | ----------------------------- |
| `register`     | POST   | Daftar user baru (role: user) |
| `login`        | POST   | Login user                    |
| `verify_token` | POST   | Verifikasi token              |

### Confirmations

| Action                | Method | Deskripsi               | Akses       |
| --------------------- | ------ | ----------------------- | ----------- |
| `submit_confirmation` | POST   | Submit konfirmasi baru  | User        |
| `get_confirmations`   | POST   | Ambil daftar konfirmasi | All         |
| `verify_confirmation` | POST   | Verifikasi konfirmasi   | Admin+      |
| `delete_confirmation` | POST   | Hapus konfirmasi        | Super Admin |

### Admin

| Action             | Method | Deskripsi        | Akses       |
| ------------------ | ------ | ---------------- | ----------- |
| `get_all_users`    | POST   | Ambil semua user | Admin+      |
| `change_user_role` | POST   | Ubah role user   | Super Admin |

### Lembaga

| Action        | Method   | Deskripsi            |
| ------------- | -------- | -------------------- |
| `get_lembaga` | GET/POST | Ambil daftar lembaga |

### Contoh Request

```javascript
// Login
fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "login",
    email: "user@example.com",
    password: "password123",
  }),
});

// Submit Confirmation
fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "submit_confirmation",
    user_id: "USR-xxx",
    paymentDate: "2026-01-08",
    paymentMethod: "Transfer Bank",
    amount: "500000",
    // ... field lainnya
  }),
});
```

---

## Kredensial Default

### Super Admin Default

| Field    | Value                        |
| -------- | ---------------------------- |
| Email    | `superadmin@laporsunsal.com` |
| Password | `admin123`                   |
| Role     | `super_admin`                |

> ⚠️ **PENTING**: Segera ganti password setelah login pertama!

### Cara Ganti Password

1. Buka Google Sheets database
2. Menu **🚀 LaporSunsal** → **👑 Super Admin** → **🔄 Reset Password**
3. Masukkan email dan password baru

---

## Menu Google Sheets

Setelah setup, menu custom akan muncul di spreadsheet:

```
🚀 LaporSunsal
├── 📊 Dashboard Stats
├── 👥 Lihat Total Users
├── 💰 Lihat Total Konfirmasi
├── ─────────────────
├── 👑 Super Admin
│   ├── ➕ Buat Super Admin
│   ├── ➕ Buat Admin
│   ├── 📋 Lihat Semua Role
│   ├── 🗑️ Hapus User
│   ├── 🔄 Reset Password
│   └── 🔀 Ubah Role User
├── ─────────────────
├── 🔄 Reset Database
├── 📥 Export Data
└── ℹ️ Tentang
```

---

## Struktur Database (Sheets)

### Users

| Kolom    | Deskripsi                      |
| -------- | ------------------------------ |
| ID       | ID unik user (SPA/ADM/USR-xxx) |
| Nama     | Nama lengkap                   |
| Email    | Email (unique)                 |
| Password | Password (hashed)              |
| Phone    | Nomor HP                       |
| Lembaga  | Nama lembaga/instansi          |
| Role     | super_admin / admin / user     |
| Created  | Tanggal daftar                 |
| Status   | active / inactive              |

### Confirmations

| Kolom         | Deskripsi                     |
| ------------- | ----------------------------- |
| ID            | ID konfirmasi (CNF-xxx)       |
| User_ID       | ID user yang submit           |
| Tanggal_Bayar | Tanggal pembayaran            |
| Metode        | Metode pembayaran             |
| Bank_Penerima | Bank penerima                 |
| Nama_Penerima | Nama penerima                 |
| Nominal       | Jumlah pembayaran             |
| Bank_Pengirim | Bank pengirim                 |
| Nama_Pengirim | Nama pengirim                 |
| Bukti_URL     | URL gambar bukti              |
| Keterangan    | Catatan tambahan              |
| Status        | Pending / Verified / Rejected |
| Created       | Tanggal submit                |
| Verified_By   | ID admin yang verifikasi      |
| Verified_At   | Tanggal verifikasi            |

### Lembaga

| Kolom        | Deskripsi                         |
| ------------ | --------------------------------- |
| ID           | ID lembaga                        |
| Nama_Lembaga | Nama lembaga                      |
| Kategori     | Pondok Pesantren / Madrasah / TPQ |
| Alamat       | Alamat lengkap                    |
| Kontak       | Nomor kontak                      |
| Status       | active / inactive                 |

### Settings

| Kolom       | Deskripsi         |
| ----------- | ----------------- |
| Key         | Nama setting      |
| Value       | Nilai setting     |
| Description | Deskripsi         |
| Updated_At  | Terakhir diupdate |

### Logs

| Kolom      | Deskripsi        |
| ---------- | ---------------- |
| Timestamp  | Waktu aktivitas  |
| Action     | Jenis aksi       |
| User_ID    | ID pelaku        |
| Details    | Detail aktivitas |
| IP_Address | Alamat IP        |

---

## Troubleshooting

### Error "Script function not found"

- Pastikan sudah paste seluruh kode `Setup.gs`
- Coba refresh halaman Apps Script

### Error "Permission denied"

- Klik "Review Permissions" saat menjalankan script
- Pilih akun Google yang benar

### CORS Error di Frontend

- Pastikan domain frontend ada di `ALLOWED_ORIGINS` pada Cloudflare Worker
- Untuk development, tambahkan `http://localhost:3000`

### Login gagal setelah setup

- Pastikan sudah menjalankan `setupDatabase`
- Gunakan kredensial Super Admin default
- Cek sheet "Users" apakah ada data

---

## Dibuat dengan ❤️

**LaporSunsal v1.0**  
Sistem Konfirmasi Pembayaran Yayasan Sunniyah Salafiyah

Tech Stack:

- Frontend: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui
- Backend: Google Apps Script + Google Sheets
- Storage: Cloudflare R2
- API Gateway: Cloudflare Workers
