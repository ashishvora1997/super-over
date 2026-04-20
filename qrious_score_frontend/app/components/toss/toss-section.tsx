"use client";

import { useState } from "react";
import { Coins, ChevronDown } from "lucide-react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { RoleGuard } from "@/app/components/auth/role-guard";
import { Match } from "@/app/types/match.types";

import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { useTossStore } from "@/app/store/toss.store";
import { CreateTossPayload, TossElection } from "@/app/types/toss.types";

interface Props {
  match: Match;
}

export function TossSection({ match }: Props) {
  const { toss, recordToss } = useTossStore();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [winnerId, setWinnerId] = useState<number | "">("");
  const [elected, setElected] = useState<TossElection>("bat");

  const teams = [
    { id: match.team_a_id, name: match.teamA?.name ?? "Team A" },
    { id: match.team_b_id, name: match.teamB?.name ?? "Team B" },
  ];

  const handleSubmit = async () => {
    if (!winnerId) return toast.error("Select toss winner");
    try {
      setLoading(true);
      const payload: CreateTossPayload = {
        toss_winner_team_id: Number(winnerId),
        elected_to: elected,
      };
      await recordToss(match.id, payload);
      toast.success("Toss recorded!");
      setOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (toss) {
    const electedLabel = toss.elected_to === "bat" ? "Bat" : "Bowl";
    const otherTeam = teams.find((t) => t.id !== toss.toss_winner_team_id);

    return (
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
            <Coins size={14} className="text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Toss</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Winner</p>
            <p className="text-sm font-bold text-foreground truncate">
              {toss.tossWinnerTeam?.name ?? "—"}
            </p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Elected to</p>
            <p className="text-sm font-bold text-accent-dark">
              {electedLabel} first
            </p>
          </div>
          {otherTeam && (
            <>
              <div className="w-px h-10 bg-border" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted">{otherTeam.name}</p>
                <p className="text-sm font-bold text-foreground">
                  {toss.elected_to === "bat" ? "Bowl" : "Bat"} first
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-dashed border-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <Coins size={14} className="text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Toss</p>
              <p className="text-xs text-muted">Not recorded yet</p>
            </div>
          </div>
          <RoleGuard allowedRoles={["admin", "scorer"]}>
            {match.status !== "completed" && (
              <button
                onClick={() => setOpen(true)}
                className="px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-sm shadow-primary/25 transition-all active:scale-95 hover:bg-primary-dark"
              >
                Record Toss
              </button>
            )}
          </RoleGuard>
        </div>
      </div>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Toss"
        onSubmit={handleSubmit}
        submitText="Save Toss"
        loading={loading}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Toss Winner
          </label>
          <div className="relative">
            <select
              value={winnerId}
              onChange={(e) =>
                setWinnerId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none"
            >
              <option value="">Select team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Elected to
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["bat", "bowl"] as TossElection[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setElected(opt)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                  elected === opt
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                    : "bg-white text-muted border-border hover:border-primary/40"
                }`}
              >
                {opt} first
              </button>
            ))}
          </div>
        </div>
      </FormModal>
    </>
  );
}
