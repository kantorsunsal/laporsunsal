"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface Santri {
  nis: string;
  nama: string;
  kode: string;
  sekolah: string;
}

interface SantriDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSantriChange?: () => void;
}

export default function SantriDialog({
  open,
  onOpenChange,
  userId,
  onSantriChange,
}: SantriDialogProps) {
  const [loading, setLoading] = useState(false);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Santri[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Colors for avatars
  const avatarColors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchLinkedSantri = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_santri", user_id: userId }),
      });
      const result = await response.json();
      if (result.success) {
        setSantriList(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data santri");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch linked santri when dialog opens
  useEffect(() => {
    if (open && userId) {
      fetchLinkedSantri();
    }
  }, [open, userId, fetchLinkedSantri]);

  const handleSearch = async () => {
    if (searchQuery.length < 3) {
      toast.error("Minimal 3 karakter untuk pencarian");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "search_santri", query: searchQuery }),
      });
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data || []);
        if (result.data.length === 0) {
          toast.info("Tidak ditemukan santri");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Pencarian gagal");
    } finally {
      setSearching(false);
    }
  };

  const handleLinkSantri = async (santri: Santri) => {
    try {
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "add_santri",
          user_id: userId,
          nis: santri.nis,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`${santri.nama} berhasil ditambahkan`);
        setSearchResults([]);
        setSearchQuery("");
        setShowSearch(false);
        fetchLinkedSantri();
        onSantriChange?.();
      } else {
        toast.error(result.error || "Gagal menambahkan santri");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleUnlinkSantri = async (nis: string, nama: string) => {
    if (!confirm(`Hapus ${nama} dari daftar Anda?`)) return;

    try {
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "delete_santri",
          user_id: userId,
          nis: nis,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Berhasil dihapus");
        fetchLinkedSantri();
        onSantriChange?.();
      } else {
        toast.error(result.error || "Gagal menghapus");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Data Santri
            </DialogTitle>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Kelola daftar anak/santri yang terhubung dengan akun Anda
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {/* Linked Santri List */}
          {loading && santriList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
              <p>Memuat data santri...</p>
            </div>
          ) : !showSearch && santriList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
              <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">
                Belum ada santri terdaftar
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Gunakan tombol di bawah untuk mencari anak Anda
              </p>
            </div>
          ) : !showSearch ? (
            <div className="space-y-3">
              {santriList.map((santri, idx) => (
                <div
                  key={santri.nis}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                >
                  <Avatar
                    className={`h-12 w-12 shadow-sm ${getAvatarColor(idx)}`}
                  >
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        santri.nama
                      )}`}
                    />
                    <AvatarFallback className="text-white font-bold">
                      {getInitials(santri.nama)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {santri.nama}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {santri.kode} - {santri.sekolah}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnlinkSantri(santri.nis, santri.nama)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50 border border-red-100 rounded-full transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Search View */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400 px-1">
                  Cari Santri (NIS / Nama)
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Masukkan minimal 3 karakter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 rounded-2xl pr-12 border-slate-200 focus:ring-blue-500"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSearch}
                    disabled={searching}
                    className="absolute right-1 top-1 h-10 w-10 text-blue-500"
                  >
                    {searching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {searchResults.map((santri, idx) => (
                  <Card
                    key={santri.nis}
                    className="border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all rounded-2xl overflow-hidden"
                    onClick={() => handleLinkSantri(santri)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar
                        className={`h-10 w-10 ${getAvatarColor(idx + 10)}`}
                      >
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            santri.nama
                          )}`}
                        />
                        <AvatarFallback className="text-white text-xs font-bold">
                          {getInitials(santri.nama)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {santri.nama}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          NIS: {santri.nis} • {santri.sekolah}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-blue-500" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full text-slate-400 text-sm hover:bg-slate-100"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                Batal
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
          {!showSearch && (
            <Button
              onClick={() => setShowSearch(true)}
              className="w-full h-14 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Tambah Santri Baru
            </Button>
          )}
          <p className="text-center text-[10px] text-slate-400 mt-4">
            Ketuk salah satu santri untuk mengelola data
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
