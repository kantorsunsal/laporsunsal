"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface Setting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>(
    {}
  );

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "get_settings",
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSettings(result.data || []);
        // Initialize edited settings with current values
        const initial: Record<string, string> = {};
        (result.data || []).forEach((s: Setting) => {
          initial[s.key] = s.value;
        });
        setEditedSettings(initial);
      } else {
        toast.error(result.error || "Gagal memuat data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "update_settings",
          settings: editedSettings,
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Pengaturan berhasil disimpan");
        fetchSettings();
      } else {
        toast.error(result.error || "Gagal menyimpan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getInputType = (key: string) => {
    if (key.includes("email")) return "email";
    if (key.includes("hours") || key.includes("size") || key.includes("mb"))
      return "number";
    return "text";
  };

  const isSecretField = (key: string) => {
    return key.includes("secret") || key.includes("key");
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="h-10 w-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Pengaturan Aplikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Konfigurasi sistem LaporSunsal
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2 text-lg">
                save
              </span>
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">
            settings
          </span>
          <h2 className="text-lg font-bold">Konfigurasi</h2>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {settings.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
                settings_applications
              </span>
              <p className="text-slate-500">Tidak ada pengaturan</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  className="grid md:grid-cols-3 gap-2 md:gap-4 items-start"
                >
                  <div>
                    <Label className="font-semibold text-sm">
                      {setting.key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {setting.description}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    {isSecretField(setting.key) ? (
                      <div className="relative">
                        <Input
                          type="password"
                          value={editedSettings[setting.key] || ""}
                          onChange={(e) =>
                            handleChange(setting.key, e.target.value)
                          }
                          className="h-11 rounded-xl font-mono text-sm pr-20"
                          disabled
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 uppercase font-bold">
                          Protected
                        </span>
                      </div>
                    ) : (
                      <Input
                        type={getInputType(setting.key)}
                        value={editedSettings[setting.key] || ""}
                        onChange={(e) =>
                          handleChange(setting.key, e.target.value)
                        }
                        className="h-11 rounded-xl"
                        placeholder={`Masukkan ${setting.key.replace(
                          /_/g,
                          " "
                        )}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600 shrink-0">
            info
          </span>
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-400 text-sm">
              Catatan Penting
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>
                • Field <strong>Secret Key</strong> tidak dapat diubah untuk
                keamanan
              </li>
              <li>
                • Perubahan pengaturan akan langsung berlaku setelah disimpan
              </li>
              <li>• Pastikan format email benar untuk notifikasi admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
