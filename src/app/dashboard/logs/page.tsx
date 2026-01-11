"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface LogEntry {
  timestamp: string;
  action: string;
  user_id: string;
  details: string;
  ip_address: string;
  row_index?: number;
}

export default function LogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "get_logs",
          token: token,
          limit: 100,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLogs(result.data || []);
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
    fetchLogs();
    // Get current user role
    const adminUser = localStorage.getItem("admin_user");
    if (adminUser) {
      const user = JSON.parse(adminUser);
      setCurrentUserRole(user.role);
    }
  }, [fetchLogs]);

  const handleDeleteLog = async () => {
    if (!selectedLog || selectedLog.row_index === undefined) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "delete_log",
          row_index: selectedLog.row_index,
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Log berhasil dihapus");
        setDeleteDialogOpen(false);
        fetchLogs();
      } else {
        toast.error(result.error || "Gagal menghapus log");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      LOGIN:
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      LOGOUT:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
      REGISTER:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
      SUBMIT_CONFIRMATION:
        "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
      VERIFY_PAYMENT:
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      REJECT_PAYMENT:
        "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      CHANGE_PASSWORD:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
      UPDATE_PROFILE:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    };

    const colorClass =
      actionColors[action] ||
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";

    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${colorClass}`}
      >
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            System Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Riwayat aktivitas sistem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <Input
              placeholder="Cari log..."
              className="pl-10 h-10 w-full md:w-64 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            disabled={loading}
            className="shrink-0"
          >
            <span className="material-symbols-outlined">refresh</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">
            history
          </span>
          <h2 className="text-lg font-bold">Log Aktivitas</h2>
          <span className="text-sm text-slate-400 ml-2">
            ({filteredLogs.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
              history_toggle_off
            </span>
            <p className="text-slate-500">Tidak ada log ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    User ID
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Details
                  </th>
                  {currentUserRole === "super_admin" && (
                    <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm font-medium">
                        {formatDateTime(log.timestamp)}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
                        {log.user_id || "-"}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-500 truncate max-w-xs">
                        {log.details || "-"}
                      </p>
                    </td>
                    {currentUserRole === "super_admin" && (
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => {
                              setSelectedLog({ ...log, row_index: index + 2 });
                              setDeleteDialogOpen(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Log</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-400">
              Yakin ingin menghapus log ini?
            </p>
            {selectedLog && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
                <p>
                  <strong>Action:</strong> {selectedLog.action}
                </p>
                <p>
                  <strong>User:</strong> {selectedLog.user_id}
                </p>
                <p>
                  <strong>Details:</strong> {selectedLog.details}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLog}
              disabled={processing}
            >
              {processing ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
