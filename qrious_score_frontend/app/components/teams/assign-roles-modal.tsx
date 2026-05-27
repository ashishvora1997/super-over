"use client";

import { useState, useEffect } from "react";
import { Crown, Shield, Check, Loader2, ChevronRight } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";
import { setCaptain, setWicketKeeper } from "@/app/services/teams.service";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

interface Player {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  players: Player[];
  currentCaptainId?: number;
  currentWicketKeeperId?: number;
  onRolesUpdated: () => void;
}

type Step = "captain" | "wicket_keeper";

export function AssignRolesModal({
  open,
  onClose,
  teamId,
  teamName,
  players,
  currentCaptainId,
  currentWicketKeeperId,
  onRolesUpdated,
}: Props) {
  const [step, setStep] = useState<Step>("captain");
  const [selectedCaptain, setSelectedCaptain] = useState<number | null>(null);
  const [selectedWK, setSelectedWK] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("captain");
      setSelectedCaptain(currentCaptainId ?? null);
      setSelectedWK(currentWicketKeeperId ?? null);
    }
  }, [open, currentCaptainId, currentWicketKeeperId]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleNext = () => {
    setStep("wicket_keeper");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedCaptain !== currentCaptainId) {
        await setCaptain({ team_id: teamId, player_id: selectedCaptain });
      }

      if (selectedWK !== currentWicketKeeperId) {
        await setWicketKeeper({ team_id: teamId, player_id: selectedWK });
      }

      toast.success("Team roles updated successfully!");
      onRolesUpdated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    captain: {
      icon: <Crown size={16} />,
      title: "Captain",
      description: "Select a player to lead the team",
      color: "amber",
    },
    wicket_keeper: {
      icon: <Shield size={16} />,
      title: "Wicket Keeper",
      description: "Select the designated wicket keeper",
      color: "blue",
    },
  };

  const currentStep = stepConfig[step];
  const selectedId = step === "captain" ? selectedCaptain : selectedWK;
  const setSelected = step === "captain" ? setSelectedCaptain : setSelectedWK;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="Assign Team Roles" onClose={handleClose} />

      <ModalBody>
        <div className="flex gap-2 mb-1">
          <button
            type="button"
            onClick={() => setStep("captain")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              step === "captain"
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : selectedCaptain
                  ? "bg-amber-50/50 text-amber-600 border-amber-200/60"
                  : "bg-gray-50 text-muted border-border"
            }`}
          >
            <Crown size={14} />
            Captain
            {selectedCaptain && step !== "captain" && (
              <Check size={13} className="text-amber-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setStep("wicket_keeper")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              step === "wicket_keeper"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : selectedWK
                  ? "bg-blue-50/50 text-blue-600 border-blue-200/60"
                  : "bg-gray-50 text-muted border-border"
            }`}
          >
            <Shield size={14} />
            Wicket Keeper
            {selectedWK && step !== "wicket_keeper" && (
              <Check size={13} className="text-blue-500" />
            )}
          </button>
        </div>

        <div
          className={`flex items-center gap-2.5 p-3 rounded-xl ${
            step === "captain" ? "bg-amber-50/60" : "bg-blue-50/60"
          }`}
        >
          <span
            className={`${step === "captain" ? "text-amber-600" : "text-blue-600"}`}
          >
            {currentStep.icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentStep.title}
            </p>
            <p className="text-xs text-muted">{currentStep.description}</p>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[280px] overflow-y-auto -mx-1 px-1">
          {players.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted">No players in the squad</p>
              <p className="text-xs text-muted mt-1">
                Add players to the team first
              </p>
            </div>
          ) : (
            players.map((player) => {
              const isSelected = selectedId === player.id;
              const isCaptain =
                player.id === selectedCaptain && step !== "captain";
              const isWK = player.id === selectedWK && step !== "wicket_keeper";

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : player.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? step === "captain"
                        ? "bg-amber-50 border-amber-300 shadow-sm"
                        : "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-white border-border/60 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isSelected
                        ? step === "captain"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-blue-200 text-blue-800"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {player.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isCaptain && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          <Crown size={8} /> Captain
                        </span>
                      )}
                      {isWK && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          WK
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? step === "captain"
                          ? "bg-amber-500 border-amber-500"
                          : "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        {step === "captain" ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Next
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={15} />
                Save Roles
              </>
            )}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
