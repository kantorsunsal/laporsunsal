-- ============================================
-- DATABASE SCHEMA FOR AUTHENTICATION SYSTEM
-- Cloudflare D1 (SQLite)
-- ============================================

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                           -- UUID
    email TEXT UNIQUE NOT NULL,                    -- Email unik
    password TEXT NOT NULL,                        -- Hashed password (bcrypt)
    name TEXT,                                     -- Nama lengkap
    avatar_url TEXT,                               -- URL foto profil di R2
    role TEXT DEFAULT 'user',                      -- Role: user, admin, super_admin
    is_verified INTEGER DEFAULT 0,                 -- 0 = belum verified, 1 = verified
    verification_token TEXT,                       -- Token untuk verifikasi email
    reset_token TEXT,                              -- Token untuk reset password
    reset_token_expiry INTEGER,                    -- Timestamp expiry reset token
    created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- Timestamp created
    updated_at INTEGER                             -- Timestamp updated
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ============================================
-- CARA DEPLOY:
-- ============================================
-- 1. Buat database D1:
--    wrangler d1 create laporsunsal-db
--
-- 2. Jalankan migration:
--    wrangler d1 execute laporsunsal-db --file=./schema.sql
--
-- 3. Atau via remote:
--    wrangler d1 execute laporsunsal-db --remote --file=./schema.sql
