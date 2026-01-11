"use client";

import React, { useState } from "react";
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
import { toast } from "sonner";

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
}: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      toast.error("Password baru harus berbeda dari password lama");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "change_password",
          user_id: userId,
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
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
        toast.success("Password berhasil diubah!");
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        onOpenChange(false);
      } else {
        toast.error(result.error || "Gagal mengubah password");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              lock
            </span>
            Ubah Kata Sandi
          </DialogTitle>
          <DialogDescription>
            Masukkan password lama dan password baru Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Password Lama</Label>
            <Input
              type="password"
              placeholder="Masukkan password lama"
              value={formData.oldPassword}
              onChange={(e) =>
                setFormData({ ...formData, oldPassword: e.target.value })
              }
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="mb-2 block">Password Baru</Label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="mb-2 block">Konfirmasi Password Baru</Label>
            <Input
              type="password"
              placeholder="Ulangi password baru"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
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
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              {loading ? "Menyimpan..." : "Ubah Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
