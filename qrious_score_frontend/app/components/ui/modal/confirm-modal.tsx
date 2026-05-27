"use client";

import { FormModal } from "./form-modal";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  loading = false,
  variant = "primary",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  loading?: boolean;
  variant?: "primary" | "danger";
}) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={onConfirm}
      submitText={confirmText}
      loading={loading}
      submitVariant={variant}
    >
      <p className="text-sm text-muted">{description}</p>
    </FormModal>
  );
}
