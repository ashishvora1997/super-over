"use client";

import { ReactNode } from "react";
import { Button } from "../button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./modal";

interface Props {
  open: boolean;
  onClose: () => void;

  title: string;
  children: ReactNode;

  onSubmit: () => void;
  submitText?: string;
  loading?: boolean;
}

export function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Submit",
  loading = false,
}: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />

      <ModalBody>{children}</ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Processing..." : submitText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
