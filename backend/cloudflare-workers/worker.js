/**
 * ============================================
 * CLOUDFLARE WORKERS - AUTH & USER API
 * ============================================
 *
 * Tech Stack:
 * - Runtime: Cloudflare Workers (Module Syntax)
 * - Database: Google Sheets (via Google Apps Script API)
 * - Email: Brevo (REST API)
 * - Storage: Cloudflare R2
 * - Libraries: bcryptjs, @tsndr/cloudflare-worker-jwt
 *
 * Endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - GET  /auth/verify?token=xxx
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 * - GET  /user/me (Protected)
 * - PUT  /user/update (Protected)
 *
 * Note: Semua data disimpan di Google Sheets melalui Apps Script API
 */

import bcrypt from "bcryptjs";
import jwt from "@tsndr/cloudflare-worker-jwt";

// ============================================
// CONFIGURATION
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const JWT_SECRET = "laporsunsal-jwt-secret-key-2026"; // Override via env.JWT_SECRET
const JWT_EXPIRY = "7d";
const BCRYPT_ROUNDS = 10;

// Google Apps Script Web App URL (database backend)
const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbwhWbhAoz_ziCF1jQ--CAThZ8gedlZaJnDe-o3CRGDDCZMe1ENF4JPsGjqRfl4QfkZuog/exec";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate UUID v4 (reserved for future use)
 * @returns {string} UUID v4
 */
// eslint-disable-next-line no-unused-vars
function _generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate random token untuk verifikasi/reset
 */
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Create JSON response dengan CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle CORS preflight request
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Parse request body as JSON
 */
async function parseBody(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await request.json();
    }

    if (contentType.includes("multipart/form-data")) {
      return await request.formData();
    }

    // Try parsing as text/plain (for compatibility)
    const text = await request.text();
    if (text) {
      return JSON.parse(text);
    }

    return {};
  } catch {
    return {};
  }
}

/**
 * Hash password dengan bcrypt (dilakukan di worker untuk keamanan)
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password dengan bcrypt (reserved - password verified in GAS)
 */
// eslint-disable-next-line no-unused-vars
async function _verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token (reserved - token generated in GAS)
 */
// eslint-disable-next-line no-unused-vars
async function _generateJWT(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
async function verifyJWT(token, secret) {
  try {
    const isValid = await jwt.verify(token, secret);
    if (!isValid) return null;

    const { payload } = jwt.decode(token);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// ============================================
// GOOGLE SHEETS API (via Apps Script)
// ============================================

/**
 * Call Google Apps Script API
 * @param {Object} env - Environment bindings
 * @param {string} action - Action name
 * @param {Object} data - Data to send
 */
async function callGoogleSheetsAPI(env, action, data = {}) {
  const GAS_URL = env.GAS_URL || DEFAULT_GAS_URL;

  const payload = JSON.stringify({
    action,
    ...data,
  });

  console.log("=== GAS API CALL ===");
  console.log("Action:", action);
  console.log("URL:", GAS_URL);

  try {
    // Disable automatic redirect following to handle it manually
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: payload,
      redirect: "follow", // Let fetch handle redirects automatically
    });

    console.log("Response status:", response.status);
    console.log("Response redirected:", response.redirected);
    console.log("Final URL:", response.url);

    const text = await response.text();
    console.log("Response text (first 500 chars):", text.substring(0, 500));

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw response:", text.substring(0, 1000));
      return { success: false, error: "Invalid JSON response from GAS" };
    }
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return { success: false, error: "Database connection failed: " + error.message };
  }
}

// ============================================
// EMAIL SERVICE (BREVO)
// ============================================

/**
 * Kirim email via Brevo API
 */
async function sendEmail(env, to, subject, htmlContent) {
  const BREVO_API_KEY = env.BREVO_API_KEY;
  const SENDER_EMAIL = env.SENDER_EMAIL || "noreply@laporsunsal.com";
  const SENDER_NAME = env.SENDER_NAME || "LaporSunsal";

  console.log("=== SEND EMAIL DEBUG ===");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Sender Email:", SENDER_EMAIL);
  console.log("Sender Name:", SENDER_NAME);
  console.log("API Key exists:", !!BREVO_API_KEY);
  console.log("API Key length:", BREVO_API_KEY ? BREVO_API_KEY.length : 0);

  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY not configured - pastikan sudah menjalankan: wrangler secret put BREVO_API_KEY");
    return { success: false, error: "Email service not configured - BREVO_API_KEY missing" };
  }

  try {
    const emailPayload = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    };

    console.log("Email payload:", JSON.stringify(emailPayload, null, 2));

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseBody = await response.text();
    console.log("Brevo API response status:", response.status);
    console.log("Brevo API response body:", responseBody);

    if (!response.ok) {
      console.error("❌ Brevo API error:", response.status, responseBody);
      return { success: false, error: `Brevo error: ${responseBody}` };
    }

    console.log("✅ Email sent successfully to:", to);
    return { success: true, response: responseBody };
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Template email verifikasi
 */
function verificationEmailTemplate(name, verifyUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E88E5, #1565C0); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; background: #1E88E5; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">🎉 Selamat Datang!</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${name || "User"}</strong>,</p>
          <p>Terima kasih telah mendaftar di <strong>LaporSunsal</strong>. Silakan verifikasi email Anda:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" class="button">Verifikasi Email</a>
          </p>
          <p style="color: #888; font-size: 14px;">Atau salin URL: <a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
        <div class="footer">
          <p>© 2026 LaporSunsal - Yayasan Sunniyah Salafiyah</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template email reset password
 */
function resetPasswordEmailTemplate(name, resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF5350, #E53935); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; background: #EF5350; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">🔐 Reset Password</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${name || "User"}</strong>,</p>
          <p>Kami menerima permintaan reset password. Klik tombol di bawah:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p style="color: #888; font-size: 14px;">Link berlaku <strong>1 jam</strong>. Abaikan jika bukan Anda yang meminta.</p>
        </div>
        <div class="footer">
          <p>© 2026 LaporSunsal - Yayasan Sunniyah Salafiyah</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * Middleware untuk mengecek JWT token
 */
async function authMiddleware(request, env) {
  const token = extractBearerToken(request);

  if (!token) {
    return null;
  }

  const secret = env.JWT_SECRET || JWT_SECRET;
  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return null;
  }

  // Verifikasi user masih ada di database (via Apps Script)
  const result = await callGoogleSheetsAPI(env, "verify_token", { token });

  if (!result.success) {
    return null;
  }

  return result.user;
}

// ============================================
// AUTH HANDLERS
// ============================================

/**
 * POST /auth/register
 */
async function handleRegister(request, env) {
  const body = await parseBody(request);
  const { email, password, name, phone, lembaga } = body;

  // Validasi input
  if (!email || !password) {
    return jsonResponse(
      { success: false, error: "Email dan password wajib diisi" },
      400
    );
  }

  if (password.length < 6) {
    return jsonResponse(
      { success: false, error: "Password minimal 6 karakter" },
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return jsonResponse(
      { success: false, error: "Format email tidak valid" },
      400
    );
  }

  try {
    // Kirim plain password ke GAS - GAS akan hash dengan SHA-256
    // Ini agar konsisten dengan verifikasi login dan reset password

    // Register via Google Apps Script
    const result = await callGoogleSheetsAPI(env, "register", {
      email: email.toLowerCase(),
      password: password, // Plain password, GAS akan hash dengan SHA-256
      nama: name || body.nama || "",
      phone: phone || "",
      lembaga: lembaga || "",
    });

    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Registrasi gagal" },
        400
      );
    }

    // Kirim email verifikasi (optional - jika ada verification_token)
    console.log("=== REGISTRATION DEBUG ===");
    console.log("GAS Result:", JSON.stringify(result));
    console.log("Has verification_token:", !!result.verification_token);

    if (result.verification_token) {
      const baseUrl = env.APP_URL || "https://laporsunsal.pages.dev";
      const verifyUrl = `${baseUrl}/auth/verify?token=${result.verification_token}`;
      console.log("Verify URL:", verifyUrl);
      console.log("Attempting to send email to:", email);

      const emailResult = await sendEmail(
        env,
        email,
        "Verifikasi Email - LaporSunsal",
        verificationEmailTemplate(name, verifyUrl)
      );

      console.log("Email send result:", JSON.stringify(emailResult));
    } else {
      console.log("⚠️ No verification_token received from GAS - email will NOT be sent");
    }

    return jsonResponse(
      {
        success: true,
        message: "Registrasi berhasil!",
        user: result.user,
        token: result.token,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

/**
 * POST /auth/login
 */
async function handleLogin(request, env) {
  const body = await parseBody(request);
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(
      { success: false, error: "Email dan password wajib diisi" },
      400
    );
  }

  try {
    // Login via Google Apps Script
    const result = await callGoogleSheetsAPI(env, "login", {
      email: email.toLowerCase(),
      password: password,
    });

    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Login gagal" },
        401
      );
    }

    return jsonResponse({
      success: true,
      message: "Login berhasil",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

/**
 * GET /auth/verify?token=xxx
 */
async function handleVerifyEmail(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return jsonResponse(
      { success: false, error: "Token tidak ditemukan" },
      400
    );
  }

  try {
    const result = await callGoogleSheetsAPI(env, "verify_email", { token });

    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Token tidak valid" },
        400
      );
    }

    return jsonResponse({
      success: true,
      message: "Email berhasil diverifikasi! Silakan login.",
    });
  } catch (error) {
    console.error("Verify error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

/**
 * POST /auth/forgot-password
 */
async function handleForgotPassword(request, env) {
  const body = await parseBody(request);
  const { email, source } = body; // source: 'dashboard' or 'user'

  console.log("=== FORGOT PASSWORD DEBUG ===");
  console.log("Email requested:", email);

  if (!email) {
    return jsonResponse({ success: false, error: "Email wajib diisi" }, 400);
  }

  try {
    // Generate reset token di worker
    const resetToken = generateToken();
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 jam

    console.log("Reset token generated:", resetToken.substring(0, 10) + "...");

    // Simpan ke database via Apps Script
    const result = await callGoogleSheetsAPI(env, "set_reset_token", {
      email: email.toLowerCase(),
      reset_token: resetToken,
      expiry: expiry,
    });

    console.log("GAS set_reset_token result:", JSON.stringify(result));
    console.log("result.success:", result.success);
    console.log("result.user exists:", !!result.user);

    // Selalu return success untuk keamanan
    if (result.success && result.user) {
      const baseUrl = env.APP_URL || "https://laporsunsal.pages.dev";
      // Use dashboard or auth reset-password based on source
      const resetPath = source === 'dashboard' ? '/dashboard/reset-password' : '/auth/reset-password';
      const resetUrl = `${baseUrl}${resetPath}?token=${resetToken}`;

      console.log("🔥 Attempting to send reset email to:", email);
      console.log("Reset URL:", resetUrl);

      const emailResult = await sendEmail(
        env,
        email,
        "Reset Password - LaporSunsal",
        resetPasswordEmailTemplate(result.user.name, resetUrl)
      );

      console.log("📧 Email send result:", JSON.stringify(emailResult));
    } else {
      console.log("⚠️ Email NOT sent because result.success=", result.success, "result.user=", result.user);
    }

    return jsonResponse({
      success: true,
      message: "Jika email terdaftar, link reset password akan dikirim.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

/**
 * POST /auth/reset-password
 */
async function handleResetPassword(request, env) {
  const body = await parseBody(request);
  const { token, new_password } = body;

  if (!token || !new_password) {
    return jsonResponse(
      { success: false, error: "Token dan password baru wajib diisi" },
      400
    );
  }

  if (new_password.length < 6) {
    return jsonResponse(
      { success: false, error: "Password minimal 6 karakter" },
      400
    );
  }

  try {
    // Kirim plain password ke GAS - GAS akan hash dengan SHA-256
    // (Sama seperti registrasi di GAS)
    const result = await callGoogleSheetsAPI(env, "reset_password", {
      token: token,
      new_password: new_password, // Plain password, GAS akan hash
    });

    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Token tidak valid" },
        400
      );
    }

    return jsonResponse({
      success: true,
      message: "Password berhasil diubah. Silakan login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

// ============================================
// USER HANDLERS (PROTECTED)
// ============================================

/**
 * GET /user/me
 */
async function handleGetMe(request, env) {
  const user = await authMiddleware(request, env);

  if (!user) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.nama || user.name,
      phone: user.phone,
      lembaga: user.lembaga,
      avatar_url: user.photo_url || user.avatar_url,
      role: user.role,
    },
  });
}

/**
 * PUT /user/update
 */
async function handleUpdateUser(request, env) {
  const user = await authMiddleware(request, env);

  if (!user) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let updateData = {};
    let avatarUrl = null;

    // Handle multipart form data (untuk upload file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      updateData.nama = formData.get("name") || formData.get("nama");
      updateData.phone = formData.get("phone");
      updateData.lembaga = formData.get("lembaga");

      const avatarFile = formData.get("avatar");

      // Upload avatar ke R2 jika ada
      if (avatarFile && avatarFile.size > 0 && env.R2_BUCKET) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!allowedTypes.includes(avatarFile.type)) {
          return jsonResponse(
            {
              success: false,
              error:
                "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.",
            },
            400
          );
        }

        if (avatarFile.size > 5 * 1024 * 1024) {
          return jsonResponse(
            {
              success: false,
              error: "Ukuran file maksimal 5MB",
            },
            400
          );
        }

        const ext = avatarFile.name.split(".").pop() || "jpg";
        const filename = `avatars/${user.id}-${Date.now()}.${ext}`;

        await env.R2_BUCKET.put(filename, avatarFile.stream(), {
          httpMetadata: { contentType: avatarFile.type },
        });

        const r2PublicUrl =
          env.R2_PUBLIC_URL || "https://assets.laporsunsal.com";
        avatarUrl = `${r2PublicUrl}/${filename}`;
        updateData.photo_url = avatarUrl;
      }
    } else {
      // Handle JSON body
      const body = await parseBody(request);
      updateData = {
        nama: body.name || body.nama,
        phone: body.phone,
        lembaga: body.lembaga,
        photo_url: body.avatar_url || body.photo_url,
      };
    }

    // Filter undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return jsonResponse(
        { success: false, error: "Tidak ada data yang diupdate" },
        400
      );
    }

    // Update via Apps Script
    const result = await callGoogleSheetsAPI(env, "update_profile", {
      user_id: user.id,
      ...updateData,
    });

    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Update gagal" },
        400
      );
    }

    return jsonResponse({
      success: true,
      message: "Profil berhasil diupdate",
      user: result.user || { ...user, ...updateData },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan server" },
      500
    );
  }
}

// ============================================
// PROXY HANDLER (Forward semua request lain ke Apps Script)
// ============================================

/**
 * Proxy request ke Google Apps Script untuk action lainnya
 */
async function handleProxy(request, env) {
  const body = await parseBody(request);

  if (!body.action) {
    return jsonResponse({ success: false, error: "Action required" }, 400);
  }

  const result = await callGoogleSheetsAPI(env, body.action, body);
  return jsonResponse(result, result.success ? 200 : 400);
}

/**
 * Handle submit_confirmation dengan upload gambar ke R2
 */
async function handleSubmitConfirmation(request, env) {
  console.log("=== SUBMIT CONFIRMATION HANDLER ===");

  try {
    const contentType = request.headers.get("content-type") || "";
    let confirmationData = {};
    let imageUrl = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      // Parse JSON data from 'data' field
      const dataField = formData.get("data");
      if (dataField) {
        try {
          confirmationData = JSON.parse(dataField);
        } catch (e) {
          console.error("Failed to parse data field:", e);
        }
      }

      // Get proof image file
      const proofImage = formData.get("proof_image");

      // Upload proof image to R2 if present
      if (proofImage && proofImage.size > 0 && env.R2_BUCKET) {
        console.log("Uploading proof image to R2...");
        console.log("File name:", proofImage.name);
        console.log("File size:", proofImage.size);
        console.log("File type:", proofImage.type);

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];

        if (!allowedTypes.includes(proofImage.type)) {
          return jsonResponse(
            {
              success: false,
              error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.",
            },
            400
          );
        }

        if (proofImage.size > 10 * 1024 * 1024) {
          return jsonResponse(
            {
              success: false,
              error: "Ukuran file maksimal 10MB",
            },
            400
          );
        }

        const ext = proofImage.name?.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `proofs/${timestamp}-${random}.${ext}`;

        await env.R2_BUCKET.put(filename, proofImage.stream(), {
          httpMetadata: { contentType: proofImage.type },
        });

        const r2PublicUrl = env.R2_PUBLIC_URL || "https://pub-1ea96c38d3bb4c92a8a6d1292d20cd0e.r2.dev";
        imageUrl = `${r2PublicUrl}/${filename}`;

        console.log("✅ Image uploaded to R2:", imageUrl);
      } else {
        console.log("⚠️ No proof_image found or R2_BUCKET not configured");
        console.log("proofImage exists:", !!proofImage);
        console.log("proofImage size:", proofImage?.size);
        console.log("R2_BUCKET exists:", !!env.R2_BUCKET);
      }
    } else {
      // Handle JSON body (fallback)
      confirmationData = await parseBody(request);
    }

    // Add image_url to confirmation data
    if (imageUrl) {
      confirmationData.image_url = imageUrl;
    }

    // Forward to Google Apps Script
    console.log("Forwarding to GAS with data:", JSON.stringify({
      ...confirmationData,
      image_url: imageUrl || "(not uploaded)"
    }));

    const result = await callGoogleSheetsAPI(env, "submit_confirmation", confirmationData);

    return jsonResponse(result, result.success ? 200 : 400);

  } catch (error) {
    console.error("Submit confirmation error:", error);
    return jsonResponse(
      { success: false, error: "Terjadi kesalahan saat mengirim konfirmasi: " + error.message },
      500
    );
  }
}

// ============================================
// ROUTER
// ============================================

async function handleRequest(request, env, _ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return handleCORS();
  }

  // Auth routes
  if (path === "/auth/register" && method === "POST") {
    return handleRegister(request, env);
  }

  if (path === "/auth/login" && method === "POST") {
    return handleLogin(request, env);
  }

  if (path === "/auth/verify" && method === "GET") {
    return handleVerifyEmail(request, env);
  }

  if (path === "/auth/forgot-password" && method === "POST") {
    return handleForgotPassword(request, env);
  }

  if (path === "/auth/reset-password" && method === "POST") {
    return handleResetPassword(request, env);
  }

  // User routes (protected)
  if (path === "/user/me" && method === "GET") {
    return handleGetMe(request, env);
  }

  if (path === "/user/update" && method === "PUT") {
    return handleUpdateUser(request, env);
  }

  // Proxy ke Apps Script untuk semua action lainnya
  // Support both /api and root "/" for backward compatibility
  if ((path === "/api" || path === "/") && method === "POST") {
    // Check if this is a submit_confirmation with file upload
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // For multipart, we need to check the action in the 'data' field
      // Clone request since we might need to read body twice
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      const dataField = formData.get("data");

      if (dataField) {
        try {
          const data = JSON.parse(dataField);
          if (data.action === "submit_confirmation") {
            console.log("Routing to handleSubmitConfirmation");
            return handleSubmitConfirmation(request, env);
          }
        } catch (e) {
          console.error("Error parsing data field:", e);
        }
      }
    }

    return handleProxy(request, env);
  }

  // Health check
  if (path === "/health" || path === "/") {
    return jsonResponse({
      status: "OK",
      service: "LaporSunsal Auth API",
      version: "1.0.0",
      database: "Google Sheets",
      timestamp: new Date().toISOString(),
    });
  }

  // 404 Not Found
  return jsonResponse(
    { success: false, error: "Endpoint tidak ditemukan" },
    404
  );
}

// ============================================
// WORKER EXPORT
// ============================================

const worker = {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      console.error("Worker error:", error);
      return jsonResponse(
        { success: false, error: "Internal server error" },
        500
      );
    }
  },
};

export default worker;
