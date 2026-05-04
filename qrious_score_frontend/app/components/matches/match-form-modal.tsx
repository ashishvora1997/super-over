"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { useMatchStore } from "@/app/store/matches.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import {
  Match,
  MatchStatus,
  UpdateMatchPayload,
} from "@/app/types/match.types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Swords } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  match?: Match | null;
}

const getStatusOptions = (mode: "create" | "edit") => {
  const options: { value: MatchStatus; label: string }[] = [
    { value: "scheduled", label: "Scheduled" },
    { value: "live", label: "Live" },
  ];
  if (mode === "edit") {
    options.push({ value: "completed", label: "Completed" });
  }
  return options;
};

const EMPTY_FORM = {
  tournament_id: "" as number | "",
  team_a_id: "" as number | "",
  team_b_id: "" as number | "",
  match_date: "",
  venue: "",
  overs_per_side: 20 as number,
  status: "scheduled" as MatchStatus,
  winner_team_id: "" as number | "",
};

export function MatchFormModal({ open, onClose, mode, match }: Props) {
  const { createMatch, updateMatch } = useMatchStore();
  const { tournaments, fetchTournaments } = useTournamentStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        overs_per_side: match.overs_per_side ?? 20,
        status: match.status ?? "scheduled",
        winner_team_id: match.winner_team_id ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [mode, match, open]);

  const set = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const availableTournaments =
    mode === "create"
      ? tournaments.filter((t) => t.status === "ongoing")
      : tournaments;

  const selectedTournament = availableTournaments.find(
    (t) => t.id === Number(form.tournament_id),
  );
  const tournamentTeams = selectedTournament?.teams ?? [];

  const winnerOptions = tournamentTeams.filter(
    (t) => t.id === Number(form.team_a_id) || t.id === Number(form.team_b_id),
  );

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.tournament_id) newErrors.tournament_id = "Select a tournament";
    if (!form.team_a_id) newErrors.team_a_id = "Select Team A";
    if (!form.team_b_id) newErrors.team_b_id = "Select Team B";
    if (
      form.team_a_id &&
      form.team_b_id &&
      Number(form.team_a_id) === Number(form.team_b_id)
    )
      newErrors.team_b_id = "Both teams cannot be the same";
    if (!form.match_date) newErrors.match_date = "Match date is required";

    if (form.match_date && selectedTournament) {
      const matchDate = new Date(form.match_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (matchDate < today) {
        newErrors.match_date = "Match date cannot be in the past";
      }

      if (selectedTournament.start_date && selectedTournament.end_date) {
        const tournamentStart = new Date(selectedTournament.start_date);
        const tournamentEnd = new Date(selectedTournament.end_date);

        if (matchDate < tournamentStart) {
          newErrors.match_date = `Match date must be on or after ${tournamentStart.toLocaleDateString()}`;
        } else if (matchDate > tournamentEnd) {
          newErrors.match_date = `Match date must be on or before ${tournamentEnd.toLocaleDateString()}`;
        }
      }
    }

    if (mode === "edit" && form.status === "completed" && !form.winner_team_id)
      newErrors.winner_team_id = "Select a winner for completed match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      if (mode === "create") {
        await createMatch({
          tournament_id: Number(form.tournament_id),
          team_a_id: Number(form.team_a_id),
          team_b_id: Number(form.team_b_id),
          match_date: form.match_date,
          venue: form.venue,
          overs_per_side: Number(form.overs_per_side),
        });
        toast.success("Match created successfully!");
      } else if (mode === "edit" && match?.id) {
        const payload: UpdateMatchPayload = { id: match.id };
        if (form.match_date !== match.match_date)
          payload.match_date = form.match_date;
        if (form.venue !== match.venue) payload.venue = form.venue;
        if (form.status !== match.status) payload.status = form.status;
        if (form.status !== "completed") {
          if (form.team_a_id !== match.team_a_id)
            payload.team_a_id = Number(form.team_a_id);
          if (form.team_b_id !== match.team_b_id)
            payload.team_b_id = Number(form.team_b_id);
        }
        if (form.status === "completed") {
          payload.winner_team_id = Number(form.winner_team_id);
        }
        await updateMatch(payload);
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
      <Select
        label="Tournament"
        required
        value={String(form.tournament_id)}
        onChange={(val) => {
          set("tournament_id", val ? Number(val) : "");
          set("team_a_id", "");
          set("team_b_id", "");
          set("winner_team_id", "");
        }}
        placeholder="Select tournament..."
        options={availableTournaments.map((t) => ({
          label: t.name,
          value: String(t.id),
        }))}
        error={errors.tournament_id}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <Swords size={13} />
            Teams
            <span className="text-destructive ml-0.5">*</span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            placeholder="Team A"
            value={String(form.team_a_id)}
            onChange={(val) => set("team_a_id", val ? Number(val) : "")}
            options={tournamentTeams
              .filter((t) => t.id !== Number(form.team_b_id))
              .map((t) => ({ label: t.name, value: String(t.id) }))}
            error={errors.team_a_id}
          />
          <Select
            placeholder="Team B"
            value={String(form.team_b_id)}
            onChange={(val) => set("team_b_id", val ? Number(val) : "")}
            options={tournamentTeams
              .filter((t) => t.id !== Number(form.team_a_id))
              .map((t) => ({ label: t.name, value: String(t.id) }))}
            error={errors.team_b_id}
          />
        </div>
      </div>

      <Input
        label="Date & Time"
        required
        type="datetime-local"
        value={form.match_date}
        min={new Date().toISOString().slice(0, 16)}
        max={
          selectedTournament?.end_date
            ? new Date(selectedTournament.end_date).toISOString().slice(0, 16)
            : undefined
        }
        onChange={(e) => set("match_date", e.target.value)}
        error={errors.match_date}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Overs / Innings"
          required
          type="number"
          min={1}
          max={50}
          value={form.overs_per_side}
          onChange={(e) => set("overs_per_side", Number(e.target.value) || 20)}
          error={errors.overs_per_side}
          disabled={mode === "edit" && match?.status !== "scheduled"}
        />
        <Input
          label="Venue"
          value={form.venue}
          onChange={(e) => set("venue", e.target.value)}
          placeholder="e.g. Wankhede"
          error={errors.venue}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-muted">
          Status <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          {getStatusOptions(mode).map((opt) => (
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
          <label className="block text-sm font-medium text-muted">
            Winner <span className="text-destructive">*</span>
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
                    : errors.winner_team_id
                      ? "border-destructive text-foreground bg-white"
                      : "border-border text-foreground bg-white hover:border-accent/40"
                }`}
              >
                🏆 {team.name}
              </button>
            ))}
          </div>
          {errors.winner_team_id && (
            <p className="text-sm text-destructive mt-1">
              {errors.winner_team_id}
            </p>
          )}
        </div>
      )}
    </FormModal>
  );
}
