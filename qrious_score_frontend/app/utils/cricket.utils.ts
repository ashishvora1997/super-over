import { BallEvent } from "@/app/types/ball-event.types";

export function formatOvers(overs: number, balls: number) {
  return balls > 0 ? `${overs}.${balls}` : `${overs}`;
}

export function currentRunRate(runs: number, overs: number, balls: number) {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return "0.00";
  return (runs / totalOvers).toFixed(2);
}

export function isBowlerWicket(event: BallEvent): boolean {
  return (
    event.is_wicket &&
    event.wicket_type !== "retired_hurt" &&
    event.wicket_type !== "run_out"
  );
}

export function isInningsWicket(event: BallEvent): boolean {
  return event.is_wicket && event.wicket_type !== "retired_hurt";
}

export function getBallLabel(event: BallEvent): string {
  if (event.is_wicket && event.wicket_type === "retired_hurt") return "RH";
  if (event.is_wicket) return "W";
  if (event.extra_type === "wide") {
    const penalty =
      event.metadata && typeof event.metadata["penalty_runs"] === "number"
        ? event.metadata["penalty_runs"]
        : 1;
    const additionalRuns = event.runs_extra - penalty;
    return additionalRuns > 0 ? `Wd+${additionalRuns}` : "Wd";
  }
  if (event.extra_type === "no_ball") {
    const batRuns = event.runs_bat;
    return `Nb${batRuns > 0 ? "+" + batRuns : ""}`;
  }
  if (event.extra_type === "bye") return `B${event.runs_extra}`;
  if (event.extra_type === "leg_bye") return `Lb${event.runs_extra}`;
  return event.runs_bat.toString();
}

export function getBallColor(event: BallEvent): string {
  if (event.is_wicket && event.wicket_type === "retired_hurt")
    return "bg-slate-400 text-white ring-slate-300";
  if (event.is_wicket) return "bg-red-500 text-white ring-red-300";
  if (event.extra_type === "wide" || event.extra_type === "no_ball")
    return "bg-amber-400 text-amber-900 ring-amber-200";
  if (event.extra_type === "bye" || event.extra_type === "leg_bye")
    return "bg-orange-100 text-orange-700 ring-orange-200";
  if (event.runs_bat === 4) return "bg-emerald-500 text-white ring-emerald-300";
  if (event.runs_bat === 6) return "bg-purple-500 text-white ring-purple-300";
  if (event.runs_bat === 0) return "bg-gray-200 text-gray-600 ring-gray-300";
  return "bg-blue-100 text-blue-700 ring-blue-200";
}

export function getTeamAvatarText(name: string): string {
  if (!name) return "";
  const words = name.split(" ").filter((w) => w.trim().length > 0);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
