"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyXhNAZOmAFuEG-F1W_n2pdT1seuaqIMWAzdmzBznE-_ItTpouWjjjVPdWCDJp5nCBKow/exec";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

    if (!formData.email || !formData.password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const userRole = result.user.role;

        // Check if user has admin or super_admin role
        if (userRole !== "admin" && userRole !== "super_admin") {
          toast.error(
            "Akses ditolak. Hanya admin yang dapat mengakses halaman ini."
          );
          setLoading(false);
          return;
        }

        // Store user data and token
        localStorage.setItem("admin_user", JSON.stringify(result.user));
        localStorage.setItem("admin_token", result.token);
        localStorage.setItem("admin_login_time", Date.now().toString()); // Simpan waktu login untuk session timeout

        toast.success("Login berhasil!");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Login gagal");
      }
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
                verified_user
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            LaporSunsal Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Masuk ke dashboard administrator
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-2 block text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                className="h-12 rounded-xl"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-xl"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2 text-lg">
                    login
                  </span>
                  Masuk
                </>
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-right">
            <a
              href="/dashboard/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Lupa password?
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-center text-slate-400">
              Hanya untuk administrator terdaftar.
              <br />
              Hubungi Super Admin jika memerlukan akses.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 LaporSunsal v1.0
        </p>
      </div>
    </div>
  );
}
