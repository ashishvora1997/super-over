"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/app/components/ui/modal/modal";
import { Input } from "@/app/components/ui/input";
import { Match } from "@/app/types/match.types";
import { updateMatch } from "@/app/services/matches.service";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { getErrorMessage } from "@/app/utils/error-handler";

interface Props {
  open: boolean;
  onClose: () => void;
  match: Match;
  onSuccess: () => void;
}

export function EditMatchModal({ open, onClose, match, onSuccess }: Props) {
  const [matchDate, setMatchDate] = useState(() => {
    if (!match.match_date) return "";
    const d = new Date(match.match_date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [venue, setVenue] = useState(match.venue || "");
  const [overs, setOvers] = useState(match.overs_per_side || 20);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateMatch({
        id: match.id,
        match_date: new Date(matchDate).toISOString(),
        venue,
        overs_per_side: overs,
      });
      toast.success("Match updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Edit Match" onClose={onClose} />
      <ModalBody>
        <div className="space-y-4">
          <Input
            label="Match Date & Time"
            type="datetime-local"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
          />
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
          <Input
            label="Number of Overs"
            type="number"
            min={1}
            max={50}
            value={overs}
            onChange={(e) => setOvers(Number(e.target.value))}
            required
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={handleSubmit}
          disabled={loading || !matchDate || !overs}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Changes
        </button>
      </ModalFooter>
    </Modal>
  );
}
