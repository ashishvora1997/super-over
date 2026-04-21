import { ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select",
  error,
  label,
  required,
}: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border bg-white text-foreground text-sm focus:outline-none focus:ring-2 transition ${
            error
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-primary"
          }`}
        >
          <option value="">{placeholder}</option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      </div>

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
