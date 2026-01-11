"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { validateImageFile, compressPaymentProof } from "@/lib/imageUtils";
import { formatIDR } from "@/lib/utils";
import {
  AVAILABLE_BANKS,
  getAccountsByBank,
  getAccountById,
  formatAccountDisplay,
  type BankType,
} from "@/lib/bankData";

interface ConfirmationFormProps {
  onBack: () => void;
}

interface Santri {
  nis: string;
  nama: string;
  kode: string;
  sekolah: string;
}

const AUTH_API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

const ConfirmationForm: React.FC<ConfirmationFormProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: "",
    paymentMethod: "transfer",
    bankName: "",
    senderName: "",
    // Bank Penerima fields
    selectedBankType: "" as BankType | "lainnya" | "",
    selectedAccountId: "",
    manualBankName: "",
    manualAccountNumber: "",
    recipientName: "",
    amount: "1.500.000",
    notes: "",
  });

  // Handle amount formatting with IDR format
  const handleAmountChange = (value: string) => {
    const formatted = formatIDR(value);
    setFormData({ ...formData, amount: formatted });
  };

  // Handle bank type change
  const handleBankTypeChange = (value: string) => {
    setFormData({
      ...formData,
      selectedBankType: value as BankType | "lainnya" | "",
      selectedAccountId: "",
      recipientName: "",
      manualBankName: "",
      manualAccountNumber: "",
    });
  };

  // Handle account selection
  const handleAccountSelect = (accountId: string) => {
    const account = getAccountById(accountId);
    setFormData({
      ...formData,
      selectedAccountId: accountId,
      recipientName: account?.namaPenerima || "",
    });
  };

  // Get filtered accounts based on selected bank type
  const filteredAccounts =
    formData.selectedBankType && formData.selectedBankType !== "lainnya"
      ? getAccountsByBank(formData.selectedBankType as BankType)
      : [];

  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [loadingSantri, setLoadingSantri] = useState(false);

  // Fetch linked santri on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (user?.id) {
      fetchSantriList(user.id);
    }
  }, []);

  const fetchSantriList = async (userId: string) => {
    setLoadingSantri(true);
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
    } finally {
      setLoadingSantri(false);
    }
  };

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      paymentDate: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file before accepting
      const validation = validateImageFile(selectedFile);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - semua field wajib diisi kecuali keterangan
    const errors: string[] = [];

    // 1. Validasi Santri - wajib jika ada data santri
    if (santriList.length > 0 && !selectedSantri) {
      errors.push("Pilih santri terlebih dahulu");
    }

    // 2. Validasi Tanggal Pembayaran
    if (!formData.paymentDate) {
      errors.push("Tanggal pembayaran harus diisi");
    }

    // 3. Validasi Metode Pembayaran
    if (!formData.paymentMethod) {
      errors.push("Metode pembayaran harus dipilih");
    }

    // 4. Validasi khusus berdasarkan metode pembayaran
    if (formData.paymentMethod !== "tunai") {
      // Bank Penerima wajib dipilih
      if (!formData.selectedBankType) {
        errors.push("Bank penerima harus dipilih");
      }

      // Jika BSI/BCA - nomor rekening wajib dipilih
      if (
        formData.selectedBankType &&
        formData.selectedBankType !== "lainnya"
      ) {
        if (!formData.selectedAccountId) {
          errors.push("Nomor rekening penerima harus dipilih");
        }
      }

      // Jika bank lainnya - nama bank dan nomor rekening manual wajib diisi
      if (formData.selectedBankType === "lainnya") {
        if (!formData.manualBankName.trim()) {
          errors.push("Nama bank harus diisi");
        }
        if (!formData.manualAccountNumber.trim()) {
          errors.push("Nomor rekening penerima harus diisi");
        }
      }
    }

    // 5. Validasi Nama Penerima (untuk semua metode)
    if (!formData.recipientName.trim()) {
      errors.push(
        formData.paymentMethod === "tunai"
          ? "Nama penerima tunai harus diisi"
          : "Nama pemilik rekening penerima harus diisi"
      );
    }

    // 6. Validasi detail pengirim (hanya untuk transfer)
    if (formData.paymentMethod === "transfer") {
      if (!formData.bankName.trim()) {
        errors.push("Bank pengirim harus diisi");
      }
      if (!formData.senderName.trim()) {
        errors.push("Nama pengirim harus diisi");
      }
    }

    // 7. Validasi Nominal
    if (!formData.amount || formData.amount === "0") {
      errors.push("Nominal pembayaran harus diisi");
    }

    // 8. Validasi Bukti Pembayaran
    if (!file && !preview) {
      errors.push(
        formData.paymentMethod === "tunai"
          ? "Upload foto kuitansi terlebih dahulu"
          : "Upload bukti pembayaran terlebih dahulu"
      );
    }

    // Jika ada error, tampilkan semua error dalam satu notifikasi dan hentikan
    if (errors.length > 0) {
      toast.error("Lengkapi data berikut:", {
        description: errors.map((err) => `• ${err}`).join("\n"),
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      // Get user from localStorage
      const savedUser = localStorage.getItem("user");
      const user = savedUser ? JSON.parse(savedUser) : null;

      // Compress image for payment proof
      let uploadFile = file;
      if (file) {
        toast.info("Mengompres gambar...");
        uploadFile = await compressPaymentProof(file);
        toast.success(
          `Gambar dikompres: ${(file.size / 1024).toFixed(0)}KB → ${(
            uploadFile.size / 1024
          ).toFixed(0)}KB`
        );
      }

      const body = new FormData();
      if (uploadFile) {
        body.append("proof_image", uploadFile);
      }

      // Convert bank dropdown data to sheet-compatible format
      let receivingBank = "";
      if (formData.selectedBankType === "lainnya") {
        // Manual input - use manual bank name + account number
        receivingBank = `${formData.manualBankName} - ${formData.manualAccountNumber}`;
      } else if (formData.selectedBankType && formData.selectedAccountId) {
        // BSI/BCA - use bank type + account details from selection
        const account = getAccountById(formData.selectedAccountId);
        if (account) {
          receivingBank = `${account.bankType} - ${account.kodeLembaga} (${account.nomorRekening})`;
        }
      }

      body.append(
        "data",
        JSON.stringify({
          action: "submit_confirmation",
          user_id: user?.id || "anonymous",
          santri_id: selectedSantri?.nis || "-",
          santri_nama: selectedSantri?.nama || "-",
          // Sheet-compatible fields
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          receivingBank: receivingBank, // Bank Penerima column
          recipientName: formData.recipientName, // Nama Penerima column
          bankName: formData.bankName, // Bank Pengirim column
          senderName: formData.senderName, // Nama Pengirim column
          amount: formData.amount,
          notes: formData.notes,
        })
      );

      // Kirim ke Cloudflare Worker
      const response = await fetch(
        "https://laporsunsal-api.kantorsunsal.workers.dev",
        {
          method: "POST",
          body: body,
        }
      );

      if (!response.ok) throw new Error("Gagal mengirim data");

      toast.success("Konfirmasi berhasil terkirim!");
      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim konfirmasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
        <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-6">
          <span className="material-symbols-outlined text-5xl">
            check_circle
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Konfirmasi Terkirim!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
          Terima kasih. Bukti pembayaran Anda sedang kami verifikasi. Status
          akan diupdate dalam 1x24 jam.
        </p>
        <Button
          onClick={onBack}
          className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-blue-500/30"
        >
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full -ml-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Button>
        <h2 className="text-xl font-bold">Konfirmasi Pembayaran</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Santri Selection */}
          <div>
            <Label className="mb-2 block">Untuk Santri</Label>
            {loadingSantri ? (
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-sm text-slate-500">Memuat...</span>
              </div>
            ) : santriList.length === 0 ? (
              <div className="h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center justify-center px-4">
                <span className="text-sm text-yellow-700 dark:text-yellow-400">
                  Belum ada santri terdaftar. Tambahkan di menu Profil → Data
                  Santri
                </span>
              </div>
            ) : (
              <Select
                value={selectedSantri?.nis || ""}
                onValueChange={(nis) => {
                  const santri = santriList.find((s) => s.nis === nis);
                  setSelectedSantri(santri || null);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {santriList.map((santri) => (
                    <SelectItem key={santri.nis} value={santri.nis}>
                      {santri.nama} - {santri.sekolah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {santriList.length > 1 && (
              <p className="text-xs text-slate-400 mt-1 italic">
                * Jika pembayaran untuk beberapa santri dalam 1 transfer, pilih
                salah satu perwakilan dan tambahkan di keterangan
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Tanggal Pembayaran</Label>
            <Input
              required
              type="date"
              className="h-12 rounded-xl"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label className="mb-2 block">Pembayaran Melalui</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Pilih metode pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transfer Bank</SelectItem>
                <SelectItem value="tunai">Tunai</SelectItem>
                <SelectItem value="va">Virtual Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {formData.paymentMethod !== "tunai" && (
              <>
                {/* Bank Penerima Dropdown */}
                <div>
                  <Label className="mb-2 block">Bank Penerima</Label>
                  <Select
                    value={formData.selectedBankType}
                    onValueChange={handleBankTypeChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Pilih bank tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_BANKS.map((bank) => (
                        <SelectItem key={bank.value} value={bank.value}>
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* No Rekening Dropdown - For BSI/BCA */}
                {formData.selectedBankType &&
                  formData.selectedBankType !== "lainnya" && (
                    <div>
                      <Label className="mb-2 block">Nomor Rekening</Label>
                      <Select
                        value={formData.selectedAccountId}
                        onValueChange={handleAccountSelect}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Pilih nomor rekening" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {formatAccountDisplay(account)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Manual Input - For Lainnya */}
                {formData.selectedBankType === "lainnya" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <Label className="mb-2 block">Nama Bank</Label>
                      <Input
                        required
                        placeholder="Contoh: Mandiri, BRI, BNI"
                        className="h-12 rounded-xl"
                        value={formData.manualBankName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manualBankName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">
                        Nomor Rekening Penerima
                      </Label>
                      <Input
                        required
                        placeholder="Contoh: 1234567890"
                        className="h-12 rounded-xl"
                        value={formData.manualAccountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manualAccountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Nama Penerima - auto-filled for BSI/BCA, manual for Lainnya/Tunai */}
            <div>
              <Label className="mb-2 block">
                {formData.paymentMethod === "tunai"
                  ? "Diterima Oleh"
                  : "Atas Nama Penerima"}
              </Label>
              <Input
                required
                placeholder={
                  formData.paymentMethod === "tunai"
                    ? "Contoh: Ustadzah Nabila"
                    : "Nama pemegang rekening tujuan"
                }
                className="h-12 rounded-xl"
                value={formData.recipientName}
                readOnly={
                  formData.selectedBankType !== "lainnya" &&
                  formData.selectedBankType !== "" &&
                  formData.paymentMethod !== "tunai"
                }
                onChange={(e) =>
                  setFormData({ ...formData, recipientName: e.target.value })
                }
              />
              {formData.selectedBankType &&
                formData.selectedBankType !== "lainnya" &&
                formData.paymentMethod !== "tunai" && (
                  <p className="text-xs text-slate-400 mt-1 italic">
                    * Nama penerima otomatis terisi dari data rekening
                  </p>
                )}
            </div>
          </div>

          {formData.paymentMethod === "transfer" && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Detail Pengirim
              </h3>
              <div>
                <Label className="mb-2 block">Bank Pengirim</Label>
                <Input
                  required
                  placeholder="Bank asal yang Anda gunakan"
                  className="h-12 rounded-xl"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2 block">Atas Nama Pengirim</Label>
                <Input
                  required
                  placeholder="Nama sesuai di buku tabungan Anda"
                  className="h-12 rounded-xl"
                  value={formData.senderName}
                  onChange={(e) =>
                    setFormData({ ...formData, senderName: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div>
            <Label className="mb-2 block">Nominal yang Dibayar (Rp)</Label>
            <Input
              required
              className="h-12 rounded-xl font-bold"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div>
            <Label className="mb-2 block">
              Upload Bukti{" "}
              {formData.paymentMethod === "tunai" ? "Kuitansi" : "Pembayaran"}
            </Label>
            <Label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-colors bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden group">
              {preview ? (
                <div className="absolute inset-0">
                  <Image
                    src={preview}
                    alt="Proof preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-bold">
                      Ganti Gambar
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-2xl">
                      cloud_upload
                    </span>
                  </div>
                  <p className="text-sm font-medium">Klik untuk upload foto</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Format JPG, PNG (Maks 5MB)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                required={!preview}
              />
            </Label>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic leading-tight">
              * Contoh: Jika membayar secara tunai melalui{" "}
              <strong>Ustadzah Nabila</strong>, harap sertakan foto bukti
              kuitansi atau catatan yang diberikan.
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Keterangan</Label>
            <Textarea
              placeholder="Tambahkan catatan jika diperlukan"
              className="rounded-xl min-h-[100px]"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-blue-500/30"
        >
          {loading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Memproses...
            </>
          ) : (
            "Kirim Konfirmasi"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ConfirmationForm;
