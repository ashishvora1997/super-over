"use client";

import { Trophy, User } from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/app/components/ui/modal/modal";

export type TeamCreationType = "tournament" | "individual";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: TeamCreationType) => void;
}

export function TeamTypeSelector({ open, onClose, onSelect }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Create Team" onClose={onClose} />
      <ModalBody>
        <p className="text-sm text-muted -mt-1 mb-4">
          How would you like to create this team?
        </p>

        <div className="grid grid-cols-1 gap-3 pb-6">
          <button
            onClick={() => onSelect("tournament")}
            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-white hover:border-primary hover:bg-primary/[0.03] transition-all text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
              <Trophy size={20} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                Tournament Team
              </p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Create a team and assign it to a tournament
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelect("individual")}
            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-white hover:border-primary hover:bg-primary/[0.03] transition-all text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                Individual Team
              </p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Create a standalone team — no tournament link
              </p>
            </div>
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
