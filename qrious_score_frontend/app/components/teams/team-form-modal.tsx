"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Input } from "@/app/components/ui/input";
import { useTeamStore } from "@/app/store/teams.store";
import toast from "react-hot-toast";
import { Team } from "@/app/types/teams.types";
import { getErrorMessage } from "@/app/utils/error-handler";

export function TeamFormModal({
  open,
  onClose,
  mode = "create",
  team,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  team?: Team | null;
}) {
  const { createTeam, updateTeam } = useTeamStore();

  const [form, setForm] = useState({
    name: "",
    short_name: "",
    city: "",
    jersey_color: "",
    home_ground: "",
    founded_year: "",
    description: "",
  });

  const [errors, setErrors] = useState<{ name?: string; short_name?: string }>({});

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && team) {
      setForm({
        name: team.name || "",
        short_name: team.short_name || "",
        city: team.city || "",
        jersey_color: team.jersey_color || "",
        home_ground: team.home_ground || "",
        founded_year: team.founded_year?.toString() || "",
        description: team.description || "",
      });
    } else {
      setForm({
        name: "",
        short_name: "",
        city: "",
        jersey_color: "",
        home_ground: "",
        founded_year: "",
        description: "",
      });
    }
    setErrors({});
  }, [open, mode, team]);

  const handleSubmit = async () => {
    const newErrors: { name?: string; short_name?: string } = {};
    if (!form.name.trim()) newErrors.name = "Team name is required";
    if (!form.short_name.trim()) newErrors.short_name = "Short name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        short_name: form.short_name.trim(),
        city: form.city || undefined,
        jersey_color: form.jersey_color || undefined,
        home_ground: form.home_ground || undefined,
        founded_year: form.founded_year ? Number(form.founded_year) : undefined,
        description: form.description || undefined,
      };

      if (mode === "edit") {
        if (!team) {
          toast.error("Invalid team data");
          return;
        }

        await updateTeam(team.id, payload);
        toast.success("Team updated successfully");
      } else {
        await createTeam(payload);
        toast.success("Team created successfully");
      }

      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Team" : "Add Team"}
      onSubmit={handleSubmit}
      submitText={mode === "edit" ? "Update Team" : "Create Team"}
    >
      <Input
        label="Team Name"
        required
        placeholder="e.g. Mumbai Indians"
        value={form.name}
        onChange={(e) => {
          setForm({ ...form, name: e.target.value });
          if (errors.name) setErrors({ ...errors, name: undefined });
        }}
        error={errors.name}
      />

      <Input
        label="City"
        placeholder="e.g. Mumbai"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />

      <Input
        label="Short Name"
        required
        placeholder="e.g. MI"
        value={form.short_name}
        onChange={(e) => {
          setForm({ ...form, short_name: e.target.value });
          if (errors.short_name) setErrors({ ...errors, short_name: undefined });
        }}
        error={errors.short_name}
      />

      <Input
        label="Jersey Color"
        placeholder="e.g. Blue"
        value={form.jersey_color}
        onChange={(e) => setForm({ ...form, jersey_color: e.target.value })}
      />

      <Input
        label="Home Ground"
        placeholder="e.g. Wankhede Stadium"
        value={form.home_ground}
        onChange={(e) => setForm({ ...form, home_ground: e.target.value })}
      />

      <Input
        label="Founded Year"
        placeholder="e.g. 2008"
        value={form.founded_year}
        onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
      />

      <Input
        label="Description"
        placeholder="Short description..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </FormModal>
  );
}
