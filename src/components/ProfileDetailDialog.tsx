"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { validateImageFile, compressProfilePhoto } from "@/lib/imageUtils";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

const WORKER_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface User {
  id: string;
  nama: string;
  email: string;
  phone?: string;
  lembaga?: string;
  photo_url?: string;
}

interface ProfileDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileDetailDialog({
  open,
  onOpenChange,
  user,
  onProfileUpdate,
}: ProfileDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    nama: user.nama || "",
    email: user.email || "",
    phone: user.phone || "",
    lembaga: user.lembaga || "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user.photo_url || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        nama: user.nama || "",
        email: user.email || "",
        phone: user.phone || "",
        lembaga: user.lembaga || "",
      });
      setPhotoPreview(user.photo_url || null);
      setSelectedFile(null);
    }
  }, [open, user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file before accepting
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) return user.photo_url || null;

    setUploadingPhoto(true);
    try {
      // Compress photo before upload
      const compressedFile = await compressProfilePhoto(selectedFile);

      const formDataUpload = new FormData();
      formDataUpload.append("profile_photo", compressedFile);
      formDataUpload.append(
        "data",
        JSON.stringify({
          action: "upload_profile_photo",
          user_id: user.id,
        })
      );

      const response = await fetch(WORKER_URL, {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();
      if (result.success && result.imageUrl) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || "Upload gagal");
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback: gunakan base64 preview jika worker gagal
      if (photoPreview && photoPreview.startsWith("data:image")) {
        toast.info("Foto disimpan secara lokal");
        return photoPreview;
      }
      toast.error("Gagal upload foto");
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    setLoading(true);

    try {
      // Upload foto jika ada
      let photoUrl = user.photo_url;
      if (selectedFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Update profil ke GAS
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "update_profile",
          user_id: user.id,
          nama: formData.nama,
          phone: formData.phone,
          lembaga: formData.lembaga,
          photo_url: photoUrl,
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
        toast.success("Profil berhasil diperbarui!");
        const updatedUser = {
          ...user,
          nama: formData.nama,
          phone: formData.phone,
          lembaga: formData.lembaga,
          photo_url: photoUrl,
        };
        onProfileUpdate(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        onOpenChange(false);
      } else {
        toast.error(result.error || "Gagal memperbarui profil");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              person
            </span>
            Detail Profil
          </DialogTitle>
          <DialogDescription>Perbarui informasi profil Anda</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center">
            <div
              className="relative group cursor-pointer"
              onClick={handlePhotoClick}
            >
              <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-xl">
                <AvatarImage
                  src={
                    photoPreview ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${user.nama}`
                  }
                  alt={user.nama}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.nama)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">
                  photo_camera
                </span>
              </div>
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-slate-500 mt-2">
              Klik untuk ubah foto (Max 2MB)
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Nama Lengkap</Label>
            <Input
              type="text"
              placeholder="Nama lengkap"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="mb-2 block">Email</Label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Email tidak dapat diubah
            </p>
          </div>

          <div>
            <Label className="mb-2 block">No. HP</Label>
            <Input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="mb-2 block">Lembaga/Instansi</Label>
            <Input
              type="text"
              placeholder="Nama sekolah/pondok"
              value={formData.lembaga}
              onChange={(e) =>
                setFormData({ ...formData, lembaga: e.target.value })
              }
              className="h-12 rounded-xl"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
