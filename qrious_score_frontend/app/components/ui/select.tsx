"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";

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
  disabled?: boolean;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select",
  error,
  label,
  required,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, highlightedIndex, options, onChange]);

  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, options, value]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const gap = 4;
            const maxDropdownHeight = 220;
            const spaceBelow = window.innerHeight - rect.bottom - gap;
            const spaceAbove = rect.top - gap;

            const openUpward =
              spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow;
            const availableHeight = openUpward
              ? Math.min(spaceAbove, maxDropdownHeight)
              : Math.min(spaceBelow, maxDropdownHeight);

            setDropdownPosition({
              top: openUpward
                ? rect.top - availableHeight - gap
                : rect.bottom + gap,
              left: rect.left,
              width: rect.width,
              maxHeight: availableHeight,
            });
          }
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full flex items-center justify-between px-4 py-2.5 pr-10 rounded-xl border bg-white text-sm transition-all duration-150 focus:outline-none focus:ring-2 ${
          error
            ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
            : "border-border focus:ring-primary/20 focus:border-primary"
        } ${
          disabled
            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
            : "text-foreground hover:border-gray-300"
        } ${isOpen ? "border-primary ring-2 ring-primary/20" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? "text-foreground" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`absolute right-3 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}

      {isOpen &&
        dropdownPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[2147483647] bg-white border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: dropdownPosition.maxHeight,
            }}
            role="listbox"
          >
            <div
              className="overflow-y-auto py-1"
              style={{ maxHeight: dropdownPosition.maxHeight }}
            >
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted text-center">
                  No options available
                </div>
              ) : (
                options.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-primary/10"
                          : isSelected
                            ? "bg-primary/5"
                            : ""
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "font-semibold text-foreground"
                            : "text-foreground/90"
                        }`}
                      >
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check
                          size={16}
                          className="text-primary flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
