"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Save, RefreshCw, Shield } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";
import {
  getMatchRules,
  updateMatchRules,
} from "@/app/services/matches.service";
import { MatchRules } from "@/app/types/match.types";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  matchId: number;
  isOwner: boolean;
}

export function MatchRulesModal({ open, onClose, matchId, isOwner }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Partial<MatchRules>>({
    wide_runs: 1,
    no_ball_runs: 1,
    count_wide_as_legal_delivery: false,
    count_no_ball_as_legal_delivery: false,
    ignore_wide_rule: false,
    ignore_no_ball_rule: false,
    is_customized: false,
  });

  useEffect(() => {
    if (open) fetchRules();
  }, [open, matchId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await getMatchRules(matchId);
      if (res.data) setRules(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMatchRules(matchId, {
        wide_runs: rules.wide_runs,
        no_ball_runs: rules.no_ball_runs,
        count_wide_as_legal_delivery: rules.count_wide_as_legal_delivery,
        count_no_ball_as_legal_delivery: rules.count_no_ball_as_legal_delivery,
        ignore_wide_rule: rules.ignore_wide_rule,
        ignore_no_ball_rule: rules.ignore_no_ball_rule,
      });
      toast.success("Match rules updated!");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateRule = <K extends keyof MatchRules>(
    key: K,
    value: MatchRules[K],
  ) => {
    setRules((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "ignore_wide_rule" && value === true) {
        updated.count_wide_as_legal_delivery = false;
        updated.wide_runs = 1;
      }
      if (key === "count_wide_as_legal_delivery" && value === true) {
        updated.ignore_wide_rule = false;
      }

      if (key === "ignore_no_ball_rule" && value === true) {
        updated.count_no_ball_as_legal_delivery = false;
        updated.no_ball_runs = 1;
      }
      if (key === "count_no_ball_as_legal_delivery" && value === true) {
        updated.ignore_no_ball_rule = false;
      }

      return updated;
    });
  };

  const isTournamentMatch = rules.tournament_id != null;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="Match Rules" onClose={handleClose} />
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="pb-5 space-y-5">
            {isTournamentMatch && (
              <div
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium ${
                  rules.is_customized
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                {rules.is_customized ? (
                  <Shield size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                {rules.is_customized
                  ? "Custom Match Rules — changes won't sync with tournament"
                  : "Using Tournament Rules — auto-synced with tournament updates"}
              </div>
            )}

            {!isOwner && (
              <p className="text-xs text-muted bg-gray-50 border border-border rounded-xl p-3">
                You are viewing match rules. Only the match creator can edit
                them.
              </p>
            )}

            <div className="space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Wide Rules
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={rules.ignore_wide_rule}
                        onChange={(e) =>
                          updateRule("ignore_wide_rule", e.target.checked)
                        }
                        disabled={!isOwner}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.ignore_wide_rule
                            ? "bg-primary border-primary"
                            : "border-muted"
                        } ${!isOwner ? "opacity-60" : ""}`}
                      >
                        {rules.ignore_wide_rule && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Ignore Wide Rule
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        Wide deliveries will not be penalised
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 cursor-pointer group ${rules.ignore_wide_rule ? "opacity-50" : ""}`}
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={rules.count_wide_as_legal_delivery}
                        onChange={(e) =>
                          updateRule(
                            "count_wide_as_legal_delivery",
                            e.target.checked,
                          )
                        }
                        disabled={!isOwner || rules.ignore_wide_rule}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.count_wide_as_legal_delivery
                            ? "bg-primary border-primary"
                            : "border-muted"
                        } ${!isOwner || rules.ignore_wide_rule ? "opacity-60" : ""}`}
                      >
                        {rules.count_wide_as_legal_delivery && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Count Wide as Legal Delivery
                      </p>
                    </div>
                  </label>

                  <div
                    className={`flex items-center justify-between ${rules.ignore_wide_rule ? "opacity-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      Wide Runs
                    </p>
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-border">
                      <button
                        type="button"
                        disabled={!isOwner || rules.ignore_wide_rule}
                        onClick={() =>
                          updateRule(
                            "wide_runs",
                            Math.max(0, (rules.wide_runs || 1) - 1),
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">
                        {rules.wide_runs}
                      </span>
                      <button
                        type="button"
                        disabled={!isOwner || rules.ignore_wide_rule}
                        onClick={() =>
                          updateRule("wide_runs", (rules.wide_runs || 1) + 1)
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  No Ball Rules
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={rules.ignore_no_ball_rule}
                        onChange={(e) =>
                          updateRule("ignore_no_ball_rule", e.target.checked)
                        }
                        disabled={!isOwner}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.ignore_no_ball_rule
                            ? "bg-primary border-primary"
                            : "border-muted"
                        } ${!isOwner ? "opacity-60" : ""}`}
                      >
                        {rules.ignore_no_ball_rule && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Ignore No Ball Rule
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        No ball deliveries will not be penalised
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 cursor-pointer group ${rules.ignore_no_ball_rule ? "opacity-50" : ""}`}
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={rules.count_no_ball_as_legal_delivery}
                        onChange={(e) =>
                          updateRule(
                            "count_no_ball_as_legal_delivery",
                            e.target.checked,
                          )
                        }
                        disabled={!isOwner || rules.ignore_no_ball_rule}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.count_no_ball_as_legal_delivery
                            ? "bg-primary border-primary"
                            : "border-muted"
                        } ${!isOwner || rules.ignore_no_ball_rule ? "opacity-60" : ""}`}
                      >
                        {rules.count_no_ball_as_legal_delivery && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Count No Ball as Legal Delivery
                      </p>
                    </div>
                  </label>

                  <div
                    className={`flex items-center justify-between ${rules.ignore_no_ball_rule ? "opacity-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      No Ball Runs
                    </p>
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-border">
                      <button
                        type="button"
                        disabled={!isOwner || rules.ignore_no_ball_rule}
                        onClick={() =>
                          updateRule(
                            "no_ball_runs",
                            Math.max(0, (rules.no_ball_runs || 1) - 1),
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">
                        {rules.no_ball_runs}
                      </span>
                      <button
                        type="button"
                        disabled={!isOwner || rules.ignore_no_ball_rule}
                        onClick={() =>
                          updateRule(
                            "no_ball_runs",
                            (rules.no_ball_runs || 1) + 1,
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      {isOwner && (
        <ModalFooter>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Rules
              </>
            )}
          </button>
        </ModalFooter>
      )}
    </Modal>
  );
}
