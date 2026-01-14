"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxpxFHWltbv_NkQkHq7bBweDwc68lytmmYiLC_0L7vDCE5EdrGqfLDithNg44MayeoS1w/exec";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch logo from public settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${GAS_URL}?action=get_public_settings`);
        const result = await response.json();
        if (result.success && result.data?.app_logo_url) {
          setLogoUrl(result.data.app_logo_url);
        }
      } catch (error) {
        console.error("Failed to fetch logo:", error);
      }
    };
    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          source: "dashboard",
        }),
      });

      await response.json();

      // Selalu tampilkan sukses (untuk keamanan)
      setSubmitted(true);
      toast.success("Jika email terdaftar, link reset password akan dikirim.");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="w-20 h-20 mx-auto mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <span className="material-symbols-outlined text-white text-3xl">
                lock_reset
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Lupa Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Masukkan email untuk reset password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-3xl">
                  mark_email_read
                </span>
              </div>
              <h2 className="text-lg font-bold mb-2">Cek Email Anda</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Jika email <strong>{email}</strong> terdaftar, kami telah
                mengirimkan link untuk reset password.
              </p>
              <Link href="/dashboard/login">
                <Button variant="outline" className="rounded-xl">
                  <span className="material-symbols-outlined mr-2 text-lg">
                    arrow_back
                  </span>
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="mb-2 block text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  className="h-12 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-blue-600/30"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2 text-lg">
                      send
                    </span>
                    Kirim Link Reset
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/dashboard/login"
                  className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                >
                  ← Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 LaporSunsal v1.0
        </p>
      </div>
    </div>
  );
}
