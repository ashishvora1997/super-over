"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  ChevronLeft,
  Pencil,
  Settings,
  Shield,
  Gavel,
} from "lucide-react";
import { Tabs, TabPanel } from "@/app/components/ui/tabs";
import { AboutTab } from "@/app/components/tournament-detail/about-tab";
import { TeamsTab } from "@/app/components/tournament-detail/teams-tab";
import { MatchesTab } from "@/app/components/tournament-detail/matches-tab";
import { PointsTableTab } from "@/app/components/tournament-detail/points-table-tab";
import { TournamentFormModal } from "@/app/components/tournaments/tournament-form-modal";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { TournamentScorersModal } from "@/app/components/tournaments/tournament-scorers-modal";
import { TournamentRulesModal } from "@/app/components/tournaments/tournament-rules-modal";
import { useTournamentStore } from "@/app/store/tournament.store";
import { useAuthStore } from "@/app/store/auth.store";
import { Tournament, TournamentStatus } from "@/app/types/tournaments.types";
import { getTournament } from "@/app/services/tournament.service";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

function getStatusBadgeStyles(status: TournamentStatus) {
  const styles = {
    upcoming: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
    },
    ongoing: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500 animate-pulse",
    },
    completed: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      dot: "bg-gray-400",
    },
  };
  return styles[status] || styles.upcoming;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = Number(params.id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [showActions, setShowActions] = useState(false);

  const { deleteTournament, fetchTournaments } = useTournamentStore();
  const { user } = useAuthStore();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scorersModalOpen, setScorersModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const isOwner = user?.id !== undefined && tournament?.created_by === user.id;

  useEffect(() => {
    loadTournament();
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const response = await getTournament(tournamentId);
      setTournament(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      router.push("/my-cricket?tab=tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tournament) return;
    try {
      await deleteTournament(tournament.id);
      toast.success("Tournament deleted");
      router.push("/my-cricket?tab=tournaments");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleTournamentUpdated = () => {
    loadTournament();
    fetchTournaments();
  };

  const tabs = [
    { id: "about", label: "About", icon: <Trophy size={16} /> },
    { id: "teams", label: "Teams", icon: <Users size={16} /> },
    { id: "matches", label: "Matches", icon: <Calendar size={16} /> },
    { id: "points", label: "Points Table", icon: <BarChart3 size={16} /> },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
          <div className="h-12 bg-gray-100 rounded-xl mb-6" />
          <div className="h-64 bg-gray-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-muted">Tournament not found</p>
        <button
          onClick={() => router.push("/my-cricket?tab=tournaments")}
          className="mt-4 text-primary hover:underline"
        >
          Back to Tournaments
        </button>
      </div>
    );
  }

  const statusStyles = getStatusBadgeStyles(tournament.status);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/my-cricket?tab=tournaments")}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Back to Tournaments
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {tournament.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}
                />
                {tournament.status.charAt(0).toUpperCase() +
                  tournament.status.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted flex-wrap">
              {tournament.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {tournament.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(tournament.start_date)} —{" "}
                {formatDate(tournament.end_date)}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Tournament Settings"
              >
                <Settings size={20} className="text-muted" />
              </button>

              {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowActions(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-lg z-50 py-1">
                    <button
                      onClick={() => {
                        setShowActions(false);
                        setEditModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil size={14} />
                      Edit Tournament
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        setScorersModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Shield size={14} />
                      Assign/Remove Scorers
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        setRulesModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Gavel size={14} />
                      Tournament Rules
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        setDeleteModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trophy size={14} />
                      Delete Tournament
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        className="mb-2"
      />

      <TabPanel>
        {activeTab === "about" && (
          <AboutTab
            tournament={tournament}
            onUpdate={handleTournamentUpdated}
          />
        )}
        {activeTab === "teams" && (
          <TeamsTab
            tournament={tournament}
            onUpdate={handleTournamentUpdated}
          />
        )}
        {activeTab === "matches" && <MatchesTab tournament={tournament} />}
        {activeTab === "points" && <PointsTableTab tournament={tournament} />}
      </TabPanel>

      <TournamentFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        mode="edit"
        tournament={tournament}
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      {isOwner && (
        <TournamentScorersModal
          open={scorersModalOpen}
          onClose={() => setScorersModalOpen(false)}
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          tournamentCreatorId={tournament.created_by}
        />
      )}

      {isOwner && (
        <TournamentRulesModal
          open={rulesModalOpen}
          onClose={() => setRulesModalOpen(false)}
          tournamentId={tournament.id}
        />
      )}
    </div>
  );
}
