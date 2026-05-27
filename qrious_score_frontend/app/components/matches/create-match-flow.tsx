"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Plus,
  Search,
  Check,
  Zap,
  Loader2,
  Trophy,
  Users,
  Swords,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";
import { Input } from "@/app/components/ui/input";
import { ConflictModal } from "@/app/components/ui/modal/conflict-modal";
import { useMatchStore } from "@/app/store/matches.store";
import { useAuthStore } from "@/app/store/auth.store";
import { getTeams } from "@/app/services/teams.service";
import {
  getTournament,
  getTournaments,
} from "@/app/services/tournament.service";
import { getErrorMessage } from "@/app/utils/error-handler";
import { formatDate } from "@/app/utils/format";
import toast from "react-hot-toast";

interface TeamOption {
  id: number;
  name: string;
  city?: string;
}
interface TournamentOption {
  id: number;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
}
interface Conflict {
  type: string;
  message: string;
  items?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId?: number | null;
  tournamentName?: string;
  onMatchCreated?: () => void;
}

type Step = "type" | "tournament" | "teams" | "teamPicker" | "config";
type TeamSlot = "A" | "B";
type TeamTab = "tournament" | "your";

export function CreateMatchFlow({
  open,
  onClose,
  tournamentId,
  tournamentName,
  onMatchCreated,
}: Props) {
  const { createMatch } = useMatchStore();
  const { user } = useAuthStore();

  const isTournamentContext = !!tournamentId;

  const [step, setStep] = useState<Step>(
    isTournamentContext ? "teams" : "type",
  );
  const [matchType, setMatchType] = useState<
    "tournament" | "individual" | null
  >(isTournamentContext ? "tournament" : null);

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<TournamentOption | null>(
      isTournamentContext && tournamentId
        ? { id: tournamentId, name: tournamentName || "", status: "" }
        : null,
    );

  const [selectingSlot, setSelectingSlot] = useState<TeamSlot | null>(null);
  const [teamTab, setTeamTab] = useState<TeamTab>(
    isTournamentContext ? "tournament" : "your",
  );
  const [teamA, setTeamA] = useState<TeamOption | null>(null);
  const [teamB, setTeamB] = useState<TeamOption | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<TeamOption[]>([]);
  const [yourTeams, setYourTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [overs, setOvers] = useState(20);
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictOpen, setConflictOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(isTournamentContext ? "teams" : "type");
    setMatchType(isTournamentContext ? "tournament" : null);
    setSelectedTournament(
      isTournamentContext && tournamentId
        ? { id: tournamentId, name: tournamentName || "", status: "" }
        : null,
    );
    setSelectingSlot(null);
    setTeamA(null);
    setTeamB(null);
    setOvers(20);
    setMatchDate("");
    setVenue("");
    setErrors({});
    setSearchQuery("");
    setTeamTab(isTournamentContext ? "tournament" : "your");
    setConflicts([]);
    setConflictOpen(false);
  }, [open, tournamentId, tournamentName, isTournamentContext]);

  const fetchTournamentsList = useCallback(async () => {
    try {
      setTournamentsLoading(true);
      const res = await getTournaments("", 1, 50);
      setTournaments(res.data || []);
    } catch {
      setTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "tournament") fetchTournamentsList();
  }, [step, fetchTournamentsList]);

  const fetchTournamentTeams = useCallback(async () => {
    const tid = selectedTournament?.id || tournamentId;
    if (!tid) return;
    try {
      setTeamsLoading(true);
      const res = await getTournament(tid);
      setTournamentTeams(res.data.teams || []);
    } catch {
      setTournamentTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, [selectedTournament, tournamentId]);

  const fetchYourTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      const res = await getTeams({ page: 1, limit: 100 });
      setYourTeams(res.data || []);
    } catch {
      setYourTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step !== "teamPicker") return;
    if (teamTab === "tournament") fetchTournamentTeams();
    else fetchYourTeams();
  }, [step, teamTab, fetchTournamentTeams, fetchYourTeams]);

  useEffect(() => {
    if (!open) return;
    const tid = selectedTournament?.id || tournamentId;
    if (tid && !selectedTournament?.start_date) {
      getTournament(tid)
        .then((res) => {
          if (res.data) {
            setSelectedTournament(res.data);
          }
        })
        .catch(() => {});
    }
  }, [open, selectedTournament, tournamentId]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const activeTournamentId = selectedTournament?.id || tournamentId || null;
  const otherTeamId = selectingSlot === "A" ? teamB?.id : teamA?.id;

  const getFilteredTeams = () => {
    const source = teamTab === "tournament" ? tournamentTeams : yourTeams;
    let filtered = source.filter((t) => t.id !== otherTeamId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }
    return filtered;
  };

  const handleTeamSelect = (team: TeamOption) => {
    if (team.id === otherTeamId) {
      toast.error("Both teams cannot be the same");
      return;
    }
    if (selectingSlot === "A") setTeamA(team);
    else setTeamB(team);
    setStep("teams");
    setSearchQuery("");
  };

  const oversPerBowler = Math.ceil(overs / 5);

  const parseConflicts = (err: unknown): Conflict[] | null => {
    const resp = (
      err as {
        response?: {
          data?: {
            message?: { conflicts?: Conflict[] };
            conflicts?: Conflict[];
          };
        };
      }
    )?.response?.data;
    if (resp?.message?.conflicts) return resp.message.conflicts;
    if (resp?.conflicts) return resp.conflicts;
    return null;
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!teamA) newErrors.teamA = "Select Team A";
    if (!teamB) newErrors.teamB = "Select Team B";
    if (!matchDate) newErrors.matchDate = "Match date is required";
    if (!overs || overs < 1) newErrors.overs = "Overs must be at least 1";

    if (
      matchType === "tournament" &&
      selectedTournament?.start_date &&
      selectedTournament?.end_date &&
      matchDate
    ) {
      const matchDay = new Date(matchDate);
      const start = new Date(selectedTournament.start_date);
      const end = new Date(selectedTournament.end_date);

      if (matchDay < start || matchDay > end) {
        newErrors.matchDate = "Match date must be between tournament dates";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await createMatch({
        tournament_id: activeTournamentId || undefined,
        team_a_id: teamA!.id,
        team_b_id: teamB!.id,
        match_date: matchDate,
        venue: venue || undefined,
        overs_per_side: overs,
      });
      toast.success("Match created successfully!");
      onMatchCreated?.();
      onClose();
    } catch (err) {
      const c = parseConflicts(err);
      if (c && c.length > 0) {
        setConflicts(c);
        setConflictOpen(true);
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "type") {
    return (
      <Modal open={open} onClose={handleClose}>
        <ModalHeader title="New Match" onClose={handleClose} />
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              What type of match do you want to create?
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMatchType("tournament");
                  setStep("tournament");
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 bg-white border-border hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy size={22} className="text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground">
                    Tournament Match
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Part of an existing tournament
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMatchType("individual");
                  setTeamTab("your");
                  setStep("teams");
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 bg-white border-border hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Swords size={22} className="text-emerald-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground">
                    Individual Match
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Standalone match between any two teams
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  if (step === "tournament") {
    return (
      <Modal open={open} onClose={handleClose}>
        <ModalHeader title="Select Tournament" onClose={handleClose} />
        <ModalBody>
          <div className="space-y-4">
            <button
              onClick={() => setStep("type")}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {tournamentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-border">
                <Trophy size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted">No tournaments found</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto -mx-1 px-1">
                {tournaments.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTournament(t);
                      setTeamTab("tournament");
                      setStep("teams");
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 bg-white border-border/60 hover:border-primary/30 hover:bg-gray-50/50 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted capitalize">
                        {t.status}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>
    );
  }

  if (step === "teamPicker" && selectingSlot) {
    const filteredTeams = getFilteredTeams();
    const currentSelection = selectingSlot === "A" ? teamA : teamB;
    const showTournamentTabs =
      matchType === "tournament" && !!activeTournamentId;

    return (
      <Modal open={open} onClose={handleClose}>
        <ModalHeader
          title={`Select Team ${selectingSlot}`}
          onClose={handleClose}
        />
        <ModalBody>
          <div className="space-y-4">
            <button
              onClick={() => {
                setStep("teams");
                setSearchQuery("");
              }}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} /> Back to teams
            </button>
            {showTournamentTabs && (
              <div className="flex gap-2">
                {(["tournament", "your"] as TeamTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTeamTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${teamTab === tab ? "bg-primary/10 text-primary border-primary/30" : "bg-gray-50 text-muted border-border"}`}
                  >
                    {tab === "tournament" ? (
                      <>
                        <Trophy size={14} /> Tournament Teams
                      </>
                    ) : (
                      <>
                        <Users size={14} /> Your Teams
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted/50"
              />
            </div>
            {teamsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-border">
                <Shield size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted">No teams found</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto -mx-1 px-1">
                {filteredTeams.map((team) => {
                  const isSelected = currentSelection?.id === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleTeamSelect(team)}
                      className={`w-full flex flex-col gap-1 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/30 shadow-sm"
                          : "bg-white border-border/60 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {team.name}
                          </p>
                          {team.city && (
                            <p className="text-xs text-muted">{team.city}</p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>
    );
  }

  if (step === "teams") {
    const title = selectedTournament
      ? `New Match — ${selectedTournament.name}`
      : matchType === "individual"
        ? "New Individual Match"
        : "New Match";
    return (
      <Modal open={open} onClose={handleClose}>
        <ModalHeader title={title} onClose={handleClose} />
        <ModalBody>
          <div className="space-y-5">
            {!isTournamentContext && (
              <button
                onClick={() => {
                  if (matchType === "tournament") setStep("tournament");
                  else setStep("type");
                }}
                className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <p className="text-sm text-muted">
              Select two teams to compete. Tap on a team slot to choose.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSelectingSlot("A");
                  setStep("teamPicker");
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${teamA ? "bg-primary/5 border-primary/20" : errors.teamA ? "bg-red-50 border-red-200" : "bg-gray-50 border-dashed border-border hover:border-primary/30"}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${teamA ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {teamA ? teamA.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Team A
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {teamA ? teamA.name : "Tap to select team"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
              {errors.teamA && (
                <p className="text-xs text-destructive -mt-1 ml-1">
                  {errors.teamA}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted bg-gray-100 px-3 py-1 rounded-full">
                  VS
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectingSlot("B");
                  setStep("teamPicker");
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${teamB ? "bg-primary/5 border-primary/20" : errors.teamB ? "bg-red-50 border-red-200" : "bg-gray-50 border-dashed border-border hover:border-primary/30"}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${teamB ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {teamB ? teamB.name.charAt(0).toUpperCase() : "B"}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Team B
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {teamB ? teamB.name : "Tap to select team"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
              {errors.teamB && (
                <p className="text-xs text-destructive -mt-1 ml-1">
                  {errors.teamB}
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => {
              if (!teamA || !teamB) {
                setErrors({
                  ...(!teamA ? { teamA: "Select Team A" } : {}),
                  ...(!teamB ? { teamB: "Select Team B" } : {}),
                });
                return;
              }
              if (teamA.id === teamB.id) {
                setErrors({ teamB: "Both teams cannot be the same" });
                return;
              }
              setErrors({});
              setStep("config");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
          >
            Next: Match Configuration <ChevronRight size={16} />
          </button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <ModalHeader title="Match Configuration" onClose={handleClose} />
        <ModalBody>
          <div className="space-y-5">
            <button
              onClick={() => setStep("teams")}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} /> Back to team selection
            </button>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border">
              <div className="flex-1 text-center">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold mx-auto mb-1">
                  {teamA?.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">
                  {teamA?.name}
                </p>
              </div>
              <span className="text-xs font-bold text-muted">VS</span>
              <div className="flex-1 text-center">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold mx-auto mb-1">
                  {teamB?.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">
                  {teamB?.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Number of Overs"
                required
                type="number"
                min={1}
                max={50}
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value) || 1)}
                error={errors.overs}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                  Overs / Bowler
                </label>
                <div className="flex items-center gap-2 py-2.5 px-3 bg-gray-100 rounded-xl border border-border text-sm font-semibold text-foreground">
                  <Zap size={14} className="text-primary" />
                  {oversPerBowler}
                </div>
                <p className="text-[10px] text-muted">Auto-calculated</p>
              </div>
            </div>
            <Input
              label="Match Date & Time"
              required
              type="datetime-local"
              value={matchDate}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => {
                setMatchDate(e.target.value);
                if (errors.matchDate)
                  setErrors((p) => ({ ...p, matchDate: "" }));
              }}
              error={errors.matchDate}
            />
            <Input
              label="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Wankhede Stadium"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create Match
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
      <ConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        conflicts={conflicts}
      />
    </>
  );
}
