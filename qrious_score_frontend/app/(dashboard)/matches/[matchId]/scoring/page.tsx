"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Undo2,
  AlertTriangle,
  Zap,
  Target,
  Shield,
  CircleDot,
  X,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";

import { useBallEventStore } from "@/app/store/ball-event.store";
import { useInningsStore } from "@/app/store/innings.store";
import { getMatchById } from "@/app/services/matches.service";
import { useAuthStore } from "@/app/store/auth.store";
import { Match } from "@/app/types/match.types";
import { Innings } from "@/app/types/innings.types";
import {
  CreateBallEventPayload,
  ExtraType,
  WicketType,
} from "@/app/types/ball-event.types";
import { getErrorMessage } from "@/app/utils/error-handler";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Select } from "@/app/components/ui/select";
import {
  formatOvers,
  currentRunRate,
  getBallLabel,
  getBallColor,
} from "@/app/utils/cricket.utils";
import { ViewerScoreboardContainer } from "@/app/components/matches/scorecard-view";
import { useMatchSocket } from "@/app/hooks/useMatchSocket";

function ScoringPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-lg" />
      <div className="h-36 bg-gray-200 rounded-2xl" />
      <div className="h-24 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function WicketPanel({
  open,
  onClose,
  innings,
  bowlingPlayers,
  bowlingTeamWicketKeeperId,
  isFreeHit,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  innings: Innings;
  bowlingPlayers: { id: number; name: string }[];
  bowlingTeamWicketKeeperId: number | undefined;
  isFreeHit: boolean;
  onSubmit: (wicketData: {
    wicket_type: WicketType;
    dismissed_player_id: number;
    fielder_id?: number;
    runs_bat: number;
    runs_completed?: number;
    batsmen_crossed?: boolean;
  }) => void;
}) {
  const [wicketType, setWicketType] = useState<WicketType | "">("");
  const [dismissedId, setDismissedId] = useState<number | "">("");
  const [fielderId, setFielderId] = useState<number | "">("");
  const [runsBat, setRunsBat] = useState(0);
  const [runsCompleted, setRunsCompleted] = useState<0 | 1 | 2 | 3>(0);
  const [batsmenCrossed, setBatsmenCrossed] = useState<boolean>(false);

  const wicketTypes: { value: WicketType; label: string }[] = [
    { value: "bowled", label: "Bowled" },
    { value: "caught", label: "Caught" },
    { value: "lbw", label: "LBW" },
    { value: "run_out", label: "Run Out" },
    { value: "stumped", label: "Stumped" },
    { value: "hit_wicket", label: "Hit Wicket" },
  ];

  const allowedWicketTypes = isFreeHit
    ? wicketTypes.filter(
        (wt) => wt.value === "run_out" || wt.value === "retired_hurt",
      )
    : wicketTypes;

  const strikerAutoOutTypes = [
    "bowled",
    "caught",
    "lbw",
    "hit_wicket",
    "stumped",
  ];
  const isStrikerAutoOut = strikerAutoOutTypes.includes(wicketType);

  const needsFielder = wicketType === "caught" || wicketType === "run_out";

  const isStumped = wicketType === "stumped";

  const needsDismissedSelection = wicketType === "run_out";

  const batsmen = [
    innings.striker_id
      ? {
          id: innings.striker_id,
          name: innings.striker?.name || "Striker",
          label: "Striker",
        }
      : null,
    innings.non_striker_id
      ? {
          id: innings.non_striker_id,
          name: innings.nonStriker?.name || "Non-striker",
          label: "Non-striker",
        }
      : null,
  ].filter(Boolean) as { id: number; name: string; label: string }[];

  useEffect(() => {
    if (isStrikerAutoOut && innings.striker_id) {
      setDismissedId(innings.striker_id);
    } else if (!needsDismissedSelection) {
      setDismissedId("");
    }
  }, [
    wicketType,
    innings.striker_id,
    isStrikerAutoOut,
    needsDismissedSelection,
  ]);

  useEffect(() => {
    if (wicketType !== "run_out") {
      setRunsCompleted(0);
      setBatsmenCrossed(false);
    }
  }, [wicketType]);

  useEffect(() => {
    if (isStumped && bowlingTeamWicketKeeperId) {
      setFielderId(bowlingTeamWicketKeeperId);
    } else if (!isStumped) {
      if (!needsFielder) setFielderId("");
    }
  }, [isStumped, bowlingTeamWicketKeeperId]);

  const handleSubmit = () => {
    if (!wicketType) return toast.error("Select wicket type");
    if (needsDismissedSelection && !dismissedId)
      return toast.error("Select dismissed batsman");
    if (needsFielder && !fielderId) return toast.error("Select fielder");
    if (isStumped && !bowlingTeamWicketKeeperId)
      return toast.error("No wicket keeper assigned to bowling team");

    let finalDismissedId = dismissedId;
    if (isStrikerAutoOut && innings.striker_id) {
      finalDismissedId = innings.striker_id;
    }

    if (!finalDismissedId) return toast.error("Select dismissed batsman");

    onSubmit({
      wicket_type: wicketType as WicketType,
      dismissed_player_id: Number(finalDismissedId),
      fielder_id: needsFielder
        ? Number(fielderId)
        : isStumped
          ? bowlingTeamWicketKeeperId
          : undefined,
      runs_bat: runsBat,
      ...(wicketType === "run_out" && {
        runs_completed: runsCompleted,
        batsmen_crossed: runsCompleted > 0,
      }),
    });

    setWicketType("");
    setDismissedId("");
    setFielderId("");
    setRunsBat(0);
    setRunsCompleted(0);
    setBatsmenCrossed(false);
  };

  if (!open) return null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record Wicket"
      onSubmit={handleSubmit}
      submitText="Confirm Wicket"
    >
      {isFreeHit && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <Zap size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-700 font-semibold">
            Free Hit — only Run Out or Retired Hurt dismissals are valid on this
            delivery.
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Wicket Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {allowedWicketTypes.map((wt) => (
            <button
              key={wt.value}
              type="button"
              onClick={() => setWicketType(wt.value)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                wicketType === wt.value
                  ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200"
                  : "bg-white text-muted border-border hover:border-red-300"
              }`}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      {needsDismissedSelection && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Dismissed Batsman <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {batsmen.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setDismissedId(b.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  dismissedId === b.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-foreground border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold">{b.name}</div>
                <div className="text-[10px] opacity-75 font-normal">
                  {b.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isStrikerAutoOut && innings.striker_id && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">
            Dismissed Batsman
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm font-medium">
              {innings.striker?.name || "Striker"} (Striker)
            </span>
          </div>
        </div>
      )}

      {wicketType === "run_out" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Runs Completed Before Wicket
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((runs) => (
              <button
                key={runs}
                type="button"
                onClick={() => setRunsCompleted(runs as 0 | 1 | 2 | 3)}
                className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                  runsCompleted === runs
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-foreground border-border hover:border-primary/40"
                }`}
              >
                {runs}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            {runsCompleted === 0 && "No runs completed - batsmen did not cross"}
            {runsCompleted === 1 && "1 run completed - batsmen crossed once"}
            {runsCompleted === 2 && "2 runs completed - batsmen crossed twice"}
            {runsCompleted === 3 &&
              "3 runs completed - batsmen crossed three times"}
          </p>
        </div>
      )}

      {isStumped && bowlingTeamWicketKeeperId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">
            Fielder (Wicket Keeper)
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            <span className="text-sm font-medium">
              {bowlingPlayers.find((p) => p.id === bowlingTeamWicketKeeperId)
                ?.name || "Wicket Keeper"}
            </span>
          </div>
          <p className="text-[10px] text-blue-500/70 mt-1">
            Auto-assigned — only the wicket keeper can stump
          </p>
        </div>
      )}

      {isStumped && !bowlingTeamWicketKeeperId && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs text-red-700 font-semibold">
              No wicket keeper assigned to the bowling team. Please assign one
              in Team settings.
            </span>
          </div>
        </div>
      )}

      {needsFielder && (
        <Select
          label="Fielder"
          value={String(fielderId)}
          onChange={(val) => setFielderId(val ? Number(val) : "")}
          placeholder="Select fielder..."
          options={bowlingPlayers.map((p) => ({
            label: p.name,
            value: String(p.id),
          }))}
        />
      )}
    </FormModal>
  );
}

function ExtrasPanel({
  open,
  extraType,
  onClose,
  onSubmit,
}: {
  open: boolean;
  extraType: ExtraType | null;
  onClose: () => void;
  onSubmit: (runsBat: number, runsExtra: number) => void;
}) {
  if (!open || !extraType) return null;

  const label =
    extraType === "wide"
      ? "Wide"
      : extraType === "no_ball"
        ? "No Ball"
        : extraType === "bye"
          ? "Bye"
          : "Leg Bye";

  const isNoBall = extraType === "no_ball";
  const isWide = extraType === "wide";

  if (isNoBall) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {label} — Runs off Bat
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={14} className="text-muted" />
            </button>
          </div>
          <p className="text-xs text-muted mb-3">
            1 penalty run added automatically. How many runs did the batsman
            score off the bat?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                onClick={() => onSubmit(r, 1)}
                className={`h-14 rounded-2xl font-bold border transition-all active:scale-95 ${
                  r === 4
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-emerald-400 shadow-sm text-lg"
                    : r === 6
                      ? "bg-gradient-to-br from-purple-400 to-purple-600 text-white border-purple-400 shadow-sm text-lg"
                      : r === 0
                        ? "bg-gray-100 text-gray-700 border-gray-200 text-sm"
                        : "bg-amber-50 text-amber-800 border-amber-200 text-sm"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isWide) {
    const additionalRunOptions = [0, 1, 2, 3, 4];

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">
              Wide — Extra Runs
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={14} className="text-muted" />
            </button>
          </div>
          <p className="text-xs text-muted mb-4">
            1 run awarded automatically. Tap to add additional runs (overthrows,
            etc.)
          </p>
          <div className="grid grid-cols-5 gap-2">
            {additionalRunOptions.map((additional) => {
              const totalExtra = 1 + additional;
              return (
                <button
                  key={additional}
                  onClick={() => onSubmit(0, totalExtra)}
                  className={`h-14 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                    additional === 0
                      ? "bg-amber-400 text-amber-900 border-amber-400 shadow-sm shadow-amber-200"
                      : "bg-white text-foreground border-border hover:border-amber-300"
                  }`}
                >
                  <span className="block text-sm">+{additional}</span>
                  <span className="block text-[10px] opacity-60">
                    ({totalExtra} total)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {label} — Extra Runs
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-muted" />
          </button>
        </div>
        <p className="text-xs text-muted mb-4">
          How many {label.toLowerCase()} runs?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => onSubmit(0, r)}
              className={`h-14 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                r === 1
                  ? "bg-orange-400 text-orange-900 border-orange-400 shadow-sm shadow-orange-200"
                  : "bg-white text-foreground border-border hover:border-orange-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreboardHeader({
  inn,
  matchDetail,
  isCompleted,
  allInnings,
}: {
  inn: Innings;
  matchDetail: Match;
  isCompleted: boolean;
  allInnings: Innings[];
}) {
  const oversPerSide = matchDetail.overs_per_side;

  const firstInnings = allInnings.find((i) => i.innings_number === 1);
  const isSecondInnings = inn.innings_number === 2;
  const target =
    isSecondInnings && firstInnings ? firstInnings.total_runs + 1 : null;
  const runsNeeded = target ? target - inn.total_runs : null;

  const totalBalls = oversPerSide ? oversPerSide * 6 : null;
  const ballsBowled = inn.overs * 6 + inn.balls;
  const ballsRemaining = totalBalls ? totalBalls - ballsBowled : null;

  const rrr =
    runsNeeded !== null &&
    runsNeeded > 0 &&
    ballsRemaining !== null &&
    ballsRemaining > 0
      ? ((runsNeeded / ballsRemaining) * 6).toFixed(2)
      : null;

  const crr = currentRunRate(inn.total_runs, inn.overs, inn.balls);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.1),transparent_50%)]" />

      {isSecondInnings && target !== null && !isCompleted && (
        <div className="relative bg-amber-500/20 border-b border-amber-500/25 px-5 py-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            🎯 Target: {target}
          </span>
          {runsNeeded !== null && ballsRemaining !== null && (
            <span className="text-[11px] text-amber-200/80">
              {runsNeeded} runs · {ballsRemaining} balls left
            </span>
          )}
        </div>
      )}

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            {matchDetail.tournament?.name ?? "Match"} · Innings{" "}
            {inn.innings_number}
          </span>
          {isCompleted ? (
            <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2.5 py-1 rounded-full border border-white/10">
              Completed
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-accent/20 text-accent-light px-2.5 py-1 rounded-full border border-accent/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mb-0.5">
              Batting
            </p>
            <p className="text-sm font-bold text-white">
              {inn.battingTeam?.name ?? "—"}
            </p>
          </div>
          <div className="flex-shrink-0 text-white/20 text-xs font-bold px-3">
            vs
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mb-0.5">
              Bowling
            </p>
            <p className="text-sm font-semibold text-white/65">
              {inn.bowlingTeam?.name ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-black tracking-tight leading-none">
              {inn.total_runs}
              <span className="text-2xl text-white/50 font-bold">
                /{inn.wickets}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 font-medium mb-0.5">
              Overs
            </p>
            <p className="text-2xl font-bold leading-none">
              {formatOvers(inn.overs, inn.balls)}
              {oversPerSide && (
                <span className="text-base font-normal text-white/40">
                  {" "}
                  / {oversPerSide}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-stretch gap-0 mt-4 pt-3 border-t border-white/10 divide-x divide-white/10">
          <div className="pr-5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-0.5">
              CRR
            </span>
            <p className="text-sm font-bold">{crr}</p>
          </div>
          {rrr && (
            <div className="px-5">
              <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-0.5">
                RRR
              </span>
              <p className="text-sm font-bold text-amber-400">{rrr}</p>
            </div>
          )}
          {isSecondInnings && firstInnings && (
            <div className="px-5">
              <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-0.5">
                1st Inn
              </span>
              <p className="text-sm font-semibold text-white/60">
                {firstInnings.total_runs}/{firstInnings.wickets}
              </p>
            </div>
          )}
          {!isSecondInnings && oversPerSide && (
            <div className="px-5">
              <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-0.5">
                Remaining
              </span>
              <p className="text-sm font-semibold text-white/60">
                {ballsRemaining !== null
                  ? `${Math.floor(ballsRemaining / 6)}.${ballsRemaining % 6} ov`
                  : "—"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerAssignModal({
  open,
  onClose,
  needsBatsman,
  needsBowler,
  battingPlayers,
  bowlingPlayers,
  excludedBatsmanIds,
  lastBowlerId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  needsBatsman: boolean;
  needsBowler: boolean;
  battingPlayers: { id: number; name: string }[];
  bowlingPlayers: { id: number; name: string }[];
  excludedBatsmanIds: number[];
  lastBowlerId: number | null;
  onSubmit: (batsmanId: number | null, bowlerId: number | null) => void;
}) {
  const [selectedBatsman, setSelectedBatsman] = useState<number | "">("");
  const [selectedBowler, setSelectedBowler] = useState<number | "">("");

  useEffect(() => {
    if (open) {
      setSelectedBatsman("");
      setSelectedBowler("");
    }
  }, [open]);

  const availableBatsmen = battingPlayers.filter(
    (p) => !excludedBatsmanIds.includes(p.id),
  );
  const availableBowlers = bowlingPlayers.filter((p) => p.id !== lastBowlerId);

  const handleSubmit = () => {
    if (needsBatsman && !selectedBatsman)
      return toast.error("Select incoming batsman");
    if (needsBowler && !selectedBowler)
      return toast.error("Select next bowler");
    onSubmit(
      needsBatsman ? Number(selectedBatsman) : null,
      needsBowler ? Number(selectedBowler) : null,
    );
  };

  const title =
    needsBatsman && needsBowler
      ? "New Batsman & Bowler"
      : needsBatsman
        ? "New Batsman"
        : "Next Bowler";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit}
      submitText="Confirm"
    >
      {needsBatsman && needsBowler && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle
            size={16}
            className="text-amber-500 mt-0.5 flex-shrink-0"
          />
          <p className="text-xs text-amber-700">
            Wicket fell on the last ball of the over — select both the incoming
            batsman and next bowler.
          </p>
        </div>
      )}

      {needsBatsman && !needsBowler && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle
            size={16}
            className="text-amber-500 mt-0.5 flex-shrink-0"
          />
          <p className="text-xs text-amber-700">
            A wicket has fallen. Select the next batsman to continue.
          </p>
        </div>
      )}

      {needsBowler && !needsBatsman && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <Target size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Over complete! Select the next bowler.
          </p>
        </div>
      )}

      {needsBatsman && (
        <Select
          label="Incoming Batsman"
          value={String(selectedBatsman)}
          onChange={(val) => setSelectedBatsman(val ? Number(val) : "")}
          placeholder="Choose batsman..."
          options={availableBatsmen.map((p) => ({
            label: p.name,
            value: String(p.id),
          }))}
        />
      )}

      {needsBowler && (
        <Select
          label="Next Bowler"
          value={String(selectedBowler)}
          onChange={(val) => setSelectedBowler(val ? Number(val) : "")}
          placeholder="Choose bowler..."
          options={availableBowlers.map((p) => ({
            label: p.name,
            value: String(p.id),
          }))}
        />
      )}
    </FormModal>
  );
}

function getMissingPlayersDescription(inn: Innings | null): string | null {
  if (!inn) return null;
  const missing: string[] = [];
  if (!inn.striker_id) missing.push("striker");
  if (!inn.non_striker_id) missing.push("non-striker");
  if (!inn.bowler_id) missing.push("bowler");
  if (missing.length === 0) return null;
  return missing.join(", ");
}

export default function ScoringPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);

  const user = useAuthStore((s) => s.user);
  const isScorer = user?.role === "admin" || user?.role === "scorer";

  const [matchDetail, setMatchDetail] = useState<Match | null>(null);
  const [activeInnings, setActiveInnings] = useState<Innings | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewerSelectedInnings, setViewerSelectedInnings] =
    useState<Innings | null>(null);

  const [wicketOpen, setWicketOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedExtraType, setSelectedExtraType] = useState<ExtraType | null>(
    null,
  );
  const [playerAssignOpen, setPlayerAssignOpen] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [lastBowlerId, setLastBowlerId] = useState<number | null>(null);

  const { innings, fetchInnings, updateInningsInArray } = useInningsStore();
  const {
    ballEvents,
    currentInnings,
    scorecard,
    recording,
    fetchBallEvents,
    fetchScorecard,
    fetchInnings: fetchCurrentInnings,
    recordBall: storageRecordBall,
    undoLast,
  } = useBallEventStore();

  const isFreeHit = useMemo(() => {
    for (let i = ballEvents.length - 1; i >= 0; i--) {
      const event = ballEvents[i];
      if (event.extra_type === "wide") continue;
      return event.extra_type === "no_ball";
    }
    return false;
  }, [ballEvents]);

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      try {
        const matchRes = await getMatchById(matchId);
        setMatchDetail(matchRes.data);
        await fetchInnings(matchId);
      } catch {
        toast.error("Failed to load match");
      } finally {
        setPageLoading(false);
      }
    };
    init();
    return () => useBallEventStore.getState().reset();
  }, [matchId]);

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    const inProgress = innings.find((i) => i.status === "in_progress");
    const target = inProgress || innings[innings.length - 1] || null;
    if (target) {
      hasInitializedRef.current = true;
      setActiveInnings(target);
      fetchCurrentInnings(target.id);
      fetchBallEvents(target.id);
      fetchScorecard(target.id);
    }
  }, [innings]);

  useEffect(() => {
    if (currentInnings) {
      setActiveInnings(currentInnings);
      updateInningsInArray(currentInnings);
    }
  }, [currentInnings]);

  useMatchSocket(matchId, !isScorer);

  useEffect(() => {
    if (!isScorer || !currentInnings) return;
    if (currentInnings.status !== "in_progress") return;

    const needsBatsman =
      currentInnings.striker_id === null ||
      currentInnings.non_striker_id === null;
    const needsBowler = currentInnings.bowler_id === null;

    if (needsBatsman || needsBowler) {
      setPlayerAssignOpen(true);
    } else {
      setPlayerAssignOpen(false);
    }
  }, [currentInnings, isScorer]);

  const inn = currentInnings || activeInnings;

  const isOnHatTrick = useMemo(() => {
    const currentBowlerId = inn?.bowler_id;
    if (!currentBowlerId || ballEvents.length === 0) return false;

    const bowlerDeliveries = ballEvents.filter(
      (e) => e.bowler_id === currentBowlerId && e.extra_type !== "wide",
    );

    if (bowlerDeliveries.length < 2) return false;

    const lastTwo = bowlerDeliveries.slice(-2);
    return lastTwo.every((e) => e.is_wicket);
  }, [ballEvents, inn?.bowler_id]);

  const isScoringReady =
    inn?.status === "in_progress" &&
    inn?.striker_id !== null &&
    inn?.non_striker_id !== null &&
    inn?.bowler_id !== null;

  const missingPlayersDescription = getMissingPlayersDescription(
    isScoringReady ? null : inn,
  );

  const battingPlayers =
    inn && matchDetail
      ? inn.batting_team_id === matchDetail.team_a_id
        ? (matchDetail.teamA?.players ?? [])
        : (matchDetail.teamB?.players ?? [])
      : [];

  const bowlingPlayers =
    inn && matchDetail
      ? inn.bowling_team_id === matchDetail.team_a_id
        ? (matchDetail.teamA?.players ?? [])
        : (matchDetail.teamB?.players ?? [])
      : [];

  const guardScoring = useCallback((): boolean => {
    if (!isScoringReady) {
      setPlayerAssignOpen(true);
      return false;
    }
    return true;
  }, [isScoringReady]);

  const handleRunClick = useCallback(
    async (runs: number) => {
      if (!inn || recording) return;
      if (!guardScoring()) return;
      try {
        const payload: CreateBallEventPayload = {
          innings_id: inn.id,
          striker_id: inn.striker_id!,
          non_striker_id: inn.non_striker_id!,
          bowler_id: inn.bowler_id!,
          runs_bat: runs,
        };
        setLastBowlerId(inn.bowler_id!);
        await storageRecordBall(payload);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [inn, recording, guardScoring, storageRecordBall],
  );

  const handleExtraClick = (type: ExtraType) => {
    if (!guardScoring()) return;
    setSelectedExtraType(type);
    setExtrasOpen(true);
  };

  const handleExtraSubmit = async (runsBat: number, runsExtra: number) => {
    if (!inn || recording) return;
    if (!guardScoring()) return;
    try {
      const payload: CreateBallEventPayload = {
        innings_id: inn.id,
        striker_id: inn.striker_id!,
        non_striker_id: inn.non_striker_id!,
        bowler_id: inn.bowler_id!,
        runs_bat: runsBat,
        extra_type: selectedExtraType!,
        runs_extra: runsExtra,
      };
      setLastBowlerId(inn.bowler_id!);
      await storageRecordBall(payload);
      setExtrasOpen(false);
      setSelectedExtraType(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleWicketSubmit = async (wicketData: {
    wicket_type: WicketType;
    dismissed_player_id: number;
    fielder_id?: number;
    runs_bat: number;
  }) => {
    if (!inn || recording) return;
    if (!guardScoring()) return;
    try {
      const payload: CreateBallEventPayload = {
        innings_id: inn.id,
        striker_id: inn.striker_id!,
        non_striker_id: inn.non_striker_id!,
        bowler_id: inn.bowler_id!,
        runs_bat: wicketData.runs_bat,
        is_wicket: true,
        wicket_type: wicketData.wicket_type,
        dismissed_player_id: wicketData.dismissed_player_id,
        fielder_id: wicketData.fielder_id,
      };
      setLastBowlerId(inn.bowler_id!);
      await storageRecordBall(payload);
      setWicketOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleWicketClick = () => {
    if (!guardScoring()) return;
    setWicketOpen(true);
  };

  const handlePlayerAssign = async (
    batsmanId: number | null,
    bowlerId: number | null,
  ) => {
    const freshInnings = useBallEventStore.getState().currentInnings;
    if (!freshInnings) return;

    try {
      const { updateInningsPlayers } = useInningsStore.getState();
      const updates: Record<string, number> = {};

      if (batsmanId !== null) {
        if (
          freshInnings.striker_id === null &&
          freshInnings.non_striker_id === null
        ) {
          updates.striker_id = batsmanId;
        } else if (freshInnings.striker_id === null) {
          updates.striker_id = batsmanId;
        } else if (freshInnings.non_striker_id === null) {
          updates.non_striker_id = batsmanId;
        }
      }

      if (bowlerId !== null) {
        updates.bowler_id = bowlerId;
      }

      await updateInningsPlayers(freshInnings.id, updates, matchId);
      await fetchCurrentInnings(freshInnings.id);
      setPlayerAssignOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUndo = async () => {
    if (!inn) return;
    try {
      await undoLast(inn.id);
      setUndoConfirmOpen(false);
      toast.success("Last ball undone");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const currentOverBalls = inn
    ? ballEvents.filter((e) => e.over_number === inn.overs)
    : [];

  const strikerStats =
    scorecard && inn?.striker_id
      ? scorecard.batting.find((b) => b.player_id === inn.striker_id)
      : null;
  const nonStrikerStats =
    scorecard && inn?.non_striker_id
      ? scorecard.batting.find((b) => b.player_id === inn.non_striker_id)
      : null;
  const bowlerStats =
    scorecard && inn?.bowler_id
      ? scorecard.bowling.find((b) => b.player_id === inn.bowler_id)
      : null;

  if (pageLoading) {
    return <ScoringPageSkeleton />;
  }

  if (!matchDetail) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm text-muted">Match not found</p>
      </div>
    );
  }

  if (!inn) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => router.push(`/matches/${matchId}`)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to match
        </button>
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <p className="font-semibold text-foreground text-sm">
            No active innings
          </p>
          <p className="text-xs text-muted mt-1">
            Start an innings from the match detail page first.
          </p>
        </div>
      </div>
    );
  }

  const isCompleted =
    inn.status === "completed" ||
    inn.status === "not_started" ||
    matchDetail.status === "completed";

  if (!isScorer) {
    const headerInnings = viewerSelectedInnings
      ? innings.find((i) => i.id === viewerSelectedInnings.id) ||
        viewerSelectedInnings
      : inn;
    return (
      <div className="max-w-2xl mx-auto space-y-3 pb-8">
        <button
          onClick={() => router.push(`/matches/${matchId}`)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to match
        </button>
        <ScoreboardHeader
          inn={headerInnings}
          matchDetail={matchDetail}
          isCompleted={isCompleted}
          allInnings={innings}
        />
        <ViewerScoreboardContainer
          allInnings={innings}
          matchDetail={matchDetail}
          showHeader={false}
          onInningsChange={(selected) => setViewerSelectedInnings(selected)}
        />
      </div>
    );
  }

  const dismissedPlayerIds = ballEvents
    .filter((e) => e.is_wicket && e.dismissed_player_id)
    .map((e) => e.dismissed_player_id!);

  const activeBatsmanIds = [
    currentInnings?.striker_id,
    currentInnings?.non_striker_id,
  ].filter(Boolean) as number[];

  const excludedBatsmanIds = [
    ...new Set([...activeBatsmanIds, ...dismissedPlayerIds]),
  ];

  const needsBatsman =
    ((currentInnings?.striker_id ?? null) === null ||
      (currentInnings?.non_striker_id ?? null) === null) &&
    currentInnings?.status === "in_progress";
  const needsBowler =
    (currentInnings?.bowler_id ?? null) === null &&
    currentInnings?.status === "in_progress";

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-8">
      <button
        onClick={() => router.push(`/matches/${matchId}`)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back to match
      </button>

      <ScoreboardHeader
        inn={isCompleted && viewerSelectedInnings ? viewerSelectedInnings : inn}
        matchDetail={matchDetail}
        isCompleted={isCompleted}
        allInnings={innings}
      />

      <div className="grid grid-cols-3 gap-2">
        <div
          className={`bg-white border border-l-[3px] border-border rounded-2xl p-3 shadow-sm transition-colors ${
            !inn.striker_id
              ? "border-l-amber-400 bg-amber-50/40"
              : "border-l-emerald-400"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 bg-emerald-50 rounded-md flex items-center justify-center">
              <Zap size={10} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              Striker *
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">
            {inn.striker?.name ?? (
              <span className="text-amber-500 font-semibold">Not set</span>
            )}
          </p>
          {strikerStats ? (
            <div className="mt-1.5 flex gap-1.5">
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md font-semibold">
                {strikerStats.runs}({strikerStats.balls_faced})
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">
                SR {strikerStats.strike_rate}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-muted/50 mt-0.5">0(0)</p>
          )}
        </div>

        <div
          className={`bg-white border border-l-[3px] border-border rounded-2xl p-3 shadow-sm transition-colors ${
            !inn.non_striker_id
              ? "border-l-amber-400 bg-amber-50/40"
              : "border-l-blue-300"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center">
              <Shield size={10} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
              Non-striker
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">
            {inn.nonStriker?.name ?? (
              <span className="text-amber-500 font-semibold">Not set</span>
            )}
          </p>
          {nonStrikerStats ? (
            <div className="mt-1.5 flex gap-1.5">
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md font-semibold">
                {nonStrikerStats.runs}({nonStrikerStats.balls_faced})
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-semibold">
                SR {nonStrikerStats.strike_rate}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-muted/50 mt-0.5">0(0)</p>
          )}
        </div>

        <div
          className={`bg-white border border-l-[3px] border-border rounded-2xl p-3 shadow-sm transition-colors ${
            !inn.bowler_id
              ? "border-l-amber-400 bg-amber-50/40"
              : "border-l-red-400"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 bg-red-50 rounded-md flex items-center justify-center">
              <CircleDot size={10} className="text-red-500" />
            </div>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
              Bowler
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">
            {inn.bowler?.name ?? (
              <span className="text-amber-500 font-semibold">Not set</span>
            )}
          </p>
          {bowlerStats ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md font-semibold">
                {bowlerStats.overs} ov
              </span>
              <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md font-semibold">
                {bowlerStats.wickets}/{bowlerStats.runs_conceded}
              </span>
              <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-md font-semibold">
                E {bowlerStats.economy.toFixed(1)}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-muted/50 mt-0.5">0 ov</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            This Over
          </span>
          <span className="text-[10px] text-muted">Over {inn.overs + 1}</span>
          <div className="flex items-center gap-1.5">
            {isOnHatTrick && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded-full animate-pulse">
                🔥 HAT-TRICK BALL
              </span>
            )}
            {isFreeHit && (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-300 px-2 py-0.5 rounded-full animate-pulse">
                ⚡ FREE HIT
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
          {currentOverBalls.length === 0 ? (
            <span className="text-xs text-muted/50">No balls yet</span>
          ) : (
            currentOverBalls.map((event) => (
              <div
                key={event.id}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ${getBallColor(event)}`}
              >
                {getBallLabel(event)}
              </div>
            ))
          )}
        </div>
      </div>

      {!isCompleted && (
        <>
          {!isScoringReady && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={15} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">
                  Assign players to continue
                </p>
                <p className="text-[11px] text-amber-600 mt-0.5 capitalize">
                  Missing: {missingPlayersDescription}
                </p>
              </div>
              <button
                onClick={() => setPlayerAssignOpen(true)}
                className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-200 transition-colors flex-shrink-0"
              >
                Assign
              </button>
            </div>
          )}

          {isOnHatTrick && (
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-2xl px-4 py-3 shadow-lg shadow-red-200/50 animate-pulse">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
              <div className="relative flex items-center justify-center gap-2">
                <Flame size={18} className="text-white" />
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  Hat-Trick Ball!
                </span>
                <Flame size={18} className="text-white" />
              </div>
              <p className="relative text-center text-[11px] text-white/80 mt-1 font-medium">
                {inn.bowler?.name ?? "Bowler"} has taken 2 wickets in a row — on
                a hat-trick!
              </p>
            </div>
          )}

          {isFreeHit && (
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-2xl px-4 py-3 shadow-lg shadow-orange-200/50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
              <div className="relative flex items-center justify-center gap-2">
                <Zap size={18} className="text-white animate-pulse" />
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  Free Hit
                </span>
                <Zap size={18} className="text-white animate-pulse" />
              </div>
              <p className="relative text-center text-[11px] text-white/80 mt-1 font-medium">
                Only Run Out dismissal is valid on this delivery
              </p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRunClick(0)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-gray-100 text-gray-700 font-bold text-lg border border-gray-200 transition-all active:scale-95 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={() => handleRunClick(1)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-white text-foreground font-bold text-lg border border-border shadow-sm transition-all active:scale-95 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              1
            </button>
            <button
              onClick={() => handleRunClick(2)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-white text-foreground font-bold text-lg border border-border shadow-sm transition-all active:scale-95 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              2
            </button>
            <button
              onClick={() => handleRunClick(3)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-white text-foreground font-bold text-lg border border-border shadow-sm transition-all active:scale-95 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              3
            </button>
            <button
              onClick={() => handleRunClick(4)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-lg shadow-md shadow-emerald-200 transition-all active:scale-95 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              4
            </button>
            <button
              onClick={() => handleRunClick(6)}
              disabled={recording || !isScoringReady}
              className="h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-lg shadow-md shadow-purple-200 transition-all active:scale-95 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              6
            </button>
            <button
              onClick={handleWicketClick}
              disabled={recording || !isScoringReady}
              className={`h-16 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed col-span-2 ${
                isFreeHit
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200"
                  : "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-200"
              }`}
            >
              {isFreeHit ? "⚡ Run Out Only" : "🏏 Wicket"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleExtraClick("wide")}
              disabled={recording || !isScoringReady}
              className="h-14 rounded-2xl bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200 transition-all active:scale-95 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Wide
            </button>
            <button
              onClick={() => handleExtraClick("no_ball")}
              disabled={recording || !isScoringReady}
              className="h-14 rounded-2xl bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200 transition-all active:scale-95 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              No Ball
            </button>
            <button
              onClick={() => handleExtraClick("bye")}
              disabled={recording || !isScoringReady}
              className="h-14 rounded-2xl bg-orange-50 text-orange-700 font-semibold text-xs border border-orange-200 transition-all active:scale-95 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Bye
            </button>
            <button
              onClick={() => handleExtraClick("leg_bye")}
              disabled={recording || !isScoringReady}
              className="h-14 rounded-2xl bg-orange-50 text-orange-700 font-semibold text-xs border border-orange-200 transition-all active:scale-95 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Leg Bye
            </button>
          </div>

          {ballEvents.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setUndoConfirmOpen(true)}
                disabled={recording}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted bg-gray-50 border border-border rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <Undo2 size={13} />
                Undo Last Ball
              </button>
            </div>
          )}
        </>
      )}

      {isCompleted && (
        <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🏆</span>
          </div>
          <p className="font-bold text-foreground text-sm">
            {matchDetail.status === "completed"
              ? "Match Completed"
              : "Innings Completed"}
          </p>
          <p className="text-xs text-muted mt-1">
            {inn.battingTeam?.name} scored {inn.total_runs}/{inn.wickets} in{" "}
            {formatOvers(inn.overs, inn.balls)} overs
          </p>
        </div>
      )}

      {ballEvents.length > 0 && (
        <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Ball-by-ball
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {ballEvents.map((event, idx) => {
              const showSep =
                idx > 0 &&
                event.over_number !== ballEvents[idx - 1].over_number;
              return (
                <span key={event.id} className="contents">
                  {showSep && (
                    <span className="text-[9px] text-muted/40 font-bold mx-1">
                      |
                    </span>
                  )}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ring-1 ${getBallColor(event)}`}
                    title={`Over ${event.over_number}.${event.ball_number}`}
                  >
                    {getBallLabel(event)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-bold text-foreground mb-4">
          Detailed Scorecard
        </h3>
        <ViewerScoreboardContainer
          allInnings={innings}
          matchDetail={matchDetail}
          showHeader={false}
          onInningsChange={(selected) => setViewerSelectedInnings(selected)}
        />
      </div>

      <WicketPanel
        open={wicketOpen}
        onClose={() => setWicketOpen(false)}
        innings={inn}
        isFreeHit={isFreeHit}
        bowlingPlayers={bowlingPlayers}
        bowlingTeamWicketKeeperId={
          inn && matchDetail
            ? inn.bowling_team_id === matchDetail.team_a_id
              ? matchDetail.teamA?.wicket_keeper_id
              : matchDetail.teamB?.wicket_keeper_id
            : undefined
        }
        onSubmit={handleWicketSubmit}
      />

      <ExtrasPanel
        open={extrasOpen}
        extraType={selectedExtraType}
        onClose={() => {
          setExtrasOpen(false);
          setSelectedExtraType(null);
        }}
        onSubmit={handleExtraSubmit}
      />

      <PlayerAssignModal
        open={playerAssignOpen}
        onClose={() => setPlayerAssignOpen(false)}
        needsBatsman={needsBatsman}
        needsBowler={needsBowler}
        battingPlayers={battingPlayers}
        bowlingPlayers={bowlingPlayers}
        excludedBatsmanIds={excludedBatsmanIds}
        lastBowlerId={lastBowlerId}
        onSubmit={handlePlayerAssign}
      />

      {undoConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-sm font-bold text-foreground mb-2">
              Undo Last Ball?
            </h3>
            <p className="text-xs text-muted mb-4">
              This will remove the last recorded delivery and revert the score.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUndoConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border bg-white text-muted hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUndo}
                disabled={recording}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-destructive text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
