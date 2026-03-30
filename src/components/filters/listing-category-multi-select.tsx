"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type ListingCategoryOption = {
  value: string;
  label: string;
};

type ListingCategoryMultiSelectProps = {
  /** Query key for GET forms (repeat for multiple). */
  name?: string;
  options: ListingCategoryOption[];
  /** Slugs from the current URL (server-parsed). */
  defaultSelected: string[];
  labels: {
    filterLabel: string;
    hint: string;
    dropdownAll: string;
    dropdownMultiple: string;
  };
};

export function ListingCategoryMultiSelect({
  name = "category",
  options,
  defaultSelected,
  labels,
}: ListingCategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const valid = new Set(options.map((o) => o.value));
    return defaultSelected.filter((k) => valid.has(k));
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(e: PointerEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleKey = useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const triggerLabel = useMemo(() => {
    if (selectedKeys.length === 0) {
      return labels.dropdownAll;
    }
    if (selectedKeys.length === 1) {
      const only = options.find((o) => o.value === selectedKeys[0]);
      return only?.label ?? labels.dropdownAll;
    }
    return labels.dropdownMultiple.replace(/\{count\}/g, String(selectedKeys.length));
  }, [labels.dropdownAll, labels.dropdownMultiple, options, selectedKeys]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      {selectedKeys.map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}
      <button
        type="button"
        id={`listing-category-trigger-${name}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={labels.filterLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 text-left text-sm text-foreground shadow-sm outline-none transition hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-lg"
          role="listbox"
          aria-labelledby={`listing-category-trigger-${name}`}
          aria-multiselectable="true"
        >
          <p className="mb-2 text-xs text-muted-foreground">{labels.hint}</p>
          <div className="flex flex-col gap-1">
            {options.map((opt) => {
              const checked = selectedKeys.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground hover:bg-muted/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleKey(opt.value)}
                    className="h-4 w-4 shrink-0 rounded border-border text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
