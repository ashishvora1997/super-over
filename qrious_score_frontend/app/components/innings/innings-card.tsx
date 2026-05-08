"use client";

import { useState } from "react";
import { Users, Play, RefreshCw } from "lucide-react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Select } from "@/app/components/ui/select";
import { RoleGuard } from "@/app/components/auth/role-guard";
import { Match } from "@/app/types/match.types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import {
  Innings,
  StartInningsPayload,
  UpdateInningsPlayersPayload,
} from "@/app/types/innings.types";
import { useInningsStore } from "@/app/store/innings.store";

interface TeamPlayer {
  id: number;
  name: string;
}

interface Props {
  innings: Innings;
  match: Match;
  battingPlayers: TeamPlayer[];
  bowlingPlayers: TeamPlayer[];
}

const STATUS_CONFIG: Record<
  Innings["status"],
  { label: string; cls: string; dot: string }
> = {
  not_started: {
    label: "Not started",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  in_progress: {
    label: "In progress",
    cls: "bg-accent/10 text-accent-dark border-accent/30",
    dot: "bg-accent animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
};

function InningsStatusBadge({ status }: { status: Innings["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StartInningsModal({
  open,
  onClose,
  innings,
  battingPlayers,
  bowlingPlayers,
  matchId,
}: {
  open: boolean;
  onClose: () => void;
  innings: Innings;
  battingPlayers: TeamPlayer[];
  bowlingPlayers: TeamPlayer[];
  matchId: number;
}) {
  const { startInnings } = useInningsStore();
  const [loading, setLoading] = useState(false);
  const [strikerId, setStrikerId] = useState<number | "">("");
  const [nonStrikerId, setNonStrikerId] = useState<number | "">("");
  const [bowlerId, setBowlerId] = useState<number | "">("");

  const handleSubmit = async () => {
    if (!strikerId) return toast.error("Select striker");
    if (!nonStrikerId) return toast.error("Select non-striker");
    if (!bowlerId) return toast.error("Select bowler");
    if (strikerId === nonStrikerId)
      return toast.error("Striker and non-striker must be different players");

    try {
      setLoading(true);
      const payload: StartInningsPayload = {
        striker_id: Number(strikerId),
        non_striker_id: Number(nonStrikerId),
        bowler_id: Number(bowlerId),
      };
      await startInnings(innings.id, payload, matchId);
      toast.success(`Innings ${innings.innings_number} started!`);
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const availableNonStrikers = battingPlayers.filter(
    (p) => p.id !== Number(strikerId),
  );
  const availableStrikers = battingPlayers.filter(
    (p) => p.id !== Number(nonStrikerId),
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Start Innings ${innings.innings_number}`}
      onSubmit={handleSubmit}
      submitText="Start Innings"
      loading={loading}
    >
      <div className="bg-gray-50 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Batting
          </p>
          <p className="text-sm font-bold text-foreground">
            {innings.battingTeam?.name ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Bowling
          </p>
          <p className="text-sm font-bold text-foreground">
            {innings.bowlingTeam?.name ?? "—"}
          </p>
        </div>
      </div>

      <Select
        label="Striker (on strike)"
        value={String(strikerId)}
        onChange={(val) => setStrikerId(val ? Number(val) : "")}
        placeholder="Select batsman..."
        options={availableStrikers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />

      <Select
        label="Non-striker"
        value={String(nonStrikerId)}
        onChange={(val) => setNonStrikerId(val ? Number(val) : "")}
        placeholder="Select batsman..."
        options={availableNonStrikers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />

      <Select
        label="Opening bowler"
        value={String(bowlerId)}
        onChange={(val) => setBowlerId(val ? Number(val) : "")}
        placeholder="Select bowler..."
        options={bowlingPlayers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />
    </FormModal>
  );
}

function UpdatePlayersModal({
  open,
  onClose,
  innings,
  battingPlayers,
  bowlingPlayers,
  matchId,
}: {
  open: boolean;
  onClose: () => void;
  innings: Innings;
  battingPlayers: TeamPlayer[];
  bowlingPlayers: TeamPlayer[];
  matchId: number;
}) {
  const { updateInningsPlayers } = useInningsStore();
  const [loading, setLoading] = useState(false);
  const [strikerId, setStrikerId] = useState<number | "">(
    innings.striker_id ?? "",
  );
  const [nonStrikerId, setNonStrikerId] = useState<number | "">(
    innings.non_striker_id ?? "",
  );
  const [bowlerId, setBowlerId] = useState<number | "">(
    innings.bowler_id ?? "",
  );

  const handleSubmit = async () => {
    if (Number(strikerId) === Number(nonStrikerId))
      return toast.error("Striker and non-striker must be different players");
    try {
      setLoading(true);
      const payload: UpdateInningsPlayersPayload = {};
      if (strikerId) payload.striker_id = Number(strikerId);
      if (nonStrikerId) payload.non_striker_id = Number(nonStrikerId);
      if (bowlerId) payload.bowler_id = Number(bowlerId);

      await updateInningsPlayers(innings.id, payload, matchId);
      toast.success("Players updated!");
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const availableNonStrikers = battingPlayers.filter(
    (p) => p.id !== Number(strikerId),
  );
  const availableStrikers = battingPlayers.filter(
    (p) => p.id !== Number(nonStrikerId),
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Update Players"
      onSubmit={handleSubmit}
      submitText="Update"
      loading={loading}
    >
      <Select
        label="Striker"
        value={String(strikerId)}
        onChange={(val) => setStrikerId(val ? Number(val) : "")}
        placeholder="Keep current"
        options={availableStrikers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />

      <Select
        label="Non-striker"
        value={String(nonStrikerId)}
        onChange={(val) => setNonStrikerId(val ? Number(val) : "")}
        placeholder="Keep current"
        options={availableNonStrikers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />

      <Select
        label="Current bowler"
        value={String(bowlerId)}
        onChange={(val) => setBowlerId(val ? Number(val) : "")}
        placeholder="Keep current"
        options={bowlingPlayers.map((p) => ({ label: p.name, value: String(p.id) }))}
      />
    </FormModal>
  );
}

function ScoreRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold text-foreground leading-none">
        {value}
      </span>
      <span className="text-[10px] text-muted mt-0.5">{label}</span>
    </div>
  );
}

export function InningsCard({
  innings,
  match,
  battingPlayers,
  bowlingPlayers,
}: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  const oversDisplay =
    innings.balls > 0
      ? `${innings.overs}.${innings.balls}`
      : innings.overs.toString();

  return (
    <>
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Innings {innings.innings_number}
            </span>
            <InningsStatusBadge status={innings.status} />
          </div>

          <RoleGuard allowedRoles={["admin", "scorer"]}>
            {innings.status === "not_started" && (
              <button
                onClick={() => setStartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg shadow-sm shadow-accent/25 hover:bg-accent-dark transition-all active:scale-95"
              >
                <Play size={11} />
                Start
              </button>
            )}
            {innings.status === "in_progress" && (
              <button
                onClick={() => setUpdateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-all"
              >
                <RefreshCw size={11} />
                Change players
              </button>
            )}
          </RoleGuard>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider">
              Batting
            </p>
            <p className="text-sm font-bold text-foreground">
              {innings.battingTeam?.name ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider">
              Bowling
            </p>
            <p className="text-sm font-bold text-foreground">
              {innings.bowlingTeam?.name ?? "—"}
            </p>
          </div>
        </div>

        {innings.status !== "not_started" && (
          <>
            <div className="mx-4 border-t border-border/60" />
            <div className="px-4 py-3 flex items-center justify-around">
              <ScoreRow
                label="Score"
                value={`${innings.total_runs}/${innings.wickets}`}
              />
              <div className="w-px h-8 bg-border" />
              <ScoreRow label="Overs" value={oversDisplay} />
              {innings.striker && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-foreground leading-none truncate max-w-[80px]">
                      {innings.striker.name}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      Striker
                    </span>
                  </div>
                </>
              )}
              {innings.bowler && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-foreground leading-none truncate max-w-[80px]">
                      {innings.bowler.name}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      Bowler
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {innings.status === "in_progress" && innings.nonStriker && (
          <div className="mx-4 mb-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <Users size={12} className="text-muted flex-shrink-0" />
            <p className="text-xs text-muted">
              Non-striker:{" "}
              <span className="font-semibold text-foreground">
                {innings.nonStriker.name}
              </span>
            </p>
          </div>
        )}
      </div>

      <StartInningsModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        innings={innings}
        battingPlayers={battingPlayers}
        bowlingPlayers={bowlingPlayers}
        matchId={match.id}
      />

      <UpdatePlayersModal
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        innings={innings}
        battingPlayers={battingPlayers}
        bowlingPlayers={bowlingPlayers}
        matchId={match.id}
      />
    </>
  );
}
