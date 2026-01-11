"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";

interface AdminUser {
  id: string;
  nama: string;
  email: string;
  role: string;
  photo_url?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Public pages that don't require auth
    const publicPaths = [
      "/dashboard/login",
      "/dashboard/forgot-password",
      "/dashboard/reset-password",
    ];

    // Skip auth check for public pages
    if (publicPaths.includes(pathname)) {
      setLoading(false);
      return;
    }

    // Check for admin user in localStorage
    const savedUser = localStorage.getItem("admin_user");
    const token = localStorage.getItem("admin_token");

    if (!savedUser || !token) {
      router.replace("/dashboard/login");
      return;
    }

    try {
      const userData = JSON.parse(savedUser) as AdminUser;

      // Verify user has admin role
      if (userData.role !== "admin" && userData.role !== "super_admin") {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
        router.replace("/dashboard/login");
        return;
      }

      setUser(userData);
    } catch {
      router.replace("/dashboard/login");
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
    router.replace("/dashboard/login");
  };

  // Show public pages (login, forgot-password, reset-password) without sidebar layout
  const publicPages = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
  ];

  if (publicPages.includes(pathname)) {
    return (
      <>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 flex items-center lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="ml-3 font-bold text-lg">LaporSunsal Admin</span>
        </header>

        {/* Page content */}
        <div className="flex-1">{children}</div>
      </main>

      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
