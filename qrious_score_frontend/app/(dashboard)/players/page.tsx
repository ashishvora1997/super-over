"use client";

import { PlayerFormModal } from "@/app/components/players/player-form-modal";
import { Button } from "@/app/components/ui/button";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { Table } from "@/app/components/ui/Table";
import { useDebounce } from "@/app/hooks/useDebounce";
import { usePlayerStore } from "@/app/store/players.store";
import { formatRole, toTitleCase } from "@/app/utils/format";
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
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<any>(null);

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchPlayers("", 1, "all");
  }, []);

  useEffect(() => {
    fetchPlayers(debouncedSearch, 1, selectedRole);
  }, [debouncedSearch]);

  const handleCreate = () => {
    setMode("create");
    setSelectedPlayer(null);
    setOpen(true);
  };

  const handleEdit = (player: any) => {
    setMode("edit");
    setSelectedPlayer(player);
    setOpen(true);
  };

  const handleDeleteClick = (player: any) => {
    setPlayerToDelete(player);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;

    try {
      await deletePlayer(playerToDelete.id);
      setDeleteOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      key: "name",
      title: "Player",
      render: (p) => p.name,
    },
    {
      key: "role",
      title: "Role",
      render: (p) => (
        <span className="text-xs font-semibold px-2 py-1 rounded-lg border border-border text-muted">
          {formatRole(p.role)}
        </span>
      ),
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
    {
      key: "actions",
      align: "right",
      title: "Actions",
      render: (p) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleEdit(p)}
            className="p-2 rounded-lg hover:bg-primary/10 text-primary"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => handleDeleteClick(p)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const roles = [
    { label: "All", value: "all" },
    { label: "Batsman", value: "batsman" },
    { label: "Bowler", value: "bowler" },
    { label: "All-Rounder", value: "all_rounder" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Players
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {total} players registered
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="inline-flex items-center gap-2"
        >
          <UserPlus size={16} />
          Add Player
        </Button>
      </div>

      {/* Search & Filter */}
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
            placeholder="Search by name, team or role..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm placeholder:text-muted transition-all"
          />
        </div>
      </div>

      {/* Role filter pills */}
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

      <Table
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
