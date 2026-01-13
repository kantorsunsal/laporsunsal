"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  nama: string;
  email: string;
  role: string;
  photo_url?: string;
}

interface AdminSidebarProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const menuItems = [
  {
    label: "Verifikasi Pembayaran",
    icon: "payments",
    href: "/dashboard",
  },
  {
    label: "Manajemen User",
    icon: "manage_accounts",
    href: "/dashboard/users",
  },
  {
    label: "Pengaturan",
    icon: "settings",
    href: "/dashboard/settings",
    superAdminOnly: true,
  },
  {
    label: "System Logs",
    icon: "history",
    href: "/dashboard/logs",
  },
];

export default function AdminSidebar({
  user,
  isOpen,
  onClose,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const handleToggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <aside
      className={cn(
        "w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col sticky top-0 h-screen z-50 transition-transform duration-300",
        // Desktop: always visible
        "hidden lg:flex",
        // Mobile: slide in/out
        isOpen && "fixed inset-y-0 left-0 flex lg:relative"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <span className="material-symbols-outlined text-white">
            verified_user
          </span>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">
            LaporSunsal
          </span>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Admin Panel
          </p>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
        >
          <span className="material-symbols-outlined text-slate-400">
            close
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
          Menu Utama
        </p>

        {menuItems.map((item) => {
          // Hide super admin only items for regular admins
          if (item.superAdminOnly && user.role !== "super_admin") {
            return null;
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-xl",
                  !isActive &&
                    "text-slate-400 group-hover:text-blue-600 transition-colors"
                )}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Dark mode toggle */}
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleToggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 w-full group"
          >
            <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-blue-600 transition-colors">
              dark_mode
            </span>
            <span className="font-medium text-sm">Toggle Dark Mode</span>
          </button>
        </div>
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          {user.photo_url ? (
            <Image
              src={user.photo_url}
              alt={user.nama}
              width={40}
              height={40}
              className="rounded-full border border-white dark:border-slate-800 shadow-sm object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">
                person
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.nama}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
