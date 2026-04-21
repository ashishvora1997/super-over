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

const getStatusOptions = (mode: "create" | "edit") => {
  const options: { value: TournamentStatus; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
  ];
  if (mode === "edit") {
    options.push({ value: "completed", label: "Completed" });
  }
  return options;
};

const EMPTY_FORM = {
  name: "",
  location: "",
  start_date: "",
  end_date: "",
  status: "upcoming" as TournamentStatus,
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
    if (mode === "edit" && tournament) {
      console.log("Inside edit...");
      console.log("tournament.location::", tournament.location);
      setForm({
        name: tournament.name || "",
        location: tournament.location || "",
        start_date: tournament.start_date?.slice(0, 10) || "",
        end_date: tournament.end_date?.slice(0, 10) || "",
        status: tournament.status || "upcoming",
      });
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
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. IPL 2025"
          error={errors.name}
        />
      </div>

      <div className="space-y-1.5">
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="e.g. Mumbai, India"
          error={errors.location}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          required
          type="date"
          value={form.start_date}
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

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Status
        </label>
        <div className="flex gap-2">
          {getStatusOptions(mode).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("status", opt.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                form.status === opt.value
                  ? opt.value === "upcoming"
                    ? "bg-blue-600 text-white border-blue-600"
                    : opt.value === "ongoing"
                      ? "bg-accent text-white border-accent"
                      : "bg-gray-600 text-white border-gray-600"
                  : "bg-white text-muted border-border hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </FormModal>
  );
}
