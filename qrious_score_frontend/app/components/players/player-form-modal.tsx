"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { usePlayerStore } from "@/app/store/players.store";
import { Player } from "@/app/types/players.types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  player?: Player | null;
}

interface PlayerFormState {
  name: string;
  role: string;
  batting_style: string;
  bowling_style: string;
}

export function PlayerFormModal({
  open,
  onClose,
  mode = "create",
  player,
}: Props) {
  const { createPlayer, updatePlayer } = usePlayerStore();

  const [form, setForm] = useState<PlayerFormState>({
    name: "",
    role: "",
    batting_style: "",
    bowling_style: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormState, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && player) {
      setForm({
        name: player.name || "",
        role: player.role || "",
        batting_style: player.batting_style || "",
        bowling_style: player.bowling_style || "",
      });
    } else {
      setForm({
        name: "",
        role: "",
        batting_style: "",
        bowling_style: "",
      });
    }
    setErrors({});
  }, [open, mode, player]);

  const handleSubmit = async () => {
    const newErrors: Partial<Record<keyof PlayerFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Player name is required";
    if (!form.role) newErrors.role = "Role is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setLoading(true);

      if (mode === "edit" && player) {
        await updatePlayer(player.id, form);
        toast.success("Player updated successfully");
      } else {
        await createPlayer(form);
        toast.success("Player created successfully");
      }

      onClose();

      setForm({
        name: "",
        role: "",
        batting_style: "",
        bowling_style: "",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Player" : "Add Player"}
      onSubmit={handleSubmit}
      submitText={mode === "edit" ? "Update Player" : "Create Player"}
      loading={loading}
    >
      <Input
        label="Player Name"
        required
        placeholder="e.g. Virat Kohli"
        value={form.name}
        onChange={(e) => {
          setForm({ ...form, name: e.target.value });
          if (errors.name) setErrors({ ...errors, name: undefined });
        }}
        error={errors.name}
      />

      <Select
        label="Role"
        required
        value={form.role}
        onChange={(val) => {
          setForm({ ...form, role: val });
          if (errors.role) setErrors({ ...errors, role: undefined });
        }}
        error={errors.role}
        options={[
          { label: "Batsman", value: "batsman" },
          { label: "Bowler", value: "bowler" },
          { label: "All Rounder", value: "all_rounder" },
          { label: "Wicket Keeper", value: "wicket_keeper" }
        ]}
      />

      <Select
        label="Batting Style"
        value={form.batting_style}
        onChange={(val) => setForm({ ...form, batting_style: val })}
        placeholder="Select batting style"
        options={[
          { label: "Right Hand Bat (RHB)", value: "RHB" },
          { label: "Left Hand Bat (LHB)", value: "LHB" },
        ]}
      />

      <Select
        label="Bowling Style"
        value={form.bowling_style}
        onChange={(val) => setForm({ ...form, bowling_style: val })}
        placeholder="Select bowling style"
        options={[
          { label: "Right Arm Fast (RAF)", value: "RAF" },
          { label: "Left Arm Fast (LAF)", value: "LAF" },
          { label: "Right Arm Off Spin (OFF)", value: "OFF" },
          { label: "Left Arm Orthodox (LAO)", value: "LAO" },
          { label: "Right Arm Leg Spin (LEG)", value: "LEG" },
        ]}
      />
    </FormModal>
  );
}
