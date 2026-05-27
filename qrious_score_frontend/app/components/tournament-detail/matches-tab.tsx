"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Loader2,
  Swords,
  MapPin,
  Zap,
  Trophy,
} from "lucide-react";
import { Tabs } from "@/app/components/ui/tabs";
import { Tournament } from "@/app/types/tournaments.types";
import { Match, MatchStatus } from "@/app/types/match.types";
import { useMatchStore } from "@/app/store/matches.store";
import { useAuthStore } from "@/app/store/auth.store";
import { CreateMatchFlow } from "@/app/components/matches/create-match-flow";
import { useRouter } from "next/navigation";

interface MatchesTabProps {
  tournament: Tournament;
}

type TabStatus = "live" | "upcoming" | "past";

import { MatchCard } from "@/app/components/matches/match-card";

function EmptyState({ type }: { type: TabStatus }) {
  const messages = {
    live: "No live matches at the moment",
    upcoming: "No upcoming matches scheduled",
    past: "No completed matches yet",
  };

  return (
    <div className="bg-gray-50 border border-dashed border-border rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Play size={28} className="text-gray-400" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-1">
        {messages[type]}
      </h4>
      <p className="text-sm text-muted">
        Matches will appear here once scheduled
      </p>
    </div>
  );
}

export function MatchesTab({ tournament }: MatchesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<TabStatus>("upcoming");
  const { matches, loading, fetchMatches } = useMatchStore();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);

  const isOwner = user?.id !== undefined && tournament.created_by === user.id;

  useEffect(() => {
    fetchMatches(tournament.id);
  }, [tournament.id]);

  const subTabs = [
    { id: "live", label: "Live", icon: <Play size={14} /> },
    { id: "upcoming", label: "Upcoming", icon: <Calendar size={14} /> },
    { id: "past", label: "Past", icon: <Clock size={14} /> },
  ];

  const getFilteredMatches = () => {
    switch (activeSubTab) {
      case "live":
        return matches.filter((m) => m.status === "live");
      case "upcoming":
        return matches.filter((m) => m.status === "scheduled");
      case "past":
        return matches.filter((m) => m.status === "completed");
      default:
        return [];
    }
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs
          tabs={subTabs}
          activeTab={activeSubTab}
          onChange={(id) => setActiveSubTab(id as TabStatus)}
          variant="pills"
          size="sm"
        />

        {isOwner && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Create Match
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState type={activeSubTab} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onUpdate={() => fetchMatches(tournament.id)}
            />
          ))}
        </div>
      )}

      <CreateMatchFlow
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        onMatchCreated={() => fetchMatches(tournament.id)}
      />
    </div>
  );
}
