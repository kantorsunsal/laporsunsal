"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Ganti dengan URL Web App GAS Auth Anda
const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4f2llt5PmGdWXOrM1Bz0C4dCPXMMpNOmaoC_VwIOq6YsxVzFSuiWK9N9t7fil87JAcQ/exec";

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

interface User {
  id: string;
  nama: string;
  email: string;
  phone?: string;
  lembaga?: string;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [registerData, setRegisterData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Response:", text);
        throw new Error("Invalid response from server");
      }

      if (result.success) {
        toast.success("Login berhasil!");
        localStorage.setItem("auth_token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        onAuthSuccess(result.user);
      } else {
        toast.error(result.error || "Login gagal");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.nama,
          email: registerData.email,
          password: registerData.password,
          phone: registerData.phone,
        }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Response:", text);
        throw new Error("Invalid response from server");
      }

      if (result.success) {
        // Jangan langsung login, tampilkan pesan untuk verifikasi email
        toast.success(
          "Registrasi berhasil! Silakan cek email untuk verifikasi."
        );
        // Reset form
        setRegisterData({
          nama: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
        });
        // Optional: tampilkan info tambahan
        toast.info("Link verifikasi telah dikirim ke email Anda", {
          duration: 5000,
        });
      } else {
        toast.error(result.error || "Registrasi gagal");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

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
                school
              </span>
            </div>
          )}
          <CardTitle className="text-2xl font-bold">LaporSunsal</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Konfirmasi Pembayaran Yayasan Sunniyah Salafiyah
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="login" className="flex-1 font-semibold">
                Masuk
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 font-semibold">
                Daftar
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="mb-2 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Password</Label>
                  <Input
                    type="password"
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="mb-2 block">Nama Lengkap *</Label>
                  <Input
                    type="text"
                    placeholder="Nama sesuai identitas"
                    value={registerData.nama}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, nama: e.target.value })
                    }
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Email *</Label>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2 block">Password *</Label>
                    <Input
                      type="password"
                      placeholder="Min. 6 karakter"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Ulangi Password *</Label>
                    <Input
                      type="password"
                      placeholder="Ulangi password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">No. HP</Label>
                  <Input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={registerData.phone}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        phone: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Memproses..." : "Daftar Sekarang"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
