"use client";

import React from "react";
import { Page } from "@/app/page";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: Page.HOME, label: "Beranda", icon: "home" },
    { id: Page.CONFIRMATION, label: "Konfirmasi", icon: "upload_file" },
    { id: Page.HISTORY, label: "History", icon: "history" },
    { id: Page.PROFILE, label: "Profil", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-20 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto right-0">
      <div className="grid grid-cols-4 h-20 pb-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              activePage === item.id
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-2xl",
                activePage === item.id && "font-[variation-settings:'FILL'1]"
              )}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
