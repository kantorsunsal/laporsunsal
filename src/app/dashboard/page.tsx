"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface Confirmation {
  id: string;
  user_id: string;
  tanggal_bayar: string;
  metode: string;
  bank_penerima: string;
  nama_penerima: string;
  nominal: string;
  bank_pengirim: string;
  nama_pengirim: string;
  jenis_bukti: string;
  bukti_url: string;
  keterangan: string;
  status: string;
  created: string;
  verified_by: string;
  verified_at: string;
  santri_id: string;
  santri_nama: string;
}

interface DashboardStats {
  pending: number;
  verified: number;
  rejected: number;
  totalRevenue: number;
  todayCount: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    verified: 0,
    rejected: 0,
    totalRevenue: 0,
    todayCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Verified" | "Rejected">("Pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      // Fetch confirmations with status filter
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "get_all_confirmations",
          token: token,
          status: statusFilter,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConfirmations(result.data || []);
        setStats({
          pending: result.stats?.pending || 0,
          verified: result.stats?.verified || 0,
          rejected: result.stats?.rejected || 0,
          totalRevenue: result.stats?.totalRevenue || 0,
          todayCount: result.stats?.todayCount || 0,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);

    try {
      const token = localStorage.getItem("admin_token");
      const adminUser = localStorage.getItem("admin_user");
      const admin = adminUser ? JSON.parse(adminUser) : null;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "verify_confirmation",
          confirmation_id: id,
          status: action === "approve" ? "Verified" : "Rejected",
          verified_by: admin?.nama || "Admin",
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          action === "approve"
            ? "Pembayaran berhasil diverifikasi"
            : "Pembayaran ditolak"
        );
        // Refresh data
        fetchData();
      } else {
        toast.error(result.error || "Gagal memproses");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num =
      typeof value === "string" ? parseFloat(value.replace(/\D/g, "")) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredConfirmations = confirmations.filter((c) => {
    // Search filter
    const matchesSearch =
      c.santri_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nama_pengirim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date range filter
    let matchesDate = true;
    if (startDate || endDate) {
      const payDate = new Date(c.tanggal_bayar || c.created);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (payDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (payDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Verifikasi Pembayaran
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola dan verifikasi konfirmasi pembayaran
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <Input
              placeholder="Cari transaksi..."
              className="pl-10 h-10 w-full md:w-64 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="shrink-0"
          >
            <span className="material-symbols-outlined">refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            {stats.todayCount > 0 && (
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                +{stats.todayCount} Hari ini
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-tight">
            Pending
          </p>
          <p className="text-xl lg:text-2xl font-bold mt-1">{stats.pending}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-tight">
            Terverifikasi
          </p>
          <p className="text-xl lg:text-2xl font-bold mt-1">{stats.verified}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">cancel</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-tight">
            Ditolak
          </p>
          <p className="text-xl lg:text-2xl font-bold mt-1">{stats.rejected}</p>
        </div>

        <div className="bg-blue-600 p-4 lg:p-6 rounded-2xl shadow-lg shadow-blue-600/20 col-span-2 lg:col-span-1">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-tight">
            Total Revenue (Bulan Ini)
          </p>
          <p className="text-lg lg:text-xl font-bold text-white mt-1 truncate">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Confirmations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">
                list_alt
              </span>
              <h2 className="text-lg font-bold">Daftar Konfirmasi</h2>
              <span className="text-sm text-slate-400 ml-2">
                ({filteredConfirmations.length})
              </span>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">Semua</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Dari:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Sampai:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {/* Clear Filters */}
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="h-9 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors"
                >
                  Reset Tanggal
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : filteredConfirmations.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
              inbox
            </span>
            <p className="text-slate-500">Tidak ada konfirmasi pending</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Santri / Pengirim
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Tanggal
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nominal
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hidden sm:table-cell">
                    Bukti
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredConfirmations.map((conf) => (
                  <tr
                    key={conf.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-400 text-lg">
                            person
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {conf.santri_nama || "-"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {conf.nama_pengirim || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm font-medium">
                        {formatDate(conf.tanggal_bayar)}
                      </p>
                      <p className="text-xs text-slate-500">{conf.metode}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(conf.nominal)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-center hidden sm:table-cell">
                      {conf.bukti_url ? (
                        <button
                          onClick={() => setSelectedProof(conf.bukti_url)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            image
                          </span>
                          Lihat
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Tidak ada
                        </span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          conf.status === "Verified"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                            : conf.status === "Rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {conf.status === "Verified" ? "check_circle" : conf.status === "Rejected" ? "cancel" : "pending"}
                        </span>
                        {conf.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {conf.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleVerify(conf.id, "approve")}
                            disabled={processingId === conf.id}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-all disabled:opacity-50"
                            title="Approve"
                          >
                            <span className="material-symbols-outlined">
                              check_circle
                            </span>
                          </button>
                          <button
                            onClick={() => handleVerify(conf.id, "reject")}
                            disabled={processingId === conf.id}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                            title="Reject"
                          >
                            <span className="material-symbols-outlined">
                              cancel
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-400">
                          {conf.verified_by && (
                            <p>oleh: {conf.verified_by}</p>
                          )}
                          {conf.verified_at && (
                            <p>{formatDate(conf.verified_at)}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Viewer Modal */}
      <Dialog
        open={!!selectedProof}
        onOpenChange={() => setSelectedProof(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg min-h-[300px] flex items-center justify-center overflow-hidden">
            {selectedProof && (
              <img
                src={selectedProof}
                alt="Payment Proof"
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedProof(null)}>
              Tutup
            </Button>
            {selectedProof && (
              <Button asChild>
                <a
                  href={selectedProof}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined mr-2 text-lg">
                    download
                  </span>
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
