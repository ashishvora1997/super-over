"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Settings2,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";
import {
  getTournamentRules,
  upsertTournamentRules,
} from "@/app/services/tournament.service";
import { TournamentRules } from "@/app/types/tournaments.types";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
}

export function TournamentRulesModal({ open, onClose, tournamentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Partial<TournamentRules>>({
    wide_runs: 1,
    no_ball_runs: 1,
    count_wide_as_legal_delivery: false,
    count_no_ball_as_legal_delivery: false,
    ignore_wide_rule: false,
    ignore_no_ball_rule: false,
  });

  useEffect(() => {
    if (open) {
      fetchRules();
    }
  }, [open, tournamentId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await getTournamentRules(tournamentId);
      if (res.data) {
        setRules(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        tournament_id: tournamentId,
        wide_runs: rules.wide_runs,
        no_ball_runs: rules.no_ball_runs,
        count_wide_as_legal_delivery: rules.count_wide_as_legal_delivery,
        count_no_ball_as_legal_delivery: rules.count_no_ball_as_legal_delivery,
        ignore_wide_rule: rules.ignore_wide_rule,
        ignore_no_ball_rule: rules.ignore_no_ball_rule,
      };

      await upsertTournamentRules(payload);
      toast.success("Tournament rules updated successfully!");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (key: keyof TournamentRules, value: any) => {
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

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="Tournament Rules" onClose={handleClose} />
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="pb-5 space-y-6">
            <p className="text-sm text-muted -mt-1">
              Configure the default rules for this tournament. Matches created
              under this tournament will inherit these rules.
            </p>

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
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.ignore_wide_rule
                            ? "bg-primary border-primary"
                            : "border-muted"
                        }`}
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
                        If checked, wide deliveries will not be penalised
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
                        disabled={rules.ignore_wide_rule}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.count_wide_as_legal_delivery
                            ? "bg-primary border-primary"
                            : "border-muted"
                        }`}
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
                        disabled={rules.ignore_wide_rule}
                        onClick={() =>
                          updateRule(
                            "wide_runs",
                            Math.max(0, (rules.wide_runs || 1) - 1),
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">
                        {rules.wide_runs}
                      </span>
                      <button
                        type="button"
                        disabled={rules.ignore_wide_rule}
                        onClick={() =>
                          updateRule("wide_runs", (rules.wide_runs || 1) + 1)
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.ignore_no_ball_rule
                            ? "bg-primary border-primary"
                            : "border-muted"
                        }`}
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
                        If checked, no ball deliveries will not be penalised
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
                        disabled={rules.ignore_no_ball_rule}
                        className="peer sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                          rules.count_no_ball_as_legal_delivery
                            ? "bg-primary border-primary"
                            : "border-muted"
                        }`}
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
                        disabled={rules.ignore_no_ball_rule}
                        onClick={() =>
                          updateRule(
                            "no_ball_runs",
                            Math.max(0, (rules.no_ball_runs || 1) - 1),
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">
                        {rules.no_ball_runs}
                      </span>
                      <button
                        type="button"
                        disabled={rules.ignore_no_ball_rule}
                        onClick={() =>
                          updateRule(
                            "no_ball_runs",
                            (rules.no_ball_runs || 1) + 1,
                          )
                        }
                        className="text-muted hover:text-foreground text-lg font-medium w-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
      <ModalFooter>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Rules
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
