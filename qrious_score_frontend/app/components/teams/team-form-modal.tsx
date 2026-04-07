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
  }, [open, mode, team]);

  const handleSubmit = async () => {
    if (!form.name || !form.short_name) {
      toast.error("Name and short name are required");
      return;
    }

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
        placeholder="Team name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <Input
        placeholder="City"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />

      <Input
        placeholder="Short name (e.g. MI)"
        value={form.short_name}
        onChange={(e) => setForm({ ...form, short_name: e.target.value })}
      />

      <Input
        placeholder="Jersey color"
        value={form.jersey_color}
        onChange={(e) => setForm({ ...form, jersey_color: e.target.value })}
      />

      <Input
        placeholder="Home ground"
        value={form.home_ground}
        onChange={(e) => setForm({ ...form, home_ground: e.target.value })}
      />

      <Input
        placeholder="Founded year"
        value={form.founded_year}
        onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
      />

      <Input
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </FormModal>
  );
}
