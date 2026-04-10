import { MatchRowProps } from "@/app/types/dashboard.types";

const teamColors: Record<string, string> = {
  RCB: "bg-red-100 text-red-700 border-red-200",
  MI: "bg-blue-100 text-blue-700 border-blue-200",
  CSK: "bg-yellow-100 text-yellow-700 border-yellow-200",
  GT: "bg-sky-100 text-sky-700 border-sky-200",
  KKR: "bg-purple-100 text-purple-700 border-purple-200",
  PBKS: "bg-rose-100 text-rose-700 border-rose-200",
};

export function MatchRow({
  home,
  away,
  homeScore,
  awayScore,
  overs,
  status,
  result,
}: MatchRowProps) {
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

  const s = statusConfig[status];

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-background transition">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            teamColors[home] ?? "bg-background text-foreground border-border"
          }`}
        >
          {home}
        </span>

        <span className="text-xs text-muted">vs</span>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            teamColors[away] ?? "bg-background text-foreground border-border"
          }`}
        >
          {away}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-sm font-mono">
        <span className="font-semibold text-foreground">{homeScore}</span>

        {status !== "upcoming" && (
          <>
            <span className="text-muted">·</span>
            <span className="text-muted">{awayScore}</span>
          </>
        )}
      </div>

      <div className="hidden md:block text-xs text-muted text-right min-w-[140px]">
        {result}
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
