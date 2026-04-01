"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Small delay so CSS transition triggers
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true)),
      );
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet — bottom on mobile, centered dialog on desktop */}
      <div
        className={`
          relative w-full bg-white flex flex-col overflow-hidden
          /* mobile: bottom sheet */
          mt-auto rounded-t-3xl max-h-[92vh]
          /* desktop: centered card */
          sm:mt-0 sm:max-w-md sm:rounded-2xl sm:shadow-2xl sm:mx-4
          transition-transform duration-250 ease-out
          ${
            animate
              ? "translate-y-0 sm:scale-100 sm:opacity-100"
              : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
          }
        `}
      >
        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">{children}</div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-border flex justify-end gap-2 bg-white">
      {children}
    </div>
  );
}
