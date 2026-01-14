/**
 * ============================================
 * GOOGLE APPS SCRIPT - DATABASE AUTO-SETUP
 * ============================================
 *
 * Script ini akan OTOMATIS membuat semua sheet/tabel
 * yang dibutuhkan untuk aplikasi LaporSunsal.
 *
 * CARA PAKAI:
 * 1. Buat Google Spreadsheet baru (kosong)
 * 2. Buka Extensions > Apps Script
 * 3. Hapus semua kode default
 * 4. Paste SELURUH kode ini
 * 5. Simpan (Ctrl+S)
 * 6. Jalankan fungsi "setupDatabase" dari menu dropdown
 * 7. Klik "Review Permissions" > pilih akun Google Anda
 * 8. Klik "Allow"
 * 9. Selesai! Semua tabel sudah dibuat otomatis.
 *
 * SHEET YANG AKAN DIBUAT:
 * - Users (data pengguna)
 * - Confirmations (data konfirmasi pembayaran)
 * - Lembaga (daftar lembaga/instansi)
 * - Settings (pengaturan aplikasi)
 * - Logs (log aktivitas)
 */

// ============================================
// KONFIGURASI DATABASE
// ============================================

const DB_CONFIG = {
  sheets: {
    USERS: {
      name: "Users",
      headers: [
        "ID", // 0 (A)
        "Nama", // 1 (B)
        "Email", // 2 (C)
        "Password", // 3 (D)
        "Phone", // 4 (E)
        "Lembaga", // 5 (F)
        "Role", // 6 (G)
        "Created", // 7 (H)
        "Status", // 8 (I)
        "Photo_URL", // 9 (J)
        "Is_Verified", // 10 (K) - 0 atau 1
        "Verification_Token", // 11 (L)
        "Reset_Token", // 12 (M)
        "Reset_Expiry", // 13 (N)
      ],
      widths: [
        150, 200, 250, 300, 150, 200, 100, 180, 100, 300, 80, 300, 300, 150,
      ],
      headerColor: "#10b981", // Hijau
      description: "Data pengguna terdaftar",
    },
    SANTRI: {
      name: "santri", // Match existing sheet name (lowercase)
      headers: ["NIS", "NAMA SISWA", "KODE", "Sekolah"],
      widths: [150, 200, 100, 200],
      headerColor: "#ec4899", // Pink
      description: "Data master santri/siswa (existing)",
    },
    USER_SANTRI: {
      name: "User_Santri",
      headers: ["ID", "User_ID", "NIS", "Created"],
      widths: [150, 150, 150, 180],
      headerColor: "#14b8a6", // Teal
      description: "Penghubung user dengan santri (anak)",
    },
    CONFIRMATIONS: {
      name: "Confirmations",
      headers: [
        "ID", // 0 (A)
        "User_ID", // 1 (B)
        "Tanggal_Bayar", // 2 (C)
        "Metode", // 3 (D)
        "Bank_Penerima", // 4 (E)
        "Nama_Penerima", // 5 (F)
        "Nominal", // 6 (G)
        "Bank_Pengirim", // 7 (H)
        "Nama_Pengirim", // 8 (I)
        "Jenis_Bukti", // 9 (J) - NEW: Transfer/Tunai/VA
        "Bukti_URL", // 10 (K)
        "Keterangan", // 11 (L)
        "Status", // 12 (M)
        "Created", // 13 (N)
        "Verified_By", // 14 (O)
        "Verified_At", // 15 (P)
        "Santri_ID", // 16 (Q)
        "Santri_Nama", // 17 (R)
      ],
      widths: [
        150, 150, 150, 120, 150, 150, 130, 150, 150, 100, 250, 200, 100, 180,
        150, 180, 150, 150,
      ],
      headerColor: "#3b82f6", // Biru
      description: "Data konfirmasi pembayaran",
    },
    LEMBAGA: {
      name: "Lembaga",
      headers: ["ID", "Nama_Lembaga", "Kategori", "Alamat", "Kontak", "Status"],
      widths: [100, 250, 150, 300, 150, 100],
      headerColor: "#8b5cf6", // Ungu
      description: "Daftar lembaga/instansi",
    },
    SETTINGS: {
      name: "Settings",
      headers: ["Key", "Value", "Description", "Updated_At"],
      widths: [200, 300, 400, 180],
      headerColor: "#f59e0b", // Kuning
      description: "Pengaturan aplikasi",
    },
    LOGS: {
      name: "Logs",
      headers: ["Timestamp", "Action", "User_ID", "Details", "IP_Address"],
      widths: [180, 150, 150, 400, 150],
      headerColor: "#6b7280", // Abu-abu
      description: "Log aktivitas sistem",
    },
  },

  // Data awal untuk pengaturan
  defaultSettings: [
    ["app_name", "LaporSunsal", "Nama aplikasi", new Date()],
    ["app_version", "1.0.0", "Versi aplikasi", new Date()],
    [
      "secret_key",
      generateRandomKey(),
      "Secret key untuk hashing (JANGAN DIUBAH)",
      new Date(),
    ],
    ["token_expiry_hours", "24", "Durasi token expired (jam)", new Date()],
    ["max_file_size_mb", "5", "Maksimal ukuran file upload (MB)", new Date()],
    [
      "allowed_extensions",
      "jpg,jpeg,png,pdf",
      "Ekstensi file yang diizinkan",
      new Date(),
    ],
    ["admin_email", "", "Email admin untuk notifikasi", new Date()],
    ["app_logo_url", "", "URL logo aplikasi (upload di Settings)", new Date()],
  ],

  // Data awal untuk lembaga (contoh)
  defaultLembaga: [
    [
      "LMB001",
      "PP Sunniyah Salafiyah Pusat",
      "Pondok Pesantren",
      "Pasuruan, Jawa Timur",
      "-",
      "active",
    ],
    [
      "LMB002",
      "MTs Sunniyah Salafiyah",
      "Madrasah",
      "Pasuruan, Jawa Timur",
      "-",
      "active",
    ],
    [
      "LMB003",
      "MA Sunniyah Salafiyah",
      "Madrasah",
      "Pasuruan, Jawa Timur",
      "-",
      "active",
    ],
    [
      "LMB004",
      "TPQ Sunniyah Salafiyah",
      "TPQ",
      "Pasuruan, Jawa Timur",
      "-",
      "active",
    ],
  ],

  // Super Admin default (dibuat saat setup pertama kali)
  // PENTING: Ganti password setelah login pertama!
  defaultSuperAdmin: {
    nama: "Super Admin",
    email: "superadmin@laporsunsal.com",
    password: "admin123", // GANTI SEGERA SETELAH LOGIN!
  },
};

// ============================================
// FUNGSI UTAMA - JALANKAN INI!
// ============================================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Cek apakah sudah ada data
  const existingSheets = [];
  const missingSheets = [];

  for (const [key, config] of Object.entries(DB_CONFIG.sheets)) {
    const sheet = ss.getSheetByName(config.name);
    if (sheet && sheet.getLastRow() > 1) {
      existingSheets.push(config.name);
    } else {
      missingSheets.push(config.name);
    }
  }

  let setupMode = "full"; // full atau update

  // Jika ada data existing, tanya user
  if (existingSheets.length > 0) {
    const response = ui.alert(
      "⚠️ Data Sudah Ada",
      `Sheet berikut sudah memiliki data:\n• ${existingSheets.join(
        "\n• "
      )}\n\n` +
        "Pilih aksi:\n\n" +
        "✅ YES = Update struktur saja (data TIDAK dihapus)\n" +
        "❌ NO = Reset total (SEMUA data dihapus)\n" +
        "🚫 CANCEL = Batalkan",
      ui.ButtonSet.YES_NO_CANCEL
    );

    if (response === ui.Button.CANCEL) {
      ui.alert("Setup dibatalkan.");
      return;
    } else if (response === ui.Button.YES) {
      setupMode = "update";
    } else {
      // Konfirmasi ulang untuk reset
      const confirmReset = ui.alert(
        "⚠️ KONFIRMASI RESET",
        "PERHATIAN: Semua data akan DIHAPUS PERMANEN!\n\n" +
          "Yakin ingin melanjutkan?",
        ui.ButtonSet.YES_NO
      );
      if (confirmReset !== ui.Button.YES) {
        ui.alert("Setup dibatalkan.");
        return;
      }
      setupMode = "full";
    }
  } else {
    // Tidak ada data, konfirmasi biasa
    const response = ui.alert(
      "🚀 Setup Database LaporSunsal",
      "Script ini akan membuat semua tabel/sheet yang dibutuhkan.\n\n" +
        "Sheet yang akan dibuat:\n" +
        "• Users - Data pengguna\n" +
        "• Confirmations - Data konfirmasi pembayaran\n" +
        "• Lembaga - Daftar lembaga\n" +
        "• Settings - Pengaturan\n" +
        "• Logs - Log aktivitas\n\n" +
        "Lanjutkan?",
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      ui.alert("Setup dibatalkan.");
      return;
    }
  }

  try {
    let progress = [];

    if (setupMode === "full") {
      // MODE RESET: Hapus dan buat ulang semua
      for (const [key, config] of Object.entries(DB_CONFIG.sheets)) {
        createSheet(ss, config);
        progress.push(`✅ Sheet "${config.name}" dibuat ulang`);
      }

      // Insert data default
      insertDefaultData(ss, "Settings", DB_CONFIG.defaultSettings);
      progress.push(`✅ Default settings ditambahkan`);

      insertDefaultData(ss, "Lembaga", DB_CONFIG.defaultLembaga);
      progress.push(`✅ Default lembaga ditambahkan`);

      // Buat Super Admin default
      const adminResult = createDefaultSuperAdmin();
      if (adminResult.success) {
        progress.push(
          `✅ Super Admin default dibuat (${DB_CONFIG.defaultSuperAdmin.email})`
        );
      } else {
        progress.push(`⚠️ Super Admin: ${adminResult.message}`);
      }
    } else {
      // MODE UPDATE: Hanya update struktur, jangan hapus data
      for (const [key, config] of Object.entries(DB_CONFIG.sheets)) {
        const result = updateSheetStructure(ss, config);
        progress.push(result);
      }

      // Cek apakah ada Super Admin, jika belum tawarkan untuk buat
      if (!hasSuperAdmin()) {
        const createAdmin = ui.alert(
          "👑 Super Admin Tidak Ditemukan",
          "Database belum memiliki Super Admin.\n\n" +
            "Buat Super Admin default?\n" +
            `Email: ${DB_CONFIG.defaultSuperAdmin.email}\n` +
            `Password: ${DB_CONFIG.defaultSuperAdmin.password}`,
          ui.ButtonSet.YES_NO
        );

        if (createAdmin === ui.Button.YES) {
          const adminResult = createDefaultSuperAdmin();
          if (adminResult.success) {
            progress.push(`✅ Super Admin default dibuat`);
          } else {
            progress.push(`⚠️ ${adminResult.message}`);
          }
        }
      }
    }

    // Hapus sheet default "Sheet1" jika ada
    deleteDefaultSheet(ss);

    // Buat menu custom
    createCustomMenu();
    progress.push(`✅ Menu custom dibuat`);

    // Tampilkan hasil
    ui.alert(
      "🎉 Setup Berhasil!",
      `Mode: ${setupMode === "full" ? "RESET TOTAL" : "UPDATE STRUKTUR"}\n\n` +
        progress.join("\n") +
        "\n\nDatabase LaporSunsal siap digunakan.\n" +
        "Jangan lupa deploy sebagai Web App!",
      ui.ButtonSet.OK
    );

    logActivity(
      "SETUP_DATABASE",
      "SYSTEM",
      `Database setup completed (mode: ${setupMode})`
    );
  } catch (error) {
    ui.alert(
      "❌ Error",
      "Terjadi kesalahan: " + error.toString(),
      ui.ButtonSet.OK
    );
  }
}

/**
 * Update struktur sheet tanpa menghapus data
 * - Cek kolom yang hilang dan tambahkan
 * - Format ulang header jika perlu
 */

/**
 * Buat Super Admin default saat setup awal
 */
function createDefaultSuperAdmin() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  if (!sheet) {
    return { success: false, message: "Sheet Users belum ada" };
  }

  const { nama, email, password } = DB_CONFIG.defaultSuperAdmin;

  // Cek apakah sudah ada super admin
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === "super_admin") {
      return { success: false, message: "Super Admin sudah ada" };
    }
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      return { success: false, message: "Email sudah terdaftar" };
    }
  }

  // Buat super admin
  const userId = "SPA-" + Date.now().toString(36).toUpperCase();
  const hashedPassword = hashPassword(password);

  sheet.appendRow([
    userId,
    nama,
    email.toLowerCase(),
    hashedPassword,
    "-",
    "Administrator",
    "super_admin",
    new Date(),
    "active",
  ]);

  logActivity(
    "CREATE_SUPER_ADMIN",
    "SYSTEM",
    `Default Super Admin created: ${email}`
  );

  return { success: true };
}

/**
 * Cek apakah sudah ada Super Admin di database
 */
function hasSuperAdmin() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet || sheet.getLastRow() <= 1) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === "super_admin") {
      return true;
    }
  }
  return false;
}

function updateSheetStructure(spreadsheet, config) {
  let sheet = spreadsheet.getSheetByName(config.name);

  if (!sheet) {
    // Sheet belum ada, buat baru
    createSheet(spreadsheet, config);
    return `✅ Sheet "${config.name}" dibuat (baru)`;
  }

  // Cek kolom existing
  const existingHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const requiredHeaders = config.headers;

  let addedColumns = [];

  // Cari kolom yang hilang
  for (const header of requiredHeaders) {
    if (!existingHeaders.includes(header)) {
      // Tambahkan kolom baru di akhir
      const newColIndex = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColIndex).setValue(header);
      addedColumns.push(header);
    }
  }

  // Update format header
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground(config.headerColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");

  // Pastikan freeze & filter aktif
  sheet.setFrozenRows(1);

  if (addedColumns.length > 0) {
    return `✅ Sheet "${config.name}" diupdate (+${addedColumns.join(", ")})`;
  } else {
    return `✅ Sheet "${config.name}" sudah lengkap (skip)`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createSheet(spreadsheet, config) {
  // Cek apakah sheet sudah ada
  let sheet = spreadsheet.getSheetByName(config.name);

  if (sheet) {
    // Jika sudah ada, hapus dan buat ulang
    spreadsheet.deleteSheet(sheet);
  }

  // Buat sheet baru
  sheet = spreadsheet.insertSheet(config.name);

  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
  headerRange.setValues([config.headers]);

  // Format headers
  headerRange.setBackground(config.headerColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setBorder(
    true,
    true,
    true,
    true,
    true,
    true,
    "#ffffff",
    SpreadsheetApp.BorderStyle.SOLID
  );

  // Set column widths
  for (let i = 0; i < config.widths.length; i++) {
    sheet.setColumnWidth(i + 1, config.widths[i]);
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set row height untuk header
  sheet.setRowHeight(1, 35);

  // Tambahkan filter
  if (config.headers.length > 0) {
    const dataRange = sheet.getRange(1, 1, 1, config.headers.length);
    dataRange.createFilter();
  }

  // Set nama sheet dengan emoji
  // sheet.setName(config.name);

  return sheet;
}

function insertDefaultData(spreadsheet, sheetName, data) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (sheet && data.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, data.length, data[0].length).setValues(data);
  }
}

function deleteDefaultSheet(spreadsheet) {
  const defaultSheet = spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet) {
    spreadsheet.deleteSheet(defaultSheet);
  }
}

function generateRandomKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function logActivity(action, userId, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logsSheet = ss.getSheetByName("Logs");
    if (logsSheet) {
      logsSheet.appendRow([new Date(), action, userId, details, "-"]);
    }
  } catch (e) {
    // Silent fail untuk logging
  }
}

// ============================================
// CUSTOM MENU
// ============================================

function onOpen() {
  createCustomMenu();
}

function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 LaporSunsal")
    .addItem("📊 Dashboard Stats", "showDashboardStats")
    .addItem("👥 Lihat Total Users", "showTotalUsers")
    .addItem("💰 Lihat Total Konfirmasi", "showTotalConfirmations")
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("👑 Super Admin")
        .addItem("➕ Buat Super Admin", "createSuperAdminPrompt")
        .addItem("➕ Buat Admin", "createAdminPrompt")
        .addItem("📋 Lihat Semua Role", "showAllRoles")
        .addItem("🗑️ Hapus User", "deleteUserPrompt")
        .addItem("🔄 Reset Password", "resetUserPasswordPrompt")
        .addItem("🔀 Ubah Role User", "changeUserRolePrompt")
    )
    .addSeparator()
    .addItem("🔄 Reset Database", "resetDatabase")
    .addItem("📥 Export Data", "exportData")
    .addSeparator()
    .addItem("ℹ️ Tentang", "showAbout")
    .addToUi();
}

function showDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const usersSheet = ss.getSheetByName("Users");
  const confirmSheet = ss.getSheetByName("Confirmations");

  const totalUsers = usersSheet ? Math.max(0, usersSheet.getLastRow() - 1) : 0;
  const totalConfirm = confirmSheet
    ? Math.max(0, confirmSheet.getLastRow() - 1)
    : 0;

  // Hitung konfirmasi pending
  let pendingCount = 0;
  let verifiedCount = 0;

  if (confirmSheet && confirmSheet.getLastRow() > 1) {
    const statusCol = confirmSheet
      .getRange(2, 12, confirmSheet.getLastRow() - 1, 1)
      .getValues();
    statusCol.forEach((row) => {
      if (row[0] === "Pending") pendingCount++;
      if (row[0] === "Verified") verifiedCount++;
    });
  }

  ui.alert(
    "📊 Dashboard Statistics",
    `👥 Total Users: ${totalUsers}\n` +
      `💰 Total Konfirmasi: ${totalConfirm}\n` +
      `⏳ Pending: ${pendingCount}\n` +
      `✅ Verified: ${verifiedCount}`,
    ui.ButtonSet.OK
  );
}

function showTotalUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  SpreadsheetApp.getUi().alert(
    "👥 Total Users",
    `Jumlah user terdaftar: ${count}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showTotalConfirmations() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  SpreadsheetApp.getUi().alert(
    "💰 Total Konfirmasi",
    `Jumlah konfirmasi: ${count}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function resetDatabase() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    "⚠️ Reset Database",
    "PERHATIAN: Ini akan menghapus SEMUA data dan membuat ulang database dari awal.\n\n" +
      "Tindakan ini tidak dapat dibatalkan!\n\n" +
      "Yakin ingin melanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    setupDatabase();
  }
}

function exportData() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "📥 Export Data",
    "Untuk export data:\n\n" +
      "1. Pilih sheet yang ingin diexport\n" +
      "2. Klik File > Download\n" +
      "3. Pilih format (Excel, CSV, dll)\n\n" +
      "Atau gunakan menu File > Make a copy untuk backup seluruh database.",
    ui.ButtonSet.OK
  );
}

function showAbout() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "ℹ️ Tentang LaporSunsal",
    "🏫 LaporSunsal Database v1.0\n\n" +
      "Sistem konfirmasi pembayaran untuk\n" +
      "Yayasan Sunniyah Salafiyah\n\n" +
      "📅 Created: 2026\n" +
      "💻 Tech: Next.js 16 + Google Apps Script + Cloudflare R2\n\n" +
      "Dibuat dengan ❤️",
    ui.ButtonSet.OK
  );
}

// ============================================
// API ENDPOINTS (untuk Web App)
// ============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      // Auth Actions
      case "register":
        return handleRegister(data);
      case "login":
        return handleLogin(data);
      case "verify_token":
        return handleVerifyToken(data);

      // Confirmation Actions
      case "submit_confirmation":
        return handleSubmitConfirmation(data);
      case "get_confirmations":
        return handleGetConfirmations(data);
      case "update_status":
        return handleUpdateStatus(data);

      // Lembaga Actions
      case "get_lembaga":
        return handleGetLembaga();

      // Santri Actions
      case "get_santri":
        return handleGetSantri(data);
      case "search_santri":
        return handleSearchSantri(data);
      case "add_santri":
        return handleAddSantri(data);
      case "update_santri":
        return handleUpdateSantri(data);
      case "delete_santri":
        return handleDeleteSantri(data);

      // Admin Actions
      case "get_all_users":
        return handleGetAllUsers(data);
      case "change_user_role":
        return handleChangeUserRole(data);
      case "verify_confirmation":
        return handleVerifyConfirmation(data);
      case "delete_confirmation":
        return handleDeleteConfirmation(data);
      case "get_dashboard_stats":
        return handleGetDashboardStats(data);
      case "get_pending_confirmations":
        return handleGetPendingConfirmations(data);
      case "get_all_confirmations":
        return handleGetAllConfirmations(data);
      case "delete_user":
        return handleDeleteUser(data);
      case "get_settings":
        return handleGetSettings(data);
      case "update_settings":
        return handleUpdateSettings(data);
      case "get_logs":
        return handleGetLogs(data);
      case "delete_log":
        return handleDeleteLog(data);
      case "delete_logs_bulk":
        return handleDeleteLogsBulk(data);

      // Profile Actions
      case "change_password":
        return handleChangePassword(data);
      case "update_profile":
        return handleUpdateProfile(data);

      // Manual Email Verification (Super Admin only)
      case "manual_verify_email":
        return handleManualVerifyEmail(data);
      case "resend_verification_email":
        return handleResendVerificationEmail(data);

      // Email & Password Reset Actions (untuk Cloudflare Worker)
      case "verify_email":
        return handleVerifyEmailToken(data);
      case "set_reset_token":
        return handleSetResetToken(data);
      case "reset_password":
        return handleResetPasswordWithToken(data);

      default:
        return jsonResponse({ success: false, error: "Invalid action" });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action;

  switch (action) {
    case "health":
      return jsonResponse({
        status: "OK",
        timestamp: new Date().toISOString(),
      });
    case "get_lembaga":
      return handleGetLembaga();
    case "get_public_settings":
      return handleGetPublicSettings();
    default:
      return jsonResponse({
        status: "OK",
        message: "LaporSunsal API v1.0",
        endpoints: [
          "register",
          "login",
          "submit_confirmation",
          "get_confirmations",
        ],
      });
  }
}

// ============================================
// AUTH HANDLERS
// ============================================

function handleRegister(data) {
  const { nama, email, password, phone, lembaga } = data;

  if (!nama || !email || !password) {
    return jsonResponse({
      success: false,
      error: "Nama, email, dan password wajib diisi",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  // Cek email sudah terdaftar
  const emails = sheet
    .getRange(2, 3, Math.max(1, sheet.getLastRow() - 1), 1)
    .getValues();
  for (const row of emails) {
    if (row[0] && row[0].toLowerCase() === email.toLowerCase()) {
      return jsonResponse({ success: false, error: "Email sudah terdaftar" });
    }
  }

  // Generate ID dan hash password
  const userId = "USR-" + Date.now().toString(36).toUpperCase();
  const hashedPassword = hashPassword(password);

  // Generate verification token (random string)
  const verificationToken =
    "V-" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Insert user baru (default role = user)
  sheet.appendRow([
    userId,
    nama,
    email.toLowerCase(),
    hashedPassword,
    phone || "-",
    lembaga || "-",
    "user", // Role default
    new Date(),
    "active",
    "", // Photo_URL
    0, // Is_Verified (kolom 11, index 10)
    verificationToken, // Verification_Token (kolom 12, index 11)
  ]);

  const token = generateToken(userId, email);

  logActivity("REGISTER", userId, `New user registered: ${email}`);

  return jsonResponse({
    success: true,
    message: "Registrasi berhasil!",
    user: { id: userId, nama, email, phone, lembaga, photo_url: "" },
    token: token,
    verification_token: verificationToken,
  });
}

function handleLogin(data) {
  const { email, password } = data;

  if (!email || !password) {
    return jsonResponse({
      success: false,
      error: "Email dan password wajib diisi",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][2] && users[i][2].toLowerCase() === email.toLowerCase()) {
      // Kolom 8 adalah Status (setelah Role ditambahkan)
      if (users[i][8] !== "active") {
        return jsonResponse({ success: false, error: "Akun tidak aktif" });
      }

      // Cek verifikasi email hanya untuk role "user" (bukan admin/superadmin)
      const role = users[i][6] || "user";
      const isVerified = users[i][10]; // Kolom 11 (index 10) = Is_Verified

      if (role === "user" && !isVerified) {
        return jsonResponse({
          success: false,
          error: "Email belum diverifikasi. Silakan cek email Anda.",
        });
      }

      if (verifyPassword(password, users[i][3])) {
        const token = generateToken(users[i][0], email);
        logActivity("LOGIN", users[i][0], `User logged in: ${email}`);

        return jsonResponse({
          success: true,
          user: {
            id: users[i][0],
            nama: users[i][1],
            email: users[i][2],
            phone: users[i][4],
            lembaga: users[i][5],
            role: role,
            photo_url: users[i][9] || "",
            is_verified: isVerified ? true : false,
          },
          token: token,
        });
      } else {
        return jsonResponse({ success: false, error: "Password salah" });
      }
    }
  }

  return jsonResponse({ success: false, error: "Email tidak terdaftar" });
}

function handleVerifyToken(data) {
  const decoded = decodeToken(data.token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === decoded.userId) {
      return jsonResponse({
        success: true,
        user: {
          id: users[i][0],
          nama: users[i][1],
          email: users[i][2],
          phone: users[i][4],
          lembaga: users[i][5],
          role: users[i][6] || "user",
          photo_url: users[i][9] || "",
        },
      });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

// ============================================
// PROFILE HANDLERS
// ============================================

function handleChangePassword(data) {
  const { user_id, old_password, new_password } = data;

  if (!user_id || !old_password || !new_password) {
    return jsonResponse({
      success: false,
      error: "User ID, password lama, dan password baru wajib diisi",
    });
  }

  if (new_password.length < 6) {
    return jsonResponse({
      success: false,
      error: "Password baru minimal 6 karakter",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === user_id) {
      // Verifikasi password lama
      if (!verifyPassword(old_password, users[i][3])) {
        return jsonResponse({ success: false, error: "Password lama salah" });
      }

      // Hash password baru dan update
      const hashedNewPassword = hashPassword(new_password);
      sheet.getRange(i + 1, 4).setValue(hashedNewPassword);

      logActivity("CHANGE_PASSWORD", user_id, "Password changed successfully");

      return jsonResponse({
        success: true,
        message: "Password berhasil diubah",
      });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

function handleUpdateProfile(data) {
  const { user_id, nama, phone, lembaga, photo_url } = data;

  if (!user_id) {
    return jsonResponse({
      success: false,
      error: "User ID wajib diisi",
    });
  }

  if (!nama || nama.trim() === "") {
    return jsonResponse({
      success: false,
      error: "Nama tidak boleh kosong",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === user_id) {
      // Update nama (kolom 2)
      sheet.getRange(i + 1, 2).setValue(nama);

      // Update phone (kolom 5)
      sheet.getRange(i + 1, 5).setValue(phone || "-");

      // Update lembaga (kolom 6)
      sheet.getRange(i + 1, 6).setValue(lembaga || "-");

      // Update photo_url (kolom 10)
      if (photo_url) {
        sheet.getRange(i + 1, 10).setValue(photo_url);
      }

      logActivity("UPDATE_PROFILE", user_id, `Profile updated: ${nama}`);

      return jsonResponse({
        success: true,
        message: "Profil berhasil diperbarui",
        user: {
          id: users[i][0],
          nama: nama,
          email: users[i][2],
          phone: phone || "-",
          lembaga: lembaga || "-",
          photo_url: photo_url || "",
        },
      });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

// ============================================
// CONFIRMATION HANDLERS
// ============================================

function handleSubmitConfirmation(data) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");

  const confirmId = "CNF-" + Date.now().toString(36).toUpperCase();

  // Determine Jenis_Bukti based on paymentMethod
  let jenisBukti = "Transfer";
  const method = (data.paymentMethod || "transfer").toLowerCase();
  if (method === "tunai" || method === "cash") {
    jenisBukti = "Tunai";
  } else if (
    method === "va" ||
    method === "virtual_account" ||
    method.includes("virtual")
  ) {
    jenisBukti = "Virtual Account";
  }

  sheet.appendRow([
    confirmId, // A (0): ID
    data.user_id || "-", // B (1): User_ID
    data.paymentDate || "-", // C (2): Tanggal_Bayar
    data.paymentMethod || "-", // D (3): Metode
    data.receivingBank || "-", // E (4): Bank_Penerima
    data.recipientName || "-", // F (5): Nama_Penerima
    data.amount || "-", // G (6): Nominal
    data.bankName || "-", // H (7): Bank_Pengirim
    data.senderName || "-", // I (8): Nama_Pengirim
    jenisBukti, // J (9): Jenis_Bukti - NEW
    data.image_url || "-", // K (10): Bukti_URL
    data.notes || "-", // L (11): Keterangan
    "Pending", // M (12): Status
    new Date(), // N (13): Created
    "-", // O (14): Verified_By
    "-", // P (15): Verified_At
    data.santri_id || "-", // Q (16): Santri_ID
    data.santri_nama || "-", // R (17): Santri_Nama
  ]);

  logActivity(
    "SUBMIT_CONFIRMATION",
    data.user_id,
    `New confirmation: ${confirmId}`
  );

  return jsonResponse({
    success: true,
    message: "Konfirmasi berhasil dikirim",
    confirmationId: confirmId,
  });
}

function handleGetConfirmations(data) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const rows = sheet.getDataRange().getValues();

  const confirmations = [];
  for (let i = 1; i < rows.length; i++) {
    // Filter by user_id if provided
    if (data.user_id && rows[i][1] !== data.user_id) continue;

    confirmations.push({
      id: rows[i][0], // A: ID
      user_id: rows[i][1], // B: User_ID
      payment_date: rows[i][2], // C: Tanggal_Bayar
      method: rows[i][3], // D: Metode
      receiving_bank: rows[i][4], // E: Bank_Penerima
      recipient_name: rows[i][5], // F: Nama_Penerima
      amount: rows[i][6], // G: Nominal
      sender_bank: rows[i][7], // H: Bank_Pengirim
      sender_name: rows[i][8], // I: Nama_Pengirim
      jenis_bukti: rows[i][9], // J: Jenis_Bukti - NEW
      image_url: rows[i][10], // K: Bukti_URL
      notes: rows[i][11], // L: Keterangan
      status: rows[i][12], // M: Status
      created: rows[i][13], // N: Created
      santri_id: rows[i][16], // Q: Santri_ID
      santri_nama: rows[i][17], // R: Santri_Nama
    });
  }

  return jsonResponse({ success: true, data: confirmations });
}

function handleGetDashboardStats(data) {
  const user_id = data.user_id ? String(data.user_id).trim() : null;
  if (!user_id) {
    return jsonResponse({ success: false, error: "User ID wajib diisi" });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const rows = sheet.getDataRange().getValues();

  let totalAmount = 0;
  let pendingCount = 0;
  let lastPaymentDate = null; // Tanggal bayar terakhir dari transaksi Verified
  const activities = [];

  for (let i = 1; i < rows.length; i++) {
    const rowUserId = String(rows[i][1]).trim();
    if (rowUserId !== user_id) continue;

    // Column structure:
    // A (0): ID
    // B (1): User_ID
    // C (2): Tanggal_Bayar - tanggal transfer/VA/tunai sesuai struk
    // D (3): Metode
    // E (4): Bank_Penerima
    // F (5): Nama_Penerima
    // G (6): Nominal
    // H (7): Bank_Pengirim
    // I (8): Nama_Pengirim
    // J (9): Jenis_Bukti
    // K (10): Bukti_URL
    // L (11): Keterangan
    // M (12): Status
    // N (13): Created - tanggal upload (BUKAN tanggal transaksi)
    // Q (16): Santri_ID
    // R (17): Santri_Nama

    const amountStr = String(rows[i][6]).replace(/[^\d]/g, "");
    const amount = parseInt(amountStr) || 0;
    const status = rows[i][12]; // M: Status
    const paymentDate = rows[i][2]; // C: Tanggal_Bayar (tanggal pada struk/bukti)
    const created = rows[i][13]; // N: Created

    // Total amount dan lastPaymentDate hanya dari transaksi Verified
    if (status === "Verified") {
      totalAmount += amount;

      // Gunakan Tanggal_Bayar (bukan Created) untuk konfirmasi terakhir
      if (paymentDate) {
        const payDate = new Date(paymentDate);
        if (!isNaN(payDate.getTime())) {
          if (!lastPaymentDate || payDate > lastPaymentDate) {
            lastPaymentDate = payDate;
          }
        }
      }
    }

    if (status === "Pending") {
      pendingCount++;
    }

    activities.push({
      id: rows[i][0],
      title: rows[i][11] || "Pembayaran", // L: Keterangan
      status: status,
      date: paymentDate || created, // Prioritaskan Tanggal_Bayar
      bank: rows[i][7] || rows[i][4] || "-", // Bank Pengirim atau Penerima
      amount: amount,
      jenis_bukti: rows[i][9], // J: Jenis_Bukti
    });
  }

  // Sort activities by date descending and take top 5
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentActivities = activities.slice(0, 5);

  return jsonResponse({
    success: true,
    data: {
      totalAmount: totalAmount,
      pendingCount: pendingCount,
      lastConfirmationDate: lastPaymentDate, // Tanggal bayar terakhir dari transaksi Verified
      recentActivities: recentActivities,
    },
  });
}

function handleUpdateStatus(data) {
  const { confirmationId, status, verifiedBy } = data;

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === confirmationId) {
      sheet.getRange(i + 1, 12).setValue(status); // Status
      sheet.getRange(i + 1, 14).setValue(verifiedBy || "-"); // Verified_By
      sheet.getRange(i + 1, 15).setValue(new Date()); // Verified_At

      logActivity(
        "UPDATE_STATUS",
        verifiedBy,
        `Status updated: ${confirmationId} -> ${status}`
      );

      return jsonResponse({
        success: true,
        message: "Status berhasil diupdate",
      });
    }
  }

  return jsonResponse({ success: false, error: "Konfirmasi tidak ditemukan" });
}

// ============================================
// LEMBAGA HANDLERS
// ============================================

function handleGetLembaga() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Lembaga");
  const rows = sheet.getDataRange().getValues();

  const lembaga = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][5] === "active") {
      lembaga.push({
        id: rows[i][0],
        nama: rows[i][1],
        kategori: rows[i][2],
        alamat: rows[i][3],
        kontak: rows[i][4],
      });
    }
  }

  return jsonResponse({ success: true, data: lembaga });
}

// ============================================
// SANTRI HANDLERS
// ============================================

/**
 * Get santri linked to a user (via User_Santri junction)
 */
function handleGetSantri(data) {
  const user_id = data.user_id ? String(data.user_id).trim() : null;

  if (!user_id) {
    return jsonResponse({ success: false, error: "User ID wajib diisi" });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSantriSheet = ss.getSheetByName("User_Santri");
  const santriSheet = ss.getSheetByName("santri");

  if (!userSantriSheet || !santriSheet) {
    return jsonResponse({ success: true, data: [] });
  }

  // Get linked NIS for this user
  const userSantriData = userSantriSheet.getDataRange().getValues();
  const linkedNIS = [];
  for (let i = 1; i < userSantriData.length; i++) {
    const rowUserId = String(userSantriData[i][1]).trim();
    if (rowUserId === user_id) {
      linkedNIS.push(String(userSantriData[i][2]).trim());
    }
  }

  if (linkedNIS.length === 0) {
    return jsonResponse({ success: true, data: [] });
  }

  // Get santri details from master table
  const santriData = santriSheet.getDataRange().getValues();
  const santriList = [];

  for (let i = 1; i < santriData.length; i++) {
    const nis = String(santriData[i][0]).trim();
    if (linkedNIS.includes(nis)) {
      santriList.push({
        nis: santriData[i][0],
        nama: santriData[i][1],
        kode: santriData[i][2],
        sekolah: santriData[i][3],
      });
    }
  }

  return jsonResponse({ success: true, data: santriList });
}

/**
 * Search santri by NIS or name (for linking)
 */
function handleSearchSantri(data) {
  const query = data.query ? String(data.query).trim().toLowerCase() : "";

  if (!query || query.length < 3) {
    return jsonResponse({
      success: false,
      error: "Minimal 3 karakter untuk pencarian",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("santri");
  if (!sheet) {
    return jsonResponse({ success: true, data: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < rows.length && results.length < 10; i++) {
    const nis = String(rows[i][0]).trim();
    const nama = String(rows[i][1]).trim().toLowerCase();

    if (nis.includes(query) || nama.includes(query)) {
      results.push({
        nis: rows[i][0],
        nama: rows[i][1],
        kode: rows[i][2],
        sekolah: rows[i][3],
      });
    }
  }

  return jsonResponse({ success: true, data: results });
}

/**
 * Link santri to user (add to User_Santri)
 */
function handleAddSantri(data) {
  const user_id = data.user_id ? String(data.user_id).trim() : null;
  const nis = data.nis ? String(data.nis).trim() : null;

  if (!user_id || !nis) {
    return jsonResponse({
      success: false,
      error: "User ID dan NIS wajib diisi",
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Verify santri exists in master table
  const santriSheet = ss.getSheetByName("santri");
  if (!santriSheet) {
    return jsonResponse({
      success: false,
      error: "Tabel santri tidak ditemukan",
    });
  }

  const santriData = santriSheet.getDataRange().getValues();
  let santriInfo = null;

  for (let i = 1; i < santriData.length; i++) {
    const rowNIS = String(santriData[i][0]).trim();
    if (rowNIS === nis) {
      santriInfo = {
        nis: santriData[i][0],
        nama: santriData[i][1],
        kode: santriData[i][2],
        sekolah: santriData[i][3],
      };
      break;
    }
  }

  if (!santriInfo) {
    return jsonResponse({
      success: false,
      error: "NIS tidak ditemukan di database master",
    });
  }

  // Check if already linked
  let userSantriSheet = ss.getSheetByName("User_Santri");
  if (!userSantriSheet) {
    userSantriSheet = ss.insertSheet("User_Santri");
    userSantriSheet.appendRow(["ID", "User_ID", "NIS", "Created"]);
  }

  const existingLinks = userSantriSheet.getDataRange().getValues();
  for (let i = 1; i < existingLinks.length; i++) {
    const rowUserId = String(existingLinks[i][1]).trim();
    const rowNIS = String(existingLinks[i][2]).trim();
    if (rowUserId === user_id && rowNIS === nis) {
      return jsonResponse({
        success: false,
        error: "Santri sudah ada dalam daftar Anda",
      });
    }
  }

  // Add link
  const linkId = "LNK-" + Date.now().toString(36).toUpperCase();
  userSantriSheet.appendRow([linkId, user_id, nis, new Date()]);

  logActivity(
    "LINK_SANTRI",
    user_id,
    `Linked santri: ${santriInfo.nama} (${nis})`
  );

  return jsonResponse({
    success: true,
    message: "Santri berhasil ditambahkan ke daftar Anda",
    santri: santriInfo,
  });
}

/**
 * Update santri - not applicable for existing master data
 */
function handleUpdateSantri(data) {
  return jsonResponse({
    success: false,
    error: "Data santri master tidak dapat diubah",
  });
}

/**
 * Unlink santri from user (remove from User_Santri)
 */
function handleDeleteSantri(data) {
  const user_id = data.user_id ? String(data.user_id).trim() : null;
  const nis = data.nis ? String(data.nis).trim() : null;

  if (!user_id || !nis) {
    return jsonResponse({
      success: false,
      error: "User ID dan NIS wajib diisi",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("User_Santri");
  if (!sheet) {
    return jsonResponse({
      success: false,
      error: "Data penautan tidak ditemukan",
    });
  }

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const rowUserId = String(rows[i][1]).trim();
    const rowNIS = String(rows[i][2]).trim();

    if (rowUserId === user_id && rowNIS === nis) {
      sheet.deleteRow(i + 1);
      logActivity("UNLINK_SANTRI", user_id, `Unlinked santri: ${nis}`);
      return jsonResponse({
        success: true,
        message: "Santri berhasil dihapus dari daftar Anda",
      });
    }
  }

  return jsonResponse({
    success: false,
    error: "Data penautan tidak ditemukan",
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSecretKey() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  const data = sheet.getDataRange().getValues();
  for (const row of data) {
    if (row[0] === "secret_key") return row[1];
  }
  return "DEFAULT_SECRET_KEY_CHANGE_ME";
}

function hashPassword(password) {
  const secret = getSecretKey();
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + secret,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(hash);
}

function verifyPassword(input, stored) {
  return hashPassword(input) === stored;
}

function generateToken(userId, email) {
  const secret = getSecretKey();
  const payload = { userId, email, exp: Date.now() + 6 * 60 * 60 * 1000 }; // 6 jam session timeout
  const encoded = Utilities.base64Encode(JSON.stringify(payload));
  const sig = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, encoded + secret)
  );
  return encoded + "." + sig;
}

function decodeToken(token) {
  try {
    const [encoded, sig] = token.split(".");
    const secret = getSecretKey();
    const expectedSig = Utilities.base64Encode(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        encoded + secret
      )
    );
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(
      Utilities.newBlob(Utilities.base64Decode(encoded)).getDataAsString()
    );
    if (payload.exp < Date.now()) return { ...payload, expired: true };
    return payload;
  } catch (e) {
    return null;
  }
}

// ============================================
// ADMIN MANAGEMENT FUNCTIONS
// ============================================

/**
 * Prompt untuk membuat admin baru melalui menu Google Sheets
 */
function createAdminPrompt() {
  const ui = SpreadsheetApp.getUi();

  // Input nama
  const namaResponse = ui.prompt(
    "👑 Buat Admin Baru",
    "Masukkan nama lengkap admin:",
    ui.ButtonSet.OK_CANCEL
  );
  if (namaResponse.getSelectedButton() !== ui.Button.OK) return;
  const nama = namaResponse.getResponseText().trim();
  if (!nama) {
    ui.alert("❌ Error", "Nama tidak boleh kosong", ui.ButtonSet.OK);
    return;
  }

  // Input email
  const emailResponse = ui.prompt(
    "👑 Buat Admin Baru",
    "Masukkan email admin:",
    ui.ButtonSet.OK_CANCEL
  );
  if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
  const email = emailResponse.getResponseText().trim().toLowerCase();
  if (!email || !email.includes("@")) {
    ui.alert("❌ Error", "Email tidak valid", ui.ButtonSet.OK);
    return;
  }

  // Input password
  const passwordResponse = ui.prompt(
    "👑 Buat Admin Baru",
    "Masukkan password (min 6 karakter):",
    ui.ButtonSet.OK_CANCEL
  );
  if (passwordResponse.getSelectedButton() !== ui.Button.OK) return;
  const password = passwordResponse.getResponseText();
  if (!password || password.length < 6) {
    ui.alert("❌ Error", "Password minimal 6 karakter", ui.ButtonSet.OK);
    return;
  }

  // Buat admin
  const result = createAdmin(nama, email, password);

  if (result.success) {
    ui.alert(
      "✅ Admin Berhasil Dibuat",
      `Nama: ${nama}\nEmail: ${email}\nID: ${result.userId}\n\nAdmin dapat login di aplikasi.`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert("❌ Gagal", result.error, ui.ButtonSet.OK);
  }
}

/**
 * Fungsi untuk membuat admin baru
 */
function createAdmin(nama, email, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  // Cek email sudah terdaftar
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      return { success: false, error: "Email sudah terdaftar" };
    }
  }

  const userId = "ADM-" + Date.now().toString(36).toUpperCase();
  const hashedPassword = hashPassword(password);

  sheet.appendRow([
    userId,
    nama,
    email.toLowerCase(),
    hashedPassword,
    "-",
    "Admin",
    "admin", // Role = admin
    new Date(),
    "active",
    "", // Photo_URL (empty by default)
  ]);

  logActivity("CREATE_ADMIN", "SYSTEM", `New admin created: ${email}`);

  return { success: true, userId: userId };
}

/**
 * Tampilkan daftar admin
 */
function showAdminList() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  const admins = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === "admin") {
      // Kolom Role
      admins.push(`• ${data[i][1]} (${data[i][2]})`);
    }
  }

  if (admins.length === 0) {
    ui.alert(
      "👑 Daftar Admin",
      'Belum ada admin terdaftar.\n\nGunakan menu "Buat Admin Baru" untuk menambahkan.',
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      "👑 Daftar Admin",
      `Total: ${admins.length} admin\n\n${admins.join("\n")}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Prompt untuk reset password user
 */
function resetUserPasswordPrompt() {
  const ui = SpreadsheetApp.getUi();

  // Input email
  const emailResponse = ui.prompt(
    "🔄 Reset Password User",
    "Masukkan email user yang akan direset:",
    ui.ButtonSet.OK_CANCEL
  );
  if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
  const email = emailResponse.getResponseText().trim().toLowerCase();

  // Input password baru
  const passwordResponse = ui.prompt(
    "🔄 Reset Password User",
    "Masukkan password baru (min 6 karakter):",
    ui.ButtonSet.OK_CANCEL
  );
  if (passwordResponse.getSelectedButton() !== ui.Button.OK) return;
  const newPassword = passwordResponse.getResponseText();

  if (!newPassword || newPassword.length < 6) {
    ui.alert("❌ Error", "Password minimal 6 karakter", ui.ButtonSet.OK);
    return;
  }

  const result = resetUserPassword(email, newPassword);

  if (result.success) {
    ui.alert(
      "✅ Berhasil",
      `Password untuk ${email} berhasil direset.`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert("❌ Gagal", result.error, ui.ButtonSet.OK);
  }
}

/**
 * Fungsi untuk reset password user
 */
function resetUserPassword(email, newPassword) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      const hashedPassword = hashPassword(newPassword);
      sheet.getRange(i + 1, 4).setValue(hashedPassword); // Kolom Password

      logActivity("RESET_PASSWORD", "SYSTEM", `Password reset for: ${email}`);

      return { success: true };
    }
  }

  return { success: false, error: "Email tidak ditemukan" };
}

/**
 * Ubah role user (untuk API)
 */
function handleChangeUserRole(data) {
  const { token, targetUserId, newRole } = data;

  // Verifikasi token dan cek apakah requester adalah admin
  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  // Cek apakah requester adalah admin
  let isAdmin = false;
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === decoded.userId && users[i][6] === "admin") {
      isAdmin = true;
      break;
    }
  }

  if (!isAdmin) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya admin yang dapat mengubah role.",
    });
  }

  // Update role target user
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === targetUserId) {
      sheet.getRange(i + 1, 7).setValue(newRole); // Kolom Role

      logActivity(
        "CHANGE_ROLE",
        decoded.userId,
        `Role changed: ${targetUserId} -> ${newRole}`
      );

      return jsonResponse({ success: true, message: "Role berhasil diubah" });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

/**
 * Dapatkan semua user (khusus admin)
 */
function handleGetAllUsers(data) {
  const { token } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  // Cek apakah requester adalah admin
  let isAdmin = false;
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === decoded.userId && users[i][6] === "admin") {
      isAdmin = true;
      break;
    }
  }

  if (!isAdmin) {
    return jsonResponse({ success: false, error: "Akses ditolak" });
  }

  const userList = [];
  for (let i = 1; i < users.length; i++) {
    userList.push({
      id: users[i][0],
      nama: users[i][1],
      email: users[i][2],
      phone: users[i][4],
      lembaga: users[i][5],
      role: users[i][6],
      created: users[i][7],
      status: users[i][8],
      is_verified: users[i][10] ? true : false, // Kolom 11 (index 10) = Is_Verified
    });
  }

  return jsonResponse({ success: true, data: userList });
}

// ============================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================
// super_admin > admin > user
//
// super_admin: Semua akses (hapus data, kelola admin, verifikasi)
// admin: Lihat semua data + verifikasi konfirmasi
// user: Submit konfirmasi + lihat data sendiri

const ROLE_HIERARCHY = {
  super_admin: 3,
  admin: 2,
  user: 1,
};

/**
 * Cek apakah role memiliki permission tertentu
 */
function hasPermission(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

// ============================================
// MANUAL EMAIL VERIFICATION (Super Admin Only)
// ============================================

/**
 * Handler untuk verifikasi email manual oleh Super Admin
 * Digunakan ketika user tidak bisa menerima email verifikasi
 */
function handleManualVerifyEmail(data) {
  const { token, user_id } = data;

  // Validasi parameter
  if (!token || !user_id) {
    return jsonResponse({
      success: false,
      error: "Token dan User ID wajib diisi",
    });
  }

  // Decode dan validasi token
  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  // Cari requester dan validasi role
  let requesterRole = null;
  let requesterName = "";
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === decoded.userId) {
      requesterRole = users[i][6];
      requesterName = users[i][1];
      break;
    }
  }

  // Hanya super_admin yang boleh verifikasi manual
  if (requesterRole !== "super_admin") {
    return jsonResponse({
      success: false,
      error: "Hanya Super Admin yang dapat melakukan verifikasi email manual",
    });
  }

  // Cari target user dan update is_verified
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === user_id) {
      // Cek apakah sudah terverifikasi
      if (users[i][10]) {
        return jsonResponse({
          success: false,
          error: "Email user sudah terverifikasi",
        });
      }

      // Update Is_Verified menjadi 1 (kolom 11, index ke-11 di sheet = setColumnIndex 11)
      sheet.getRange(i + 1, 11).setValue(1);

      // Log aktivitas
      logActivity(
        "MANUAL_EMAIL_VERIFY",
        decoded.userId,
        `Super Admin "${requesterName}" verified email for user: ${users[i][2]} (${user_id})`
      );

      return jsonResponse({
        success: true,
        message: `Email ${users[i][2]} berhasil diverifikasi`,
      });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

/**
 * Handler untuk kirim ulang email verifikasi
 * Super Admin dapat mengirim ulang email verifikasi ke user yang belum terverifikasi
 */
function handleResendVerificationEmail(data) {
  const { token, user_id } = data;

  // Validasi parameter
  if (!token || !user_id) {
    return jsonResponse({
      success: false,
      error: "Token dan User ID wajib diisi",
    });
  }

  // Decode dan validasi token
  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  // Cari requester dan validasi role (hanya super_admin)
  let requesterRole = null;
  let requesterName = "";
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === decoded.userId) {
      requesterRole = users[i][6];
      requesterName = users[i][1];
      break;
    }
  }

  if (requesterRole !== "super_admin") {
    return jsonResponse({
      success: false,
      error: "Hanya Super Admin yang dapat mengirim ulang email verifikasi",
    });
  }

  // Cari target user
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === user_id) {
      // Cek apakah sudah terverifikasi
      if (users[i][10]) {
        return jsonResponse({
          success: false,
          error: "Email user sudah terverifikasi",
        });
      }

      // Generate verification token baru
      const verificationToken =
        "V-" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Update verification token di sheet (kolom 12, index 11)
      sheet.getRange(i + 1, 12).setValue(verificationToken);

      // Log aktivitas
      logActivity(
        "RESEND_VERIFICATION_EMAIL",
        decoded.userId,
        `Super Admin "${requesterName}" requested resend verification email for: ${users[i][2]} (${user_id})`
      );

      // Return data untuk Cloudflare Worker mengirim email
      return jsonResponse({
        success: true,
        message: "Token verifikasi berhasil dibuat",
        user: {
          id: users[i][0],
          nama: users[i][1],
          email: users[i][2],
        },
        verification_token: verificationToken,
      });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

// ============================================
// SUPER ADMIN FUNCTIONS
// ============================================

/**
 * Prompt untuk membuat Super Admin
 */
function createSuperAdminPrompt() {
  const ui = SpreadsheetApp.getUi();

  // Input nama
  const namaResponse = ui.prompt(
    "👑 Buat Super Admin",
    "Masukkan nama lengkap:",
    ui.ButtonSet.OK_CANCEL
  );
  if (namaResponse.getSelectedButton() !== ui.Button.OK) return;
  const nama = namaResponse.getResponseText().trim();
  if (!nama) {
    ui.alert("❌ Error", "Nama tidak boleh kosong", ui.ButtonSet.OK);
    return;
  }

  // Input email
  const emailResponse = ui.prompt(
    "👑 Buat Super Admin",
    "Masukkan email:",
    ui.ButtonSet.OK_CANCEL
  );
  if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
  const email = emailResponse.getResponseText().trim().toLowerCase();
  if (!email || !email.includes("@")) {
    ui.alert("❌ Error", "Email tidak valid", ui.ButtonSet.OK);
    return;
  }

  // Input password
  const passwordResponse = ui.prompt(
    "👑 Buat Super Admin",
    "Masukkan password (min 6 karakter):",
    ui.ButtonSet.OK_CANCEL
  );
  if (passwordResponse.getSelectedButton() !== ui.Button.OK) return;
  const password = passwordResponse.getResponseText();
  if (!password || password.length < 6) {
    ui.alert("❌ Error", "Password minimal 6 karakter", ui.ButtonSet.OK);
    return;
  }

  // Buat super admin
  const result = createUserWithRole(nama, email, password, "super_admin");

  if (result.success) {
    ui.alert(
      "✅ Super Admin Berhasil Dibuat",
      `Nama: ${nama}\nEmail: ${email}\nID: ${result.userId}\nRole: SUPER ADMIN\n\nAkun dapat login di aplikasi dengan akses penuh.`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert("❌ Gagal", result.error, ui.ButtonSet.OK);
  }
}

/**
 * Fungsi universal untuk membuat user dengan role tertentu
 */
function createUserWithRole(nama, email, password, role) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  // Cek email sudah terdaftar
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      return { success: false, error: "Email sudah terdaftar" };
    }
  }

  // Generate ID berdasarkan role
  let prefix = "USR";
  if (role === "super_admin") prefix = "SPA";
  else if (role === "admin") prefix = "ADM";

  const userId = prefix + "-" + Date.now().toString(36).toUpperCase();
  const hashedPassword = hashPassword(password);

  sheet.appendRow([
    userId,
    nama,
    email.toLowerCase(),
    hashedPassword,
    "-",
    role === "user" ? "-" : "Administrator",
    role,
    new Date(),
    "active",
  ]);

  logActivity("CREATE_USER", "SYSTEM", `New ${role} created: ${email}`);

  return { success: true, userId: userId };
}

/**
 * Update createAdmin untuk menggunakan fungsi universal
 */
function createAdmin(nama, email, password) {
  return createUserWithRole(nama, email, password, "admin");
}

/**
 * Tampilkan semua user dengan role-nya
 */
function showAllRoles() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  const superAdmins = [];
  const admins = [];
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const entry = `${data[i][1]} (${data[i][2]})`;
    switch (data[i][6]) {
      case "super_admin":
        superAdmins.push(entry);
        break;
      case "admin":
        admins.push(entry);
        break;
      default:
        users.push(entry);
    }
  }

  let message = "👑 SUPER ADMIN:\n";
  message +=
    superAdmins.length > 0
      ? superAdmins.map((u) => "  • " + u).join("\n")
      : "  (tidak ada)";
  message += "\n\n🛡️ ADMIN:\n";
  message +=
    admins.length > 0
      ? admins.map((u) => "  • " + u).join("\n")
      : "  (tidak ada)";
  message += "\n\n👤 USER:\n";
  message +=
    users.length > 0 ? `  Total: ${users.length} user` : "  (tidak ada)";

  ui.alert("📋 Daftar Role", message, ui.ButtonSet.OK);
}

/**
 * Prompt untuk hapus user (Super Admin only)
 */
function deleteUserPrompt() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    "🗑️ Hapus User",
    "PERHATIAN: Tindakan ini permanen!\n\nMasukkan email user yang akan dihapus:",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;
  const email = response.getResponseText().trim().toLowerCase();

  if (!email) {
    ui.alert("❌ Error", "Email tidak boleh kosong", ui.ButtonSet.OK);
    return;
  }

  // Konfirmasi ulang
  const confirm = ui.alert(
    "⚠️ Konfirmasi Hapus",
    `Yakin ingin menghapus user dengan email:\n${email}\n\nTindakan ini TIDAK DAPAT DIBATALKAN!`,
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  const result = deleteUser(email);

  if (result.success) {
    ui.alert("✅ Berhasil", `User ${email} berhasil dihapus.`, ui.ButtonSet.OK);
  } else {
    ui.alert("❌ Gagal", result.error, ui.ButtonSet.OK);
  }
}

/**
 * Fungsi untuk hapus user
 */
function deleteUser(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      // Jangan izinkan hapus super_admin terakhir
      if (data[i][6] === "super_admin") {
        let superAdminCount = 0;
        for (let j = 1; j < data.length; j++) {
          if (data[j][6] === "super_admin") superAdminCount++;
        }
        if (superAdminCount <= 1) {
          return {
            success: false,
            error: "Tidak dapat menghapus super admin terakhir!",
          };
        }
      }

      sheet.deleteRow(i + 1);
      logActivity("DELETE_USER", "SYSTEM", `User deleted: ${email}`);
      return { success: true };
    }
  }

  return { success: false, error: "Email tidak ditemukan" };
}

/**
 * Prompt untuk ubah role user
 */
function changeUserRolePrompt() {
  const ui = SpreadsheetApp.getUi();

  // Input email
  const emailResponse = ui.prompt(
    "🔀 Ubah Role User",
    "Masukkan email user:",
    ui.ButtonSet.OK_CANCEL
  );
  if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
  const email = emailResponse.getResponseText().trim().toLowerCase();

  // Input role baru
  const roleResponse = ui.prompt(
    "🔀 Ubah Role User",
    "Masukkan role baru:\n• super_admin\n• admin\n• user",
    ui.ButtonSet.OK_CANCEL
  );
  if (roleResponse.getSelectedButton() !== ui.Button.OK) return;
  const newRole = roleResponse.getResponseText().trim().toLowerCase();

  if (!["super_admin", "admin", "user"].includes(newRole)) {
    ui.alert(
      "❌ Error",
      "Role tidak valid. Pilih: super_admin, admin, atau user",
      ui.ButtonSet.OK
    );
    return;
  }

  const result = changeUserRole(email, newRole);

  if (result.success) {
    ui.alert(
      "✅ Berhasil",
      `Role ${email} berhasil diubah menjadi: ${newRole}`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert("❌ Gagal", result.error, ui.ButtonSet.OK);
  }
}

/**
 * Fungsi untuk ubah role user
 */
function changeUserRole(email, newRole) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
      const oldRole = data[i][6];

      // Jangan izinkan downgrade super_admin terakhir
      if (oldRole === "super_admin" && newRole !== "super_admin") {
        let superAdminCount = 0;
        for (let j = 1; j < data.length; j++) {
          if (data[j][6] === "super_admin") superAdminCount++;
        }
        if (superAdminCount <= 1) {
          return {
            success: false,
            error: "Tidak dapat mengubah role super admin terakhir!",
          };
        }
      }

      sheet.getRange(i + 1, 7).setValue(newRole); // Kolom Role
      logActivity(
        "CHANGE_ROLE",
        "SYSTEM",
        `Role changed: ${email} (${oldRole} -> ${newRole})`
      );

      return { success: true };
    }
  }

  return { success: false, error: "Email tidak ditemukan" };
}

// ============================================
// API HANDLERS WITH ROLE-BASED ACCESS
// ============================================

/**
 * Handler untuk verifikasi konfirmasi (Admin & Super Admin)
 */
function handleVerifyConfirmation(data) {
  // Accept both confirmationId (camelCase) and confirmation_id (snake_case)
  const { token, confirmationId, confirmation_id, status, verified_by } = data;
  const confId = confirmationId || confirmation_id;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - minimal admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya admin yang dapat memverifikasi.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === confId) {
      // Update status (column 13 = index 12)
      sheet.getRange(i + 1, 13).setValue(status);
      // Update verified_by (column 15 = index 14) - use provided name or userId
      sheet.getRange(i + 1, 15).setValue(verified_by || decoded.userId);
      // Update verified_at (column 16 = index 15)
      sheet.getRange(i + 1, 16).setValue(new Date());

      logActivity(
        status === "Verified" ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
        decoded.userId,
        `${confId} -> ${status}`
      );

      return jsonResponse({
        success: true,
        message: "Status berhasil diupdate",
      });
    }
  }

  return jsonResponse({ success: false, error: "Konfirmasi tidak ditemukan" });
}

/**
 * Handler untuk hapus konfirmasi (Super Admin only)
 */
function handleDeleteConfirmation(data) {
  const { token, confirmationId } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya super admin yang dapat menghapus data.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === confirmationId) {
      sheet.deleteRow(i + 1);
      logActivity(
        "DELETE_CONFIRMATION",
        decoded.userId,
        `Deleted: ${confirmationId}`
      );
      return jsonResponse({
        success: true,
        message: "Konfirmasi berhasil dihapus",
      });
    }
  }

  return jsonResponse({ success: false, error: "Konfirmasi tidak ditemukan" });
}

/**
 * Helper: Dapatkan role user berdasarkan ID
 */
function getUserRole(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return data[i][6] || "user";
    }
  }

  return "user";
}

/**
 * Helper: Cek permission berdasarkan role
 * @param {string} userRole - Role user saat ini
 * @param {string} requiredRole - Role minimum yang diperlukan
 */
function hasPermission(userRole, requiredRole) {
  const roleHierarchy = {
    user: 0,
    admin: 1,
    super_admin: 2,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// ============================================
// ADMIN DASHBOARD API HANDLERS
// ============================================

/**
 * Handler untuk get pending confirmations (Admin & Super Admin)
 */
function handleGetPendingConfirmations(data) {
  const { token } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - minimal admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya admin yang dapat mengakses.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({
      success: true,
      data: [],
      stats: {
        pending: 0,
        verified: 0,
        rejected: 0,
        totalRevenue: 0,
        todayCount: 0,
      },
    });
  }

  const rows = sheet.getDataRange().getValues();
  const confirmations = [];
  let pendingCount = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;
  let totalRevenue = 0;
  let todayCount = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < rows.length; i++) {
    const status = rows[i][12] || "Pending";
    const nominal = parseFloat(String(rows[i][6]).replace(/\D/g, "")) || 0;
    const created = new Date(rows[i][13]);

    if (status === "Pending") pendingCount++;
    if (status === "Verified") {
      verifiedCount++;
      totalRevenue += nominal;
    }
    if (status === "Rejected") rejectedCount++;

    // Count today's submissions
    if (created >= today) todayCount++;

    // Only return pending confirmations
    if (status === "Pending") {
      confirmations.push({
        id: rows[i][0],
        user_id: rows[i][1],
        tanggal_bayar: rows[i][2],
        metode: rows[i][3],
        bank_penerima: rows[i][4],
        nama_penerima: rows[i][5],
        nominal: rows[i][6],
        bank_pengirim: rows[i][7],
        nama_pengirim: rows[i][8],
        jenis_bukti: rows[i][9],
        bukti_url: rows[i][10],
        keterangan: rows[i][11],
        status: status,
        created: rows[i][13],
        verified_by: rows[i][14],
        verified_at: rows[i][15],
        santri_id: rows[i][16],
        santri_nama: rows[i][17],
      });
    }
  }

  return jsonResponse({
    success: true,
    data: confirmations,
    stats: {
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      totalRevenue: totalRevenue,
      todayCount: todayCount,
    },
  });
}

/**
 * Handler untuk get all confirmations dengan filter status (Admin & Super Admin)
 * Param: status = 'all' | 'Pending' | 'Verified' | 'Rejected'
 */
function handleGetAllConfirmations(data) {
  const { token, status } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - minimal admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya admin yang dapat mengakses.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Confirmations");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({
      success: true,
      data: [],
      stats: {
        pending: 0,
        verified: 0,
        rejected: 0,
        totalRevenue: 0,
        todayCount: 0,
      },
    });
  }

  const rows = sheet.getDataRange().getValues();
  const confirmations = [];
  let pendingCount = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;
  let totalRevenue = 0;
  let todayCount = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter status: 'all', 'Pending', 'Verified', 'Rejected'
  const filterStatus = status || "all";

  for (let i = 1; i < rows.length; i++) {
    const rowStatus = rows[i][12] || "Pending";
    const nominal = parseFloat(String(rows[i][6]).replace(/\D/g, "")) || 0;
    const created = new Date(rows[i][13]);

    if (rowStatus === "Pending") pendingCount++;
    if (rowStatus === "Verified") {
      verifiedCount++;
      totalRevenue += nominal;
    }
    if (rowStatus === "Rejected") rejectedCount++;

    // Count today's submissions
    if (created >= today) todayCount++;

    // Apply filter
    if (filterStatus === "all" || rowStatus === filterStatus) {
      confirmations.push({
        id: rows[i][0],
        user_id: rows[i][1],
        tanggal_bayar: rows[i][2],
        metode: rows[i][3],
        bank_penerima: rows[i][4],
        nama_penerima: rows[i][5],
        nominal: rows[i][6],
        bank_pengirim: rows[i][7],
        nama_pengirim: rows[i][8],
        jenis_bukti: rows[i][9],
        bukti_url: rows[i][10],
        keterangan: rows[i][11],
        status: rowStatus,
        created: rows[i][13],
        verified_by: rows[i][14],
        verified_at: rows[i][15],
        santri_id: rows[i][16],
        santri_nama: rows[i][17],
      });
    }
  }

  // Sort by created date (newest first)
  confirmations.sort((a, b) => new Date(b.created) - new Date(a.created));

  return jsonResponse({
    success: true,
    data: confirmations,
    stats: {
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      totalRevenue: totalRevenue,
      todayCount: todayCount,
    },
  });
}

/**
 * Handler untuk get all users (Admin & Super Admin)
 */
function handleGetAllUsers(data) {
  const { token } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - minimal admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak.",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ success: true, data: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < rows.length; i++) {
    users.push({
      id: rows[i][0],
      nama: rows[i][1],
      email: rows[i][2],
      phone: rows[i][4],
      lembaga: rows[i][5],
      role: rows[i][6] || "user",
      created: rows[i][7],
      status: rows[i][8] || "active",
    });
  }

  return jsonResponse({ success: true, data: users });
}

/**
 * Handler untuk change user role (Super Admin only)
 */
function handleChangeUserRole(data) {
  const { token, user_id, new_role } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya super admin yang dapat mengubah role.",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data_rows = sheet.getDataRange().getValues();

  for (let i = 1; i < data_rows.length; i++) {
    if (data_rows[i][0] === user_id) {
      const oldRole = data_rows[i][6];

      // Jangan izinkan downgrade super_admin terakhir
      if (oldRole === "super_admin" && new_role !== "super_admin") {
        let superAdminCount = 0;
        for (let j = 1; j < data_rows.length; j++) {
          if (data_rows[j][6] === "super_admin") superAdminCount++;
        }
        if (superAdminCount <= 1) {
          return jsonResponse({
            success: false,
            error: "Tidak dapat mengubah role super admin terakhir!",
          });
        }
      }

      sheet.getRange(i + 1, 7).setValue(new_role);
      logActivity(
        "CHANGE_ROLE",
        decoded.userId,
        `Role changed: ${data_rows[i][2]} (${oldRole} -> ${new_role})`
      );

      return jsonResponse({ success: true, message: "Role berhasil diubah" });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

/**
 * Handler untuk delete user (Super Admin only)
 */
function handleDeleteUser(data) {
  const { token, user_id } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya super admin yang dapat menghapus user.",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === user_id) {
      // Jangan hapus super_admin
      if (rows[i][6] === "super_admin") {
        return jsonResponse({
          success: false,
          error: "Tidak dapat menghapus super admin!",
        });
      }

      const email = rows[i][2];
      sheet.deleteRow(i + 1);
      logActivity("DELETE_USER", decoded.userId, `Deleted user: ${email}`);

      return jsonResponse({ success: true, message: "User berhasil dihapus" });
    }
  }

  return jsonResponse({ success: false, error: "User tidak ditemukan" });
}

/**
 * Handler untuk get settings (Super Admin only)
 */
function handleGetSettings(data) {
  const { token } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ success: true, data: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const settings = [];

  for (let i = 1; i < rows.length; i++) {
    settings.push({
      key: rows[i][0],
      value: rows[i][1],
      description: rows[i][2],
      updated_at: rows[i][3],
    });
  }

  return jsonResponse({ success: true, data: settings });
}

/**
 * Handler untuk get public settings (tanpa auth)
 * Hanya mengembalikan settings yang boleh diakses publik
 */
function handleGetPublicSettings() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ success: true, data: {} });
  }

  const rows = sheet.getDataRange().getValues();
  const publicSettings = {};

  // Daftar settings yang boleh diakses publik
  const allowedKeys = ["app_name", "app_version", "app_logo_url"];

  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    if (allowedKeys.includes(key)) {
      publicSettings[key] = rows[i][1];
    }
  }

  return jsonResponse({ success: true, data: publicSettings });
}

/**
 * Handler untuk update settings (Super Admin only)
 */
function handleUpdateSettings(data) {
  const { token, settings } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak.",
    });
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];

    // Skip protected fields
    if (key === "secret_key") continue;

    if (settings[key] !== undefined && settings[key] !== rows[i][1]) {
      sheet.getRange(i + 1, 2).setValue(settings[key]); // Value column
      sheet.getRange(i + 1, 4).setValue(new Date()); // Updated_At column
    }
  }

  logActivity("UPDATE_SETTINGS", decoded.userId, "Settings updated");

  return jsonResponse({
    success: true,
    message: "Pengaturan berhasil disimpan",
  });
}

/**
 * Handler untuk get logs (Admin & Super Admin)
 */
function handleGetLogs(data) {
  const { token, limit = 100 } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - minimal admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak.",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");

  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ success: true, data: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const logs = [];

  // Get latest logs first (reverse order)
  const startRow = Math.max(1, rows.length - limit);
  for (let i = rows.length - 1; i >= startRow; i--) {
    logs.push({
      timestamp: rows[i][0],
      action: rows[i][1],
      user_id: rows[i][2],
      details: rows[i][3],
      ip_address: rows[i][4],
      row_index: i + 1,
    });
  }

  return jsonResponse({ success: true, data: logs });
}

/**
 * Handler untuk delete log (Super Admin only)
 */
function handleDeleteLog(data) {
  const { token, row_index } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya super admin yang dapat menghapus log.",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");

  if (!sheet || row_index <= 1 || row_index > sheet.getLastRow()) {
    return jsonResponse({ success: false, error: "Log tidak ditemukan" });
  }

  sheet.deleteRow(row_index);
  logActivity("DELETE_LOG", decoded.userId, `Deleted log at row ${row_index}`);

  return jsonResponse({ success: true, message: "Log berhasil dihapus" });
}

/**
 * Handler untuk bulk delete logs (Super Admin only)
 */
function handleDeleteLogsBulk(data) {
  const { token, row_indices } = data;

  const decoded = decodeToken(token);
  if (!decoded || decoded.expired) {
    return jsonResponse({ success: false, error: "Token tidak valid" });
  }

  // Cek role - harus super_admin
  const userRole = getUserRole(decoded.userId);
  if (!hasPermission(userRole, "super_admin")) {
    return jsonResponse({
      success: false,
      error: "Akses ditolak. Hanya super admin yang dapat menghapus log.",
    });
  }

  if (!row_indices || !Array.isArray(row_indices) || row_indices.length === 0) {
    return jsonResponse({
      success: false,
      error: "Tidak ada log yang dipilih",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");
  if (!sheet) {
    return jsonResponse({
      success: false,
      error: "Sheet Logs tidak ditemukan",
    });
  }

  // Sort in descending order to delete from bottom to top (avoid index shifting)
  const sortedIndices = [...row_indices].sort((a, b) => b - a);

  let deletedCount = 0;
  const lastRow = sheet.getLastRow();

  for (const rowIndex of sortedIndices) {
    if (rowIndex > 1 && rowIndex <= lastRow) {
      sheet.deleteRow(rowIndex);
      deletedCount++;
    }
  }

  logActivity(
    "DELETE_LOGS_BULK",
    decoded.userId,
    `Deleted ${deletedCount} logs`
  );

  return jsonResponse({
    success: true,
    message: `${deletedCount} log berhasil dihapus`,
    deleted_count: deletedCount,
  });
}

// ============================================
// EMAIL VERIFICATION & PASSWORD RESET HANDLERS
// ============================================

/**
 * Handler untuk verifikasi email dengan token
 * Action: verify_email
 */
function handleVerifyEmailToken(data) {
  const token = data.token ? String(data.token).trim() : null;

  if (!token) {
    return jsonResponse({ success: false, error: "Token wajib diisi" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  // Debug logging
  Logger.log("=== VERIFY EMAIL TOKEN ===");
  Logger.log("Received token: " + token);
  Logger.log("Token length: " + token.length);

  for (let i = 1; i < users.length; i++) {
    // verification_token ada di kolom 12 (index 11)
    // is_verified ada di kolom 11 (index 10)
    const storedToken = users[i][11] ? String(users[i][11]).trim() : "";

    Logger.log(
      "Row " +
        (i + 1) +
        " - Stored token: '" +
        storedToken +
        "' (length: " +
        storedToken.length +
        ")"
    );

    if (storedToken && storedToken === token) {
      Logger.log("✅ Token MATCH found at row " + (i + 1));

      // Set is_verified = 1 dan hapus token
      sheet.getRange(i + 1, 11).setValue(1); // is_verified (kolom 11)
      sheet.getRange(i + 1, 12).setValue(""); // hapus verification_token (kolom 12)

      logActivity(
        "VERIFY_EMAIL",
        users[i][0],
        `Email verified: ${users[i][2]}`
      );

      return jsonResponse({
        success: true,
        message: "Email berhasil diverifikasi",
        user: {
          id: users[i][0],
          email: users[i][2],
          nama: users[i][1],
        },
      });
    }
  }

  Logger.log("❌ Token NOT FOUND in database");

  return jsonResponse({
    success: false,
    error: "Token tidak valid atau sudah digunakan",
  });
}

/**
 * Handler untuk set reset token (untuk forgot password)
 * Action: set_reset_token
 */
function handleSetResetToken(data) {
  const { email, reset_token, expiry } = data;

  if (!email || !reset_token) {
    return jsonResponse({
      success: false,
      error: "Email dan token wajib diisi",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][2] && users[i][2].toLowerCase() === email.toLowerCase()) {
      // Set reset_token dan expiry
      sheet.getRange(i + 1, 13).setValue(reset_token); // reset_token column
      sheet.getRange(i + 1, 14).setValue(expiry); // reset_token_expiry column

      logActivity(
        "FORGOT_PASSWORD",
        users[i][0],
        `Reset token set for: ${email}`
      );

      return jsonResponse({
        success: true,
        message: "Reset token berhasil disimpan",
        user: {
          id: users[i][0],
          name: users[i][1],
          email: users[i][2],
        },
      });
    }
  }

  // Jangan bocorkan info apakah email ada atau tidak
  return jsonResponse({ success: false });
}

/**
 * Handler untuk reset password dengan token
 * Action: reset_password
 */
function handleResetPasswordWithToken(data) {
  const { token, new_password } = data;

  if (!token || !new_password) {
    return jsonResponse({
      success: false,
      error: "Token dan password baru wajib diisi",
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const users = sheet.getDataRange().getValues();
  const now = Math.floor(Date.now() / 1000);

  for (let i = 1; i < users.length; i++) {
    // Cek reset_token (kolom 13, index 12)
    if (users[i][12] === token) {
      // Cek expiry (kolom 14, index 13)
      const expiry = users[i][13];
      if (expiry && expiry < now) {
        return jsonResponse({
          success: false,
          error: "Token sudah expired. Silakan request ulang.",
        });
      }

      // Update password (hash dengan SHA-256 seperti saat registrasi)
      const hashedPassword = hashPassword(new_password);
      sheet.getRange(i + 1, 4).setValue(hashedPassword);
      // Hapus reset token
      sheet.getRange(i + 1, 13).setValue("");
      sheet.getRange(i + 1, 14).setValue("");

      logActivity(
        "RESET_PASSWORD",
        users[i][0],
        `Password reset for: ${users[i][2]}`
      );

      return jsonResponse({
        success: true,
        message: "Password berhasil diubah",
      });
    }
  }

  return jsonResponse({ success: false, error: "Token tidak valid" });
}
