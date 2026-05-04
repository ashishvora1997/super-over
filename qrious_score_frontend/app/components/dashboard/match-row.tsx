import { Match } from "@/app/types/match.types";

interface MatchRowProps {
  match: Match;
}

function formatOvers(overs: number, balls: number): string {
  return balls > 0 ? `${overs}.${balls}` : `${overs}`;
}

function getInningsScore(match: Match, teamId: number): string | null {
  const mainInnings = match.innings
    ?.filter((i) => !i.is_super_over && i.batting_team_id === teamId)
    .sort((a, b) => a.innings_number - b.innings_number);

  if (!mainInnings || mainInnings.length === 0) return null;
  const inn = mainInnings[0];
  return `${inn.total_runs}/${inn.wickets} (${formatOvers(inn.overs, inn.balls)})`;
}

function getResultText(match: Match): string {
  if (match.status === "scheduled") {
    const date = new Date(match.match_date);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (match.status === "live") {
    const activeInnings = match.innings?.find(
      (i) => !i.is_super_over && i.status === "in_progress",
    );
    if (activeInnings) {
      const teamId = activeInnings.batting_team_id;
      const teamName =
        teamId === match.team_a_id ? match.teamA?.name : match.teamB?.name;
      return `${teamName ?? "Batting"} · ${formatOvers(activeInnings.overs, activeInnings.balls)} ov`;
    }
    return "In Progress";
  }

  if (match.winner) {
    const winnerName = match.winner.name;
    const innings1 = match.innings?.find(
      (i) => !i.is_super_over && i.innings_number === 1,
    );
    const innings2 = match.innings?.find(
      (i) => !i.is_super_over && i.innings_number === 2,
    );

    if (innings1 && innings2) {
      if (match.winner_team_id === innings1.batting_team_id) {
        const margin = innings1.total_runs - innings2.total_runs;
        return `${winnerName} won by ${margin} run${margin !== 1 ? "s" : ""}`;
      } else {
        const wicketsLeft = 10 - innings2.wickets;
        return `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
      }
    }
    return `${winnerName} won`;
  }

  if (match.result === "tie") return "Match Tied";
  if (match.result === "no_result") return "No Result";
  if (match.result === "draw") return "Match Drawn";
  return "Completed";
}

export function MatchRow({ match }: MatchRowProps) {
  const homeTeam = match.teamA?.name ?? "TBD";
  const awayTeam = match.teamB?.name ?? "TBD";
  const homeShort =
    homeTeam.length > 12 ? homeTeam.slice(0, 12) + "…" : homeTeam;
  const awayShort =
    awayTeam.length > 12 ? awayTeam.slice(0, 12) + "…" : awayTeam;

  const homeScore = getInningsScore(match, match.team_a_id);
  const awayScore = getInningsScore(match, match.team_b_id);

  const status = match.status === "scheduled" ? "upcoming" : match.status;

  const statusConfig = {
    live: {
      label: "Live",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    completed: {
      label: "Completed",
      className: "bg-background text-muted border-border",
    },
    upcoming: {
      label: "Upcoming",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };

  const s = statusConfig[status as keyof typeof statusConfig];
  const resultText = getResultText(match);

  const isWinnerA = match.winner_team_id === match.team_a_id;
  const isWinnerB = match.winner_team_id === match.team_b_id;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-background transition">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            isWinnerA
              ? "bg-accent/10 text-accent border-accent/30"
              : "bg-background text-foreground border-border"
          }`}
        >
          {homeShort}
        </span>

        <span className="text-xs text-muted">vs</span>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            isWinnerB
              ? "bg-accent/10 text-accent border-accent/30"
              : "bg-background text-foreground border-border"
          }`}
        >
          {awayShort}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-sm font-mono">
        {homeScore && (
          <span
            className={`${isWinnerA ? "font-bold text-foreground" : "text-muted"}`}
          >
            {homeScore}
          </span>
        )}

        {homeScore && awayScore && <span className="text-muted">·</span>}

        {awayScore && (
          <span
            className={`${isWinnerB ? "font-bold text-foreground" : "text-muted"}`}
          >
            {awayScore}
          </span>
        )}

        {!homeScore && !awayScore && status !== "upcoming" && (
          <span className="text-muted">—</span>
        )}
      </div>

      <div className="hidden md:block text-xs text-muted text-right min-w-[140px]">
        {resultText}
      </div>

      <span
        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.className}`}
      >
        {status === "live" && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
          </span>
        )}
        {s.label}
      </span>
    </div>
  );
}
