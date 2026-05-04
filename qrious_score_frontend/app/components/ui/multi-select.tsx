"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Check, X, ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: number;
}

interface Props {
  options: Option[];
  value: number[];
  onChange: (val: number[]) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  itemName?: string;
  maxChips?: number;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  required,
  placeholder = "Select items...",
  disabled = false,
  itemName = "item",
  maxChips = 3,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedOptions = options.filter((o) => value.includes(o.value));

  const toggle = (val: number) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    );
  };

  const removeChip = (e: React.MouseEvent, val: number) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const openDropdown = () => {
    if (disabled || isOpen) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !containerRef.current?.contains(t) &&
        !dropdownRef.current?.contains(t)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
    else setSearch("");
  }, [isOpen]);

  const renderTrigger = () => {
    if (value.length === 0) {
      return <span className="text-gray-400 text-sm">{placeholder}</span>;
    }

    if (value.length <= maxChips) {
      return (
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20"
            >
              <span className="max-w-[100px] truncate">{opt.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeChip(e, opt.value)}
                  className="flex-shrink-0 rounded hover:bg-primary/20 p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
          {value.length}
        </span>
        {value.length} {itemName}
        {value.length !== 1 ? "s" : ""} selected
      </span>
    );
  };

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDropdown();
          }
        }}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-xl border bg-white
          text-sm transition-all duration-150 cursor-pointer min-h-[42px]
          focus:outline-none focus:ring-2
          ${
            disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed border-border"
              : "border-border hover:border-gray-300 focus:ring-primary/20 focus:border-primary"
          }
          ${isOpen ? "border-primary ring-2 ring-primary/20" : ""}
        `}
      >
        <div className="flex-1 min-w-0">{renderTrigger()}</div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {value.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-1 rounded-md hover:bg-gray-100 text-muted hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[2147483647] bg-white border border-border rounded-xl shadow-xl shadow-black/15 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: "320px",
            }}
          >
            <div className="relative p-2 border-b border-border">
              <Search
                size={13}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/80 border-b border-border/60">
              <span className="text-xs text-muted">
                {value.length > 0 ? (
                  <span className="text-primary font-semibold">
                    {value.length} selected
                  </span>
                ) : (
                  "None selected"
                )}
              </span>
              <span className="text-xs text-muted">{options.length} total</span>
            </div>

            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted font-medium">No results</p>
                  <p className="text-xs text-muted/60 mt-0.5">
                    Try a different search
                  </p>
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggle(opt.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 hover:bg-primary/8"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-border bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={10}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>

                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                          isSelected ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        {opt.label.slice(0, 1).toUpperCase()}
                      </div>

                      <span
                        className={`text-sm flex-1 ${
                          isSelected
                            ? "font-medium text-foreground"
                            : "text-foreground/80"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 border-t border-border/60">
              {value.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-destructive hover:text-destructive/80 font-medium"
                >
                  Clear all
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
