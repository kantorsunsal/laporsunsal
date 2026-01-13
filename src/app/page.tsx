"use client";

import React, { useState, useSyncExternalStore } from "react";
import Home from "@/components/Home";
import ConfirmationForm from "@/components/ConfirmationForm";
import History from "@/components/History";
import Profile from "@/components/Profile";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Toaster } from "@/components/ui/sonner";

export enum Page {
  HOME = "home",
  BILL = "bill",
  MESSAGE = "message",
  PROFILE = "profile",
  CONFIRMATION = "confirmation",
  HISTORY = "history",
}

interface User {
  id: string;
  nama: string;
  email: string;
  phone?: string;
  lembaga?: string;
  photo_url?: string;
}

// Hydration detection using useSyncExternalStore (React-recommended pattern)
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}

export default function MainApp() {
  const isHydrated = useIsHydrated();
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("auth_token");
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage(Page.HOME);
  };

  // Loading state - wait for hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan form auth
  if (!isAuthenticated) {
    return (
      <>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.HOME:
        return <Home onNavigate={(page) => setCurrentPage(page as Page)} />;
      case Page.CONFIRMATION:
        return <ConfirmationForm onBack={() => setCurrentPage(Page.HOME)} />;
      case Page.HISTORY:
        return <History onBack={() => setCurrentPage(Page.HOME)} />;
      case Page.PROFILE:
        return (
          <Profile
            onBack={() => setCurrentPage(Page.HOME)}
            user={user}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
          />
        );
      default:
        return <Home onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-white dark:bg-slate-950">
      <Header user={user} />
      <main className="flex-1 overflow-y-auto px-6 py-2 pb-24 no-scrollbar">
        {renderContent()}
      </main>
      <BottomNav
        activePage={currentPage}
        onNavigate={(page) => setCurrentPage(page as Page)}
      />
      <Toaster position="top-center" />
    </div>
  );
}
