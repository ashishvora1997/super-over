"use client";

import { useEffect } from "react";
import { useUserStore } from "@/app/store/users.store";
import { Table } from "@/app/components/ui/Table";
import { Column } from "@/app/types/table.types";
import { User } from "@/app/types/users.types";
import { useAuthStore } from "@/app/store/auth.store";
import toast from "react-hot-toast";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function UsersPage() {
  const { users, total, loading, page, pageSize, fetchUsers, updateUserRole } =
    useUserStore();

  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleRoleChange = async (
    userId: number,
    role: "viewer" | "scorer",
  ) => {
    try {
      await updateUserRole(userId, role);
      toast.success("Role updated successfully");
    } catch (err: unknown) {
      toast.error("Failed to update role");
    }
  };

  const renderRole = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      scorer: "bg-blue-100 text-blue-700 border-blue-200",
      viewer: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
          styles[role as keyof typeof styles]
        }`}
      >
        {role}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      title: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {u.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{u.name}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (u) => renderRole(u.role),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (u) => {
        if (u.role === "admin") return null;
        if (u.id === currentUser?.id) return null;

        return (
          <div className="flex gap-2 justify-end">
            {u.role === "viewer" && (
              <button
                onClick={() => handleRoleChange(u.id, "scorer")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition"
              >
                <ArrowUpCircle size={13} />
                Make Scorer
              </button>
            )}

            {u.role === "scorer" && (
              <button
                onClick={() => handleRoleChange(u.id, "viewer")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                <ArrowDownCircle size={13} />
                Make Viewer
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted">Manage user roles and permissions</p>
      </div>

      <Table<User>
        data={users}
        columns={columns}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => fetchUsers(p)}
        emptyMessage="No users found"
      />
    </div>
  );
}
