"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

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
          source: "user",
        }),
      });

      await response.json();
      setSubmitted(true);
      toast.success("Jika email terdaftar, link reset password akan dikirim.");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-green-600 text-3xl">
            mark_email_read
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2">Cek Email Anda</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Jika email <strong>{email}</strong> terdaftar, kami telah mengirimkan
          link untuk reset password.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">
            <span className="material-symbols-outlined mr-2 text-lg">
              arrow_back
            </span>
            Kembali ke Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block">Email</Label>
        <Input
          type="email"
          placeholder="nama@email.com"
          className="h-12 rounded-xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl font-bold"
      >
        {loading ? "Memproses..." : "Kirim Link Reset"}
      </Button>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Kembali ke Login
        </Link>
      </div>
    </form>
  );
}

export default function UserForgotPasswordPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbw4f2llt5PmGdWXOrM1Bz0C4dCPXMMpNOmaoC_VwIOq6YsxVzFSuiWK9N9t7fil87JAcQ/exec";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          {logoUrl ? (
            <div className="mx-auto mb-4 h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">
                lock_reset
              </span>
            </div>
          )}
          <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Masukkan email untuk reset password
          </p>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<div className="text-center py-8">Loading...</div>}
          >
            <ForgotPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
      <Toaster position="top-center" />
    </div>
  );
}
