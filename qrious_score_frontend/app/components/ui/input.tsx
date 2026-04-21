import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export function Input({ error, label, required, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 transition ${
          error
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-primary"
        } ${className}`}
        {...props}
      />

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
