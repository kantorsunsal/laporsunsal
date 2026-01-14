"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = "https://laporsunsal-api.kantorsunsal.workers.dev";

interface User {
  id: string;
  nama: string;
  email: string;
  phone: string;
  lembaga: string;
  role: string;
  created: string;
  status: string;
  is_verified?: boolean;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [newUser, setNewUser] = useState({
    nama: "",
    email: "",
    password: "",
    phone: "",
    lembaga: "",
    role: "user",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "get_all_users",
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
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
    fetchUsers();
    // Get current user role
    const adminUser = localStorage.getItem("admin_user");
    if (adminUser) {
      const user = JSON.parse(adminUser);
      setCurrentUserRole(user.role);
    }
  }, [fetchUsers]);

  const handleEditRole = async () => {
    if (!selectedUser || !editRole) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "change_user_role",
          user_id: selectedUser.id,
          new_role: editRole,
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Role berhasil diubah");
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(result.error || "Gagal mengubah role");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "delete_user",
          user_id: selectedUser.id,
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User berhasil dihapus");
        setDeleteDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(result.error || "Gagal menghapus user");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualVerify = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "manual_verify_email",
          user_id: selectedUser.id,
          token: token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Email berhasil diverifikasi");
        setVerifyDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(result.error || "Gagal memverifikasi email");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.nama || !newUser.email || !newUser.password) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "register",
          nama: newUser.nama,
          email: newUser.email.toLowerCase(),
          password: newUser.password,
          phone: newUser.phone,
          lembaga: newUser.lembaga,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // If role is not 'user', update the role
        if (newUser.role !== "user" && result.user?.id) {
          const token = localStorage.getItem("admin_token");
          await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "change_user_role",
              user_id: result.user.id,
              new_role: newUser.role,
              token: token,
            }),
          });
        }

        toast.success("User berhasil ditambahkan");
        setAddDialogOpen(false);
        setNewUser({
          nama: "",
          email: "",
          password: "",
          phone: "",
          lembaga: "",
          role: "user",
        });
        fetchUsers();
      } else {
        toast.error(result.error || "Gagal menambahkan user");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full">
            Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full">
            User
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full">
        Aktif
      </span>
    ) : (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full">
        Nonaktif
      </span>
    );
  };

  const getEmailVerifiedBadge = (
    isVerified: boolean | undefined,
    role: string
  ) => {
    // Admin/Super Admin selalu dianggap terverifikasi
    if (role === "admin" || role === "super_admin") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">verified</span>
          Terverifikasi
        </span>
      );
    }
    return isVerified ? (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">verified</span>
        Terverifikasi
      </span>
    ) : (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 rounded-full inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">pending</span>
        Belum Verifikasi
      </span>
    );
  };

  const filteredUsers = users.filter((u) => {
    // Hide super_admin from admin view (only super_admin can see super_admins)
    if (currentUserRole === "admin" && u.role === "super_admin") {
      return false;
    }
    // Search filter
    return (
      u.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lembaga?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Manajemen User
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola akun pengguna aplikasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <Input
              placeholder="Cari user..."
              className="pl-10 h-10 w-full md:w-64 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            disabled={loading}
            className="shrink-0"
          >
            <span className="material-symbols-outlined">refresh</span>
          </Button>
          {/* Add User Button - Only super_admin */}
          {currentUserRole === "super_admin" && (
            <Button onClick={() => setAddDialogOpen(true)} className="shrink-0">
              <span className="material-symbols-outlined mr-2 text-lg">
                person_add
              </span>
              Tambah User
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">group</span>
          <h2 className="text-lg font-bold">Daftar User</h2>
          <span className="text-sm text-slate-400 ml-2">
            ({filteredUsers.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
              person_off
            </span>
            <p className="text-slate-500">Tidak ada user ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Lembaga
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Terdaftar
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
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
                            {user.nama}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm">{user.lembaga || "-"}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                      {getEmailVerifiedBadge(user.is_verified, user.role)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-500">
                        {formatDate(user.created)}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Verify Email button - Only for super_admin and unverified users */}
                        {currentUserRole === "super_admin" &&
                          user.role === "user" &&
                          !user.is_verified && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setVerifyDialogOpen(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-all"
                              title="Verifikasi Email"
                            >
                              <span className="material-symbols-outlined">
                                verified
                              </span>
                            </button>
                          )}
                        {/* Only super_admin can edit roles */}
                        {currentUserRole === "super_admin" && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditRole(user.role);
                              setEditDialogOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-all"
                            title="Edit Role"
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                        )}
                        {/* Only super_admin can delete, and can't delete self */}
                        {currentUserRole === "super_admin" &&
                          user.role !== "super_admin" && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-all"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined">
                                delete
                              </span>
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-slate-500">User</Label>
              <p className="font-semibold">{selectedUser?.nama}</p>
              <p className="text-sm text-slate-500">{selectedUser?.email}</p>
            </div>
            <div>
              <Label className="mb-2 block">Role Baru</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button onClick={handleEditRole} disabled={processing}>
              {processing ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-400">
              Yakin ingin menghapus user <strong>{selectedUser?.nama}</strong>?
            </p>
            <p className="text-sm text-red-500 mt-2">
              Tindakan ini tidak dapat dibatalkan.
            </p>
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
              onClick={handleDeleteUser}
              disabled={processing}
            >
              {processing ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Nama Lengkap *</Label>
              <Input
                placeholder="Masukkan nama lengkap"
                className="h-11 rounded-lg"
                value={newUser.nama}
                onChange={(e) =>
                  setNewUser({ ...newUser, nama: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-2 block">Email *</Label>
              <Input
                type="email"
                placeholder="contoh@email.com"
                className="h-11 rounded-lg"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-2 block">Password *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                className="h-11 rounded-lg"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">No. HP</Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  className="h-11 rounded-lg"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">Lembaga</Label>
                <Input
                  placeholder="Nama lembaga"
                  className="h-11 rounded-lg"
                  value={newUser.lembaga}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lembaga: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewUser({
                  nama: "",
                  email: "",
                  password: "",
                  phone: "",
                  lembaga: "",
                  role: "user",
                });
              }}
              disabled={processing}
            >
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={processing}>
              {processing ? "Menyimpan..." : "Tambah User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Email Confirmation Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Email Manual</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-400">
              Verifikasi email untuk user <strong>{selectedUser?.nama}</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Email: <strong>{selectedUser?.email}</strong>
            </p>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-500/20">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <span className="material-symbols-outlined text-sm align-middle mr-1">
                  info
                </span>
                Gunakan fitur ini jika user tidak dapat menerima email
                verifikasi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleManualVerify}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? "Memverifikasi..." : "Verifikasi Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
