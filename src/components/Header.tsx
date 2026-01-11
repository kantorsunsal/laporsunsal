"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  nama: string;
  email: string;
  phone?: string;
  lembaga?: string;
  photo_url?: string;
}

interface HeaderProps {
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-6 py-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
          <AvatarImage
            src={
              user?.photo_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${
                user?.nama || "User"
              }`
            }
            alt={user?.nama || "User"}
          />
          <AvatarFallback>{user ? getInitials(user.nama) : "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {getGreeting()},
          </span>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {user?.nama || "Pengguna"}
          </h1>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full text-slate-600 dark:text-slate-300"
      >
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
      </Button>
    </header>
  );
};

export default Header;
