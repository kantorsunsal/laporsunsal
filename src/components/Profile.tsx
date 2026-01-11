"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ProfileDetailDialog from "./ProfileDetailDialog";
import SantriDialog from "./SantriDialog";

interface User {
  id: string;
  nama: string;
  email: string;
  phone?: string;
  lembaga?: string;
  photo_url?: string;
}

interface ProfileProps {
  onBack: () => void;
  user?: User | null;
  onLogout?: () => void;
  onUserUpdate?: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onUserUpdate }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSantriDialog, setShowSantriDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const handleMenuClick = (menu: string) => {
    switch (menu) {
      case "detail_profil":
        setShowProfileDialog(true);
        break;
      case "ubah_password":
        setShowPasswordDialog(true);
        break;
      case "data_santri":
        setShowSantriDialog(true);
        break;
      case "bahasa":
        // TODO: Language settings
        break;
      case "pusat_bantuan":
        window.open("https://wa.me/6281234567890", "_blank");
        break;
      case "ketentuan_layanan":
        // TODO: Terms of service
        break;
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom duration-300">
      {/* Profile Header */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-xl mb-4">
            <AvatarImage
              src={
                user?.photo_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${
                  user?.nama || "User"
                }`
              }
              alt={user?.nama || "User"}
            />
            <AvatarFallback className="text-2xl">
              {user ? getInitials(user.nama) : "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            onClick={() => setShowProfileDialog(true)}
            className="absolute bottom-2 right-0 h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </Button>
        </div>
        <h2 className="text-xl font-bold">{user?.nama || "Pengguna"}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user?.email || "email@example.com"}
        </p>
        {user?.lembaga && user.lembaga !== "-" && (
          <Badge variant="secondary" className="mt-2">
            {user.lembaga}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              Status Akun
            </p>
            <p className="font-bold text-green-600">Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              ID User
            </p>
            <p className="font-bold text-xs">{user?.id?.slice(-8) || "-"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Menus */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <ProfileMenuItem
            icon="person"
            label="Detail Profil"
            onClick={() => handleMenuClick("detail_profil")}
          />
          <ProfileMenuItem
            icon="lock"
            label="Ubah Kata Sandi"
            onClick={() => handleMenuClick("ubah_password")}
          />
          <ProfileMenuItem
            icon="school"
            label="Data Santri"
            onClick={() => handleMenuClick("data_santri")}
          />
          <ProfileMenuItem
            icon="language"
            label="Bahasa"
            badge="ID"
            onClick={() => handleMenuClick("bahasa")}
          />
          <ProfileMenuItem
            icon="help_outline"
            label="Pusat Bantuan"
            onClick={() => handleMenuClick("pusat_bantuan")}
          />
          <ProfileMenuItem
            icon="description"
            label="Ketentuan Layanan"
            onClick={() => handleMenuClick("ketentuan_layanan")}
            isLast
          />
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={onLogout}
        className="w-full mt-10 h-14 rounded-2xl text-red-500 border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 font-bold gap-2"
      >
        <span className="material-symbols-outlined">logout</span>
        Keluar Akun
      </Button>

      <div className="py-8 text-center">
        <p className="text-[10px] text-slate-400">
          Versi Aplikasi 3.0.0-stable (Next.js 16)
        </p>
      </div>

      {/* Dialogs */}
      {user && (
        <>
          <ChangePasswordDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            userId={user.id}
          />
          <ProfileDetailDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
            user={user}
            onProfileUpdate={handleProfileUpdate}
          />
          <SantriDialog
            open={showSantriDialog}
            onOpenChange={setShowSantriDialog}
            userId={user.id}
          />
        </>
      )}
    </div>
  );
};

interface MenuItemProps {
  icon: string;
  label: string;
  badge?: string;
  isLast?: boolean;
  onClick?: () => void;
}

const ProfileMenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  badge,
  isLast,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group ${
      !isLast ? "border-b border-slate-100 dark:border-slate-800" : ""
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {badge}
        </span>
      )}
      <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:translate-x-0.5 transition-transform">
        chevron_right
      </span>
    </div>
  </div>
);

export default Profile;
