"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { useMatchStore } from "@/app/store/matches.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import { Match, MatchStatus } from "@/app/types/match.types";
import toast from "react-hot-toast";
import { CalendarDays, MapPin, Trophy, Swords } from "lucide-react";
import { getErrorMessage } from "@/app/utils/error-handler";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  match?: Match | null;
}

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
];

const EMPTY_FORM = {
  tournament_id: "" as number | "",
  team_a_id: "" as number | "",
  team_b_id: "" as number | "",
  match_date: "",
  venue: "",
  status: "scheduled" as MatchStatus,
  winner_team_id: "" as number | "",
};

export function MatchFormModal({ open, onClose, mode, match }: Props) {
  const { createMatch, updateMatch } = useMatchStore();
  const { tournaments, fetchTournaments } = useTournamentStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchTournaments("", 1);
  }, [open]);

  useEffect(() => {
    if (mode === "edit" && match) {
      setForm({
        tournament_id: match.tournament_id ?? "",
        team_a_id: match.team_a_id ?? "",
        team_b_id: match.team_b_id ?? "",
        match_date: match.match_date?.slice(0, 16) ?? "",
        venue: match.venue ?? "",
        status: match.status ?? "scheduled",
        winner_team_id: match.winner_team_id ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mode, match, open]);

  const set = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedTournament = tournaments.find(
    (t) => t.id === Number(form.tournament_id),
  );
  const tournamentTeams = selectedTournament?.teams ?? [];

  const winnerOptions = tournamentTeams.filter(
    (t) => t.id === Number(form.team_a_id) || t.id === Number(form.team_b_id),
  );

  const handleSubmit = async () => {
    if (!form.tournament_id) return toast.error("Select a tournament");
    if (!form.team_a_id) return toast.error("Select Team A");
    if (!form.team_b_id) return toast.error("Select Team B");
    if (Number(form.team_a_id) === Number(form.team_b_id))
      return toast.error("Both teams cannot be the same");
    if (!form.match_date) return toast.error("Match date is required");

    if (mode === "edit" && form.status === "completed" && !form.winner_team_id)
      return toast.error("Select a winner for completed match");

    try {
      setLoading(true);

      if (mode === "create") {
        await createMatch({
          tournament_id: Number(form.tournament_id),
          team_a_id: Number(form.team_a_id),
          team_b_id: Number(form.team_b_id),
          match_date: form.match_date,
          venue: form.venue,
        });
        toast.success("Match created successfully!");
      } else if (mode === "edit" && match?.id) {
        await updateMatch({
          id: match.id,
          team_a_id: Number(form.team_a_id),
          team_b_id: Number(form.team_b_id),
          match_date: form.match_date,
          venue: form.venue,
          status: form.status,
          ...(form.status === "completed" && form.winner_team_id
            ? { winner_team_id: Number(form.winner_team_id) }
            : {}),
        });
        toast.success("Match updated successfully!");
      }

      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Schedule Match" : "Edit Match"}
      onSubmit={handleSubmit}
      submitText={mode === "create" ? "Schedule Match" : "Save Changes"}
      loading={loading}
    >
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Tournament
        </label>
        <div className="relative">
          <Trophy
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <select
            value={form.tournament_id}
            onChange={(e) => {
              set(
                "tournament_id",
                e.target.value ? Number(e.target.value) : "",
              );
              set("team_a_id", "");
              set("team_b_id", "");
              set("winner_team_id", "");
            }}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none"
          >
            <option value="">Select tournament...</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Swords size={11} />
          Teams
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold text-muted mb-1 uppercase tracking-wider">
              Team A
            </p>
            <select
              value={form.team_a_id}
              onChange={(e) =>
                set("team_a_id", e.target.value ? Number(e.target.value) : "")
              }
              disabled={!form.tournament_id}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select...</option>
              {tournamentTeams
                .filter((t) => t.id !== Number(form.team_b_id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted mb-1 uppercase tracking-wider">
              Team B
            </p>
            <select
              value={form.team_b_id}
              onChange={(e) =>
                set("team_b_id", e.target.value ? Number(e.target.value) : "")
              }
              disabled={!form.tournament_id}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select...</option>
              {tournamentTeams
                .filter((t) => t.id !== Number(form.team_a_id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Date & Time
          </label>
          <div className="relative">
            <CalendarDays
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="datetime-local"
              value={form.match_date}
              onChange={(e) => set("match_date", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Venue
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="e.g. Wankhede"
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Status
        </label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                set("status", opt.value);
                if (opt.value !== "completed") set("winner_team_id", "");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                form.status === opt.value
                  ? opt.value === "scheduled"
                    ? "bg-blue-600 text-white border-blue-600"
                    : opt.value === "live"
                      ? "bg-accent text-white border-accent"
                      : "bg-gray-600 text-white border-gray-600"
                  : "bg-white text-muted border-border hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {form.status === "completed" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Winner
          </label>
          <div className="grid grid-cols-2 gap-2">
            {winnerOptions.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => set("winner_team_id", team.id)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                  Number(form.winner_team_id) === team.id
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-white text-foreground border-border hover:border-accent/40"
                }`}
              >
                🏆 {team.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </FormModal>
  );
}
