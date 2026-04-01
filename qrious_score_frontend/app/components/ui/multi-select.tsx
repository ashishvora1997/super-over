"use client";

import { useState } from "react";
import { Search, Check, X } from "lucide-react";

interface Option {
  label: string;
  value: number;
}

export function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: number[];
  onChange: (val: number[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (val: number) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-border">
        <span className="text-xs font-medium text-foreground">
          {value.length > 0 ? (
            <span className="text-primary font-semibold">
              {value.length} selected
            </span>
          ) : (
            <span className="text-muted">No players selected</span>
          )}
        </span>
        {value.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative border-b border-border">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full pl-8 pr-4 py-2.5 text-sm bg-white focus:outline-none placeholder:text-muted/60"
        />
      </div>

      {/* Options list */}
      <div className="max-h-56 overflow-y-auto divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No players found
          </div>
        ) : (
          filtered.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-primary/5" : "hover:bg-gray-50"
                }`}
              >
                {/* Custom checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border bg-white"
                  }`}
                >
                  {isSelected && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    isSelected ? "bg-primary" : "bg-gray-400"
                  }`}
                >
                  {opt.label.slice(0, 1).toUpperCase()}
                </div>

                <span
                  className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
