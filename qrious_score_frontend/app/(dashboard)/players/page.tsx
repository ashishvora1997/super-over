"use client";

import { RoleGuard } from "@/app/components/auth/role-guard";
import { PlayerFormModal } from "@/app/components/players/player-form-modal";
import { Button } from "@/app/components/ui/button";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { Table } from "@/app/components/ui/Table";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useAuthStore } from "@/app/store/auth.store";
import { usePlayerStore } from "@/app/store/players.store";
import { Player } from "@/app/types/players.types";
import { Column } from "@/app/types/table.types";
import { formatRole, toTitleCase } from "@/app/utils/format";
import { hasRole } from "@/app/utils/permissions";
import { Search, UserPlus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlayersPage() {
  const {
    players,
    total,
    page,
    pageSize,
    fetchPlayers,
    loading,
    deletePlayer,
  } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [searchInput, setSearchInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const debouncedSearch = useDebounce(searchInput, 500);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchPlayers("", 1, selectedRole);
  }, []);

  useEffect(() => {
    fetchPlayers(debouncedSearch, 1, selectedRole);
  }, [debouncedSearch, selectedRole]);

  const handleCreate = () => {
    setMode("create");
    setSelectedPlayer(null);
    setOpen(true);
  };

  const handleEdit = (player: Player) => {
    setMode("edit");
    setSelectedPlayer(player);
    setOpen(true);
  };

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;

    try {
      await deletePlayer(playerToDelete.id);
      setDeleteOpen(false);
      setPlayerToDelete(null);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const baseColumns: Column<Player>[] = [
    {
      key: "name",
      title: "Player",
      render: (p) => p.name,
    },
    {
      key: "role",
      title: "Role",
      render: (p) => formatRole(p.role),
    },
    {
      key: "batting_style",
      title: "Batting",
      render: (p) => toTitleCase(p.batting_style),
    },
    {
      key: "bowling_style",
      title: "Bowling",
      render: (p) => toTitleCase(p.bowling_style),
    },
  ];

  const canModify = hasRole(user?.role, ["admin", "scorer"]);

  const columns: Column<Player>[] = canModify
    ? [
        ...baseColumns,
        {
          key: "actions",
          title: "Actions",
          align: "right",
          render: (p) => (
            <div className="flex gap-2 justify-end">
              <button
                className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                onClick={() => handleEdit(p)}
              >
                <Pencil size={16} />
              </button>

              {hasRole(user?.role, ["admin"]) && (
                <button
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                  onClick={() => handleDeleteClick(p)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ),
        },
      ]
    : baseColumns;

  const roles = [
    { label: "All", value: "all" },
    { label: "Batsman", value: "batsman" },
    { label: "Bowler", value: "bowler" },
    { label: "All-Rounder", value: "all_rounder" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Players
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {total} players registered
          </p>
        </div>

        <RoleGuard allowedRoles={["admin", "scorer"]}>
          <Button
            onClick={handleCreate}
            className="inline-flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Player
          </Button>
        </RoleGuard>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm placeholder:text-muted transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => {
              setSelectedRole(r.value);
              fetchPlayers(debouncedSearch, 1, r.value);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              selectedRole === r.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white border-border text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Table<Player>
        data={players}
        columns={columns}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage) =>
          fetchPlayers(debouncedSearch, newPage, selectedRole)
        }
        emptyMessage="No players found"
      />

      <PlayerFormModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        player={selectedPlayer}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Player"
        description={`Are you sure you want to delete "${playerToDelete?.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
}
