"use client";

import React, { useState, useEffect } from "react";
import { Page } from "@/app/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface HomeProps {
  onNavigate: (page: Page) => void;
}

interface DashboardStats {
  totalAmount: number;
  pendingCount: number;
  lastConfirmationDate: string | null;
  recentActivities: Array<{
    id: string;
    title: string;
    status: string;
    date: string;
    bank: string;
    amount: number;
  }>;
}

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_dashboard_stats",
          user_id: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error || "Gagal memuat statistik");
      }
    } catch (err) {
      console.error("Fetch Stats Error:", err);
      // Don't toast on initial load error to avoid noise if it's a network issue
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Bill Card */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 to-blue-500 p-6 shadow-lg shadow-blue-500/25 text-white">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Total Konfirmasi
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                {loading ? "..." : formatCurrency(stats?.totalAmount || 0)}
              </h2>
            </div>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <span className="material-symbols-outlined text-white">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-xs text-blue-100">Konfirmasi Terakhir</span>
              <span className="text-sm font-semibold">
                {loading
                  ? "..."
                  : formatDate(stats?.lastConfirmationDate || null)}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-0 backdrop-blur-sm gap-1"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  stats?.pendingCount ? "bg-yellow-400" : "bg-green-400"
                }`}
              ></span>
              {loading ? "..." : `${stats?.pendingCount || 0} Pending`}
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Menu */}
      <section>
        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4">
          Menu Utama
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md hover:border-blue-500/30 transition-all duration-300 group border-slate-100 dark:border-slate-800"
            onClick={() => onNavigate(Page.CONFIRMATION)}
          >
            <CardContent className="p-5 flex flex-col items-start">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">
                  upload_file
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Konfirmasi Pembayaran
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload bukti transfer & konfirmasi
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md hover:border-blue-500/30 transition-all duration-300 group border-slate-100 dark:border-slate-800"
            onClick={() => onNavigate(Page.HISTORY)}
          >
            <CardContent className="p-5 flex flex-col items-start">
              <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">
                  history
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Riwayat Transaksi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Lihat status pembayaran lalu
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-white font-bold text-lg">
            Aktivitas Terakhir
          </h3>
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto font-semibold"
            onClick={() => onNavigate(Page.HISTORY)}
          >
            Lihat Semua
          </Button>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              Memuat aktivitas...
            </div>
          ) : !stats?.recentActivities ||
            stats.recentActivities.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm italic">
              Belum ada aktivitas
            </div>
          ) : (
            stats.recentActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                title={activity.title}
                status={activity.status}
                date={formatDate(activity.date)}
                bank={activity.bank}
                type={activity.status === "Verified" ? "success" : "warning"}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

interface ActivityItemProps {
  title: string;
  status: string;
  date: string;
  bank: string;
  type: "success" | "warning";
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  status,
  date,
  bank,
  type,
}) => {
  const isSuccess = type === "success";
  return (
    <Card className="border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
      <CardContent className="p-3 flex items-center">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full mr-3 ${
            isSuccess
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {isSuccess ? "check" : "schedule"}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[180px]">
              {title}
            </h5>
            <span
              className={`text-[10px] font-bold uppercase ${
                isSuccess
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {date} • {bank}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Home;
