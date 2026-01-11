"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface HistoryProps {
  onBack: () => void;
}

interface Confirmation {
  id: string;
  santri_nama: string;
  amount: string;
  payment_date: string;
  status: string;
  sender_bank: string;
  receiving_bank: string;
  created: string;
  notes: string;
}

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

const History: React.FC<HistoryProps> = ({ onBack }) => {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "get_confirmations",
          user_id: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Sort by created date descending
        const sorted = (result.data || []).sort(
          (a: Confirmation, b: Confirmation) =>
            new Date(b.created).getTime() - new Date(a.created).getTime()
        );
        setConfirmations(sorted);
      } else {
        toast.error(result.error || "Gagal memuat riwayat");
      }
    } catch (err) {
      console.error("Fetch History Error:", err);
      toast.error("Gagal memuat riwayat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === undefined || amount === null) return "Rp 0";

    let num = 0;
    if (typeof amount === "number") {
      num = amount;
    } else {
      const str = String(amount);
      num = parseInt(str.replace(/[^\d]/g, "")) || 0;
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "verified":
      case "selesai":
        return "bg-green-100 text-green-700 hover:bg-green-100 border-0";
      case "pending":
      case "tunggu":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0";
      case "rejected":
      case "ditolak":
        return "bg-red-100 text-red-700 hover:bg-red-100 border-0";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100 border-0";
    }
  };

  const getStatusDot = (status: string | null | undefined) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "verified":
      case "selesai":
        return "bg-green-500";
      case "pending":
      case "tunggu":
        return "bg-yellow-500";
      case "rejected":
      case "ditolak":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

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
        <h2 className="text-xl font-bold">Riwayat Transaksi</h2>
      </div>

      <Tabs defaultValue="konfirmasi" className="w-full">
        <TabsList className="w-full bg-slate-100 dark:bg-slate-900 p-1 h-12 rounded-xl mb-6">
          <TabsTrigger
            value="konfirmasi"
            className="flex-1 rounded-lg font-bold data-[state=active]:shadow-sm"
          >
            Konfirmasi
          </TabsTrigger>
          <TabsTrigger
            value="tabel"
            className="flex-1 rounded-lg font-bold data-[state=active]:shadow-sm"
          >
            Tabel
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="konfirmasi"
          className="space-y-4 animate-in fade-in duration-300"
        >
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              Memuat riwayat...
            </div>
          ) : confirmations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 italic border-2 border-dashed rounded-2xl">
              Belum ada riwayat konfirmasi
            </div>
          ) : (
            confirmations.map((tx) => (
              <Card
                key={tx.id}
                className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(tx.payment_date || tx.created)}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {tx.notes || `Pembayaran - ${tx.santri_nama}`}
                      </h4>
                    </div>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(tx.status)}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      {tx.sender_bank || tx.receiving_bank}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tabel" className="animate-in fade-in duration-300">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">
                      Nominal
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Memuat...
                      </td>
                    </tr>
                  ) : confirmations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-slate-500 italic"
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    confirmations.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {formatDate(tx.payment_date || tx.created)}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                tx.status
                              )}`}
                            ></span>
                            <span
                              className={`text-[10px] font-bold ${
                                tx.status.toLowerCase() === "verified"
                                  ? "text-green-600"
                                  : tx.status.toLowerCase() === "pending"
                                  ? "text-yellow-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
