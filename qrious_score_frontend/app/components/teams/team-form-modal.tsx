"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Input } from "@/app/components/ui/input";
import { useTeamStore } from "@/app/store/teams.store";
import toast from "react-hot-toast";

export function TeamFormModal({
  open,
  onClose,
  mode = "create",
  team,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  team?: any;
}) {
  const { createTeam, updateTeam } = useTeamStore();

  const [form, setForm] = useState({
    name: "",
    city: "",
  });

  useEffect(() => {
    if (mode === "edit" && team) {
      setForm({
        name: team.name || "",
        city: team.city || "",
      });
    }
  }, [team, mode]);

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Team name required");
      return;
    }

    try {
      if (mode === "edit") {
        await updateTeam(team.id, form);
        toast.success("Team updated");
      } else {
        await createTeam(form);
        toast.success("Team created");
      }

      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
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
    </FormModal>
  );
}
