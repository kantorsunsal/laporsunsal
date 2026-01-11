"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    // Verifikasi token
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${AUTH_API_URL}/auth/verify?token=${token}`);
        const result = await response.json();

        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Email berhasil diverifikasi!");
        } else {
          setStatus("error");
          setMessage(result.error || "Verifikasi gagal. Token mungkin tidak valid atau sudah kadaluarsa.");
        }
      } catch (error) {
        console.error("Verify error:", error);
        setStatus("error");
        setMessage("Terjadi kesalahan. Silakan coba lagi.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Memverifikasi email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-green-600 text-3xl">
            check_circle
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2">Email Terverifikasi!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <Button onClick={() => router.push("/")} className="rounded-xl">
          <span className="material-symbols-outlined mr-2 text-lg">login</span>
          Login Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-red-600 text-3xl">
          error
        </span>
      </div>
      <h2 className="text-lg font-bold mb-2">Verifikasi Gagal</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {message}
      </p>
      <Link href="/">
        <Button variant="outline" className="rounded-xl">
          Kembali ke Halaman Login
        </Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-3xl">
              mark_email_read
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Verifikasi Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
