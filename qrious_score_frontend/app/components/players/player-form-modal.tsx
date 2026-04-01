"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { usePlayerStore } from "@/app/store/players.store";
import toast from "react-hot-toast";

export function PlayerFormModal({
  open,
  onClose,
  mode = "create",
  player,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  player?: any;
}) {
  const { createPlayer, updatePlayer } = usePlayerStore();

  const [form, setForm] = useState({
    name: "",
    role: "",
    batting_style: "",
    bowling_style: "",
  });

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
      // ✅ reset for create mode
      setForm({
        name: "",
        role: "",
        batting_style: "",
        bowling_style: "",
      });
    }
  }, [open, mode, player]);

  const handleSubmit = async () => {
    if (!form.name || !form.role) {
      toast.error("Name and role are required");
      return;
    }

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

      // reset form
      setForm({
        name: "",
        role: "",
        batting_style: "",
        bowling_style: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
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
        placeholder="Player name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <Select
        value={form.role}
        onChange={(val) => setForm({ ...form, role: val })}
        options={[
          { label: "Batsman", value: "batsman" },
          { label: "Bowler", value: "bowler" },
          { label: "All Rounder", value: "all_rounder" },
        ]}
      />

      <Input
        placeholder="Batting style"
        value={form.batting_style}
        onChange={(e) => setForm({ ...form, batting_style: e.target.value })}
      />

      <Input
        placeholder="Bowling style"
        value={form.bowling_style}
        onChange={(e) => setForm({ ...form, bowling_style: e.target.value })}
      />
    </FormModal>
  );
}
