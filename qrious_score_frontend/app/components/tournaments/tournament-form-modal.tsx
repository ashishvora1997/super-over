"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { useTournamentStore } from "@/app/store/tournament.store";
import { Tournament, TournamentStatus } from "@/app/types/tournaments.types";
import toast from "react-hot-toast";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { getErrorMessage } from "@/app/utils/error-handler";
import { Input } from "../ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  tournament?: Tournament | null;
}

const EMPTY_FORM = {
  name: "",
  city: "",
  organiser_name: "",
  organiser_email: "",
  start_date: "",
  end_date: "",
};

export function TournamentFormModal({
  open,
  onClose,
  mode,
  tournament,
}: Props) {
  const { createTournament, updateTournament } = useTournamentStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && tournament) {
      setForm({
        name: tournament.name || "",
        city: tournament.city || "",
        organiser_name: tournament.organiser_name || "",
        organiser_email: tournament.organiser_email || "",
        start_date: tournament.start_date?.slice(0, 10) || "",
        end_date: tournament.end_date?.slice(0, 10) || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [mode, tournament, open]);

  const set = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.organiser_name.trim())
      newErrors.organiser_name = "Organiser name is required";
    if (!form.organiser_email.trim())
      newErrors.organiser_email = "Organiser email is required";
    if (!form.start_date) newErrors.start_date = "Start date is required";
    if (!form.end_date) newErrors.end_date = "End date is required";
    else if (form.end_date < form.start_date)
      newErrors.end_date = "End date must be after start date";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      if (mode === "create") {
        await createTournament(form);
        toast.success("Tournament created!");
      } else {
        if (!tournament) return;
        await updateTournament({ id: tournament.id, ...form });
        toast.success("Tournament updated!");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Tournament" : "Edit Tournament"}
      onSubmit={handleSubmit}
      submitText={mode === "create" ? "Create Tournament" : "Save Changes"}
      loading={loading}
    >
      <div className="space-y-1.5">
        <Input
          label="Tournament Name"
          required
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. IPL 2025"
          error={errors.name}
        />
      </div>

      <div className="space-y-1.5">
        <Input
          label="City"
          value={form.city || ""}
          onChange={(e) => set("city", e.target.value)}
          placeholder="e.g. Mumbai, India"
          error={errors.city}
        />
      </div>

      <div className="space-y-1.5">
        <Input
          label="Organiser Name"
          required
          value={form.organiser_name || ""}
          onChange={(e) => set("organiser_name", e.target.value)}
          placeholder="e.g. John Doe"
          error={errors.organiser_name}
        />
      </div>

      <div className="space-y-1.5">
        <Input
          label="Organiser Email"
          required
          type="email"
          value={form.organiser_email || ""}
          onChange={(e) => set("organiser_email", e.target.value)}
          placeholder="e.g. john@example.com"
          error={errors.organiser_email}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          required
          type="date"
          value={form.start_date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => set("start_date", e.target.value)}
          error={errors.start_date}
        />
        <Input
          label="End Date"
          required
          type="date"
          value={form.end_date}
          min={form.start_date || undefined}
          onChange={(e) => set("end_date", e.target.value)}
          error={errors.end_date}
        />
      </div>
    </FormModal>
  );
}
