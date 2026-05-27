"use client";

import { HeartPulse, Trophy, Zap, HandCoins } from "lucide-react";
import type {
  RecentFormEntry,
  Highlights,
} from "@/app/services/dashboard.service";

interface RecentFormCardProps {
  form: RecentFormEntry[];
  highlights: Highlights | null;
  loading?: boolean;
}

const FORM_CONFIG: Record<
  "W" | "L" | "T" | "NR",
  { bg: string; text: string; label: string }
> = {
  W: { bg: "bg-accent", text: "text-white", label: "W" },
  L: { bg: "bg-destructive", text: "text-white", label: "L" },
  T: { bg: "bg-amber-400", text: "text-white", label: "T" },
  NR: { bg: "bg-gray-300", text: "text-gray-600", label: "NR" },
};

function FormBubble({ result }: { result: "W" | "L" | "T" | "NR" }) {
  const cfg = FORM_CONFIG[result];
  return (
    <span
      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${cfg.bg} ${cfg.text} shadow-sm`}
    >
      {cfg.label}
    </span>
  );
}

function HighlightRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon size={13} className="text-primary shrink-0" />
        {label}
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-gray-100" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex justify-between items-center pt-2 border-t border-border"
        >
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function RecentFormCard({
  form,
  highlights,
  loading = false,
}: RecentFormCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <HeartPulse size={14} className="text-rose-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Recent form</h3>
        </div>
        <span className="text-xs text-muted">Last 5 matches</span>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            {form.length === 0 ? (
              <p className="text-xs text-muted">No completed matches yet</p>
            ) : (
              form.map((entry) => (
                <FormBubble key={entry.match_id} result={entry.result} />
              ))
            )}
          </div>

          <div className="mt-1">
            <HighlightRow
              icon={Trophy}
              label="Highest score"
              value={
                highlights?.highestScore
                  ? `${highlights.highestScore.runs} vs ${highlights.highestScore.opponent}`
                  : "—"
              }
            />
            <HighlightRow
              icon={Zap}
              label="Best bowling"
              value={
                highlights?.bestBowling
                  ? `${highlights.bestBowling.figures} vs ${highlights.bestBowling.opponent}`
                  : "—"
              }
            />
            <HighlightRow
              icon={HandCoins}
              label="Catches"
              value={highlights ? `${highlights.catches} this season` : "—"}
            />
          </div>
        </>
      )}
    </div>
  );
}
