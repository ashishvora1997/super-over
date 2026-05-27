"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  CalendarClock,
  ShieldAlert,
  Ban,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";

interface Conflict {
  type: string;
  message: string;
  items?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  conflicts: Conflict[];
}

const CONFLICT_ICONS: Record<string, typeof AlertTriangle> = {
  shared_players: Users,
  scheduling_conflict: CalendarClock,
  same_team: Ban,
  team_not_in_tournament: ShieldAlert,
  duplicate_match: ShieldAlert,
  team_not_found: ShieldAlert,
};

const CONFLICT_COLORS: Record<string, string> = {
  shared_players: "text-red-600 bg-red-50 border-red-200",
  scheduling_conflict: "text-amber-600 bg-amber-50 border-amber-200",
  same_team: "text-red-600 bg-red-50 border-red-200",
  team_not_in_tournament: "text-orange-600 bg-orange-50 border-orange-200",
  duplicate_match: "text-orange-600 bg-orange-50 border-orange-200",
  team_not_found: "text-red-600 bg-red-50 border-red-200",
};

const MAX_VISIBLE_ITEMS = 5;

function ConflictSection({ conflict }: { conflict: Conflict }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CONFLICT_ICONS[conflict.type] || AlertTriangle;
  const colorCls =
    CONFLICT_COLORS[conflict.type] || "text-red-600 bg-red-50 border-red-200";

  const items = conflict.items ?? [];
  const hasMore = items.length > MAX_VISIBLE_ITEMS;
  const visibleItems = expanded ? items : items.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <div className={`rounded-xl border p-4 ${colorCls}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60">
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{conflict.message}</p>
          {items.length > 0 && (
            <div className="mt-2 space-y-1">
              {visibleItems.map((item, i) => (
                <p
                  key={i}
                  className="text-xs font-medium flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 flex-shrink-0" />
                  {item}
                </p>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-semibold flex items-center gap-1 mt-1 hover:opacity-80 transition-opacity"
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      + {items.length - MAX_VISIBLE_ITEMS} more{" "}
                      <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConflictModal({ open, onClose, conflicts }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="" onClose={onClose} />
      <ModalBody>
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Match Cannot Be Created
            </h3>
            <p className="text-sm text-muted mt-1">
              {conflicts.length} validation issue
              {conflicts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="space-y-3">
            {conflicts.map((conflict, i) => (
              <ConflictSection key={i} conflict={conflict} />
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 text-foreground text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
        >
          Go Back & Fix
        </button>
      </ModalFooter>
    </Modal>
  );
}
