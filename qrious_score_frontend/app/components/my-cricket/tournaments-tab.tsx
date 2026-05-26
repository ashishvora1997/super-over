"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  MapPin,
  CalendarDays,
  ChevronRight,
  Trophy,
} from "lucide-react";

import Link from "next/link";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { TournamentFormModal } from "@/app/components/tournaments/tournament-form-modal";

import { useTournamentStore } from "@/app/store/tournament.store";
import { useAuthStore } from "@/app/store/auth.store";
import { Tournament } from "@/app/types/tournaments.types";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ACCENTS = [
  {
    bar: "from-indigo-500 to-indigo-600",
    icon: "bg-indigo-50 text-indigo-600",
  },
  {
    bar: "from-violet-500 to-violet-600",
    icon: "bg-violet-50 text-violet-600",
  },
  { bar: "from-teal-500 to-teal-600", icon: "bg-teal-50 text-teal-600" },
  {
    bar: "from-orange-400 to-orange-500",
    icon: "bg-orange-50 text-orange-500",
  },
  { bar: "from-rose-500 to-rose-600", icon: "bg-rose-50 text-rose-600" },
  { bar: "from-sky-500 to-sky-600", icon: "bg-sky-50 text-sky-600" },
];

function getAccent(id: number) {
  return ACCENTS[id % ACCENTS.length];
}

export function MyCricketTournamentsTab() {
  const {
    tournaments,
    total,
    page,
    pageSize,
    fetchTournaments,
    deleteTournament,
    loading,
  } = useTournamentStore();

  const user = useAuthStore((state) => state.user);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Tournament | null>(null);

  useEffect(() => {
    fetchTournaments("", 1);
  }, []);

  const myTournaments = tournaments;

  const handleCreate = () => {
    setMode("create");
    setSelectedTournament(null);
    setOpen(true);
  };

  const handleDeleteClick = (t: Tournament) => {
    setToDelete(t);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    await deleteTournament(toDelete.id);
    setDeleteOpen(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {myTournaments.length > 0
            ? `${myTournaments.length} tournament${myTournaments.length !== 1 ? "s" : ""} associated with you`
            : "No tournaments found"}
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create Tournament</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {myTournaments.length === 0 && (
          <div className="col-span-full bg-white border border-border rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-primary/60" />
            </div>
            <p className="font-semibold text-foreground">
              No tournaments found
            </p>
            <p className="text-sm text-muted mt-1.5">
              Create your first tournament to get started
            </p>
            <button
              onClick={handleCreate}
              className="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create Tournament
            </button>
          </div>
        )}

        {!loading &&
          myTournaments.map((tournament: Tournament) => {
            const accent = getAccent(tournament.id);

            return (
              <div
                key={tournament.id}
                className="group bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                <div
                  className={`h-[3px] w-full bg-gradient-to-r ${accent.bar} flex-shrink-0`}
                />

                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="flex-1 flex flex-col p-4 focus:outline-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent.icon}`}
                    >
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="text-[15px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {tournament.name}
                      </h3>
                    </div>
                  </div>

                  <div className="h-px bg-border/60 my-3" />

                  <div className="space-y-2.5">
                    {tournament.city && (
                      <div className="flex items-center gap-2.5 text-muted">
                        <MapPin
                          size={14}
                          className="flex-shrink-0 text-muted/70"
                        />
                        <span className="text-[13px] truncate">
                          {tournament.city}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-muted">
                      <CalendarDays
                        size={14}
                        className="flex-shrink-0 text-muted/70"
                      />
                      <span className="text-[13px]">
                        {formatDate(tournament.start_date)}
                        {tournament.end_date && (
                          <> &mdash; {formatDate(tournament.end_date)}</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-4 text-primary text-[13px] font-semibold">
                    View Details
                    <ChevronRight
                      size={15}
                      className="translate-x-0 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </Link>

                {true && (
                  <div className="flex border-t border-border bg-gray-50/80"></div>
                )}
              </div>
            );
          })}
      </div>

      {!loading && myTournaments.length > 0 && total > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTournaments("", page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-border rounded-xl disabled:opacity-40 bg-white hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => fetchTournaments("", page + 1)}
              disabled={page * pageSize >= total}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <TournamentFormModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        tournament={selectedTournament}
      />
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${toDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
