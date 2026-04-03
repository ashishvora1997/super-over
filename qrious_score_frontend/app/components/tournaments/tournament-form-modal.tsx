"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { useTournamentStore } from "@/app/store/tournament.store";
import { TournamentStatus } from "@/app/types/tournaments.types";
import toast from "react-hot-toast";
import { Calendar, MapPin, Trophy } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  tournament?: any;
}

const STATUS_OPTIONS: { value: TournamentStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  //   { value: "completed", label: "Completed" },
];

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
  const [loading, setLoading] = useState(false);

  // Prefill on edit
  useEffect(() => {
    if (mode === "edit" && tournament) {
      setForm({
        name: tournament.name || "",
        location: tournament.location || "",
        start_date: tournament.start_date?.slice(0, 10) || "",
        end_date: tournament.end_date?.slice(0, 10) || "",
        status: tournament.status || "upcoming",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mode, tournament, open]);

  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.start_date) return toast.error("Start date is required");
    if (!form.end_date) return toast.error("End date is required");
    if (form.end_date < form.start_date)
      return toast.error("End date must be after start date");

    try {
      setLoading(true);
      if (mode === "create") {
        await createTournament(form);
        toast.success("Tournament created!");
      } else {
        await updateTournament({ id: tournament.id, ...form });
        toast.success("Tournament updated!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
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
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Tournament Name
        </label>
        <div className="relative">
          <Trophy
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. IPL 2025"
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Location
        </label>
        <div className="relative">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Mumbai, India"
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Dates — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Start Date
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            End Date
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="date"
              value={form.end_date}
              min={form.start_date || undefined}
              onChange={(e) => set("end_date", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Status
        </label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
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
