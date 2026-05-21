"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Crown,
  Settings2,
} from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/app/components/ui/modal/modal";
import {
  getTournamentScorers,
  addTournamentScorer,
  removeTournamentScorer,
} from "@/app/services/tournament.service";
import { TournamentScorer } from "@/app/types/tournaments.types";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  tournamentName: string;
  tournamentCreatorId?: number;
}

export function TournamentScorersModal({
  open,
  onClose,
  tournamentId,
  tournamentName,
  tournamentCreatorId,
}: Props) {
  const [email, setEmail] = useState("");
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) {
      fetchScorers();
      setEmail("");
      setError("");
      setSuccess("");
    }
  }, [open, tournamentId]);

  const fetchScorers = async () => {
    try {
      setLoading(true);
      const res = await getTournamentScorers(tournamentId);
      setScorers(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (actionLoading) return;
    onClose();
  };

  const handleAddScorer = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await addTournamentScorer({
        tournament_id: tournamentId,
        email: trimmedEmail,
      });
      setSuccess(`Scorer added successfully!`);
      setEmail("");
      fetchScorers();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveScorer = async (userId: number) => {
    try {
      setActionLoading(true);
      await removeTournamentScorer({
        tournament_id: tournamentId,
        user_id: userId,
      });
      toast.success("Scorer removed successfully");
      fetchScorers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="Manage Scorers" onClose={handleClose} />
      <ModalBody>
        <div className="pb-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Add New Scorer
            </h3>
            <form onSubmit={handleAddScorer} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                      if (success) setSuccess("");
                    }}
                    placeholder="scorer@example.com"
                    disabled={actionLoading || loading}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted/50 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle
                    size={16}
                    className="text-red-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle
                    size={16}
                    className="text-emerald-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Scorer
                  </>
                )}
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Current Scorers
              </h3>
              <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                {scorers.length} / 3
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : scorers.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted">No scorers found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scorers.map((scorer) => {
                  const isOwner = scorer.user_id === tournamentCreatorId;

                  return (
                    <div
                      key={scorer.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {scorer.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {scorer.user.name}
                            {isOwner && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                                <Crown size={9} />
                                Owner
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted">
                            {scorer.user.email}
                          </p>
                        </div>
                      </div>

                      {!isOwner && (
                        <button
                          onClick={() => handleRemoveScorer(scorer.user_id)}
                          disabled={actionLoading}
                          className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove Scorer"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
