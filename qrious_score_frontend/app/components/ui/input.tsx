import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className = "", ...props }: Props) {
  return (
    <div>
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
