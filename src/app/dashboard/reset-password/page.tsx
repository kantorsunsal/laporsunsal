"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token tidak ditemukan. Silakan request ulang.");
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Password wajib diisi");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          new_password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        toast.success("Password berhasil diubah!");
      } else {
        toast.error(result.error || "Gagal reset password");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-600 text-3xl">
            error
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2">Token Tidak Valid</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Link reset password tidak valid atau sudah kadaluarsa.
        </p>
        <Link href="/dashboard/forgot-password">
          <Button className="rounded-xl">Request Link Baru</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-green-600 text-3xl">
            check_circle
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2">Password Berhasil Diubah!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Silakan login dengan password baru Anda.
        </p>
        <Button
          onClick={() => router.push("/dashboard/login")}
          className="rounded-xl"
        >
          <span className="material-symbols-outlined mr-2 text-lg">login</span>
          Login Sekarang
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="mb-2 block text-sm font-medium">Password Baru</Label>
        <Input
          type="password"
          placeholder="Minimal 6 karakter"
          className="h-12 rounded-xl"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          disabled={loading}
        />
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium">
          Konfirmasi Password
        </Label>
        <Input
          type="password"
          placeholder="Ulangi password"
          className="h-12 rounded-xl"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Memproses...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined mr-2 text-lg">lock</span>
            Ubah Password
          </>
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/30">
            <span className="material-symbols-outlined text-white text-3xl">
              password
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Buat password baru untuk akun Anda
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 border-3 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 LaporSunsal v1.0
        </p>
      </div>
    </div>
  );
}
