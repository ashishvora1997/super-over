"use client";

import { useState } from "react";
import {
  Mail,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/app/components/ui/modal/modal";
import { addPlayerByEmail } from "@/app/services/teams.service";
import { getErrorMessage } from "@/app/utils/error-handler";

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  onPlayerAdded: () => void;
}

export function AddPlayerByEmailModal({
  open,
  onClose,
  teamId,
  teamName,
  onPlayerAdded,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await addPlayerByEmail({ team_id: teamId, email: trimmedEmail });
      setSuccess(`Player added to ${teamName} successfully!`);
      setEmail("");
      onPlayerAdded();

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="Add Player" onClose={handleClose} />
      <ModalBody>
        <div className="pb-5">
          <p className="text-sm text-muted -mt-1 mb-5">
            Enter the email address of a verified user to add them to{" "}
            <span className="font-semibold text-foreground">{teamName}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Player Email
              </label>
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
                  placeholder="player@example.com"
                  disabled={loading}
                  autoFocus
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
              disabled={loading || !email.trim() || !!success}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Player
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-muted mt-4 text-center leading-relaxed">
            The user must have a verified email account on Qrious Score.
            <br />A player profile will be created automatically if needed.
          </p>
        </div>
      </ModalBody>
    </Modal>
  );
}
