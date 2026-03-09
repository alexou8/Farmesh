"use client";

import { CalendarDays } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type DatePickerAccent = "green" | "amber";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accent?: DatePickerAccent;
  className?: string;
  disabled?: boolean;
};

const accentClasses: Record<
  DatePickerAccent,
  {
    triggerBorder: string;
    icon: string;
    textAction: string;
    selectedDay: string;
    todayHighlight: string;
  }
> = {
  green: {
    triggerBorder: "border-green-600",
    icon: "text-green-700",
    textAction: "text-green-700 hover:text-green-800",
    selectedDay: "data-[selected]:border-green-600 data-[selected]:bg-green-600",
    todayHighlight: "[&>button]:border-green-600",
  },
  amber: {
    triggerBorder: "border-amber-600",
    icon: "text-amber-700",
    textAction: "text-amber-700 hover:text-amber-800",
    selectedDay: "data-[selected]:border-amber-600 data-[selected]:bg-amber-600",
    todayHighlight: "[&>button]:border-amber-600",
  },
};

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "yyyy-mm-dd",
  accent = "green",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const accentStyle = accentClasses[accent];
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Choose date"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-[42px] w-full items-center justify-between border px-3 py-2 text-left text-sm font-sans outline-none transition-colors duration-200 focus-visible:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-60",
          "bg-[var(--surface-base)]",
          open ? accentStyle.triggerBorder : "border-[var(--border-default)]"
        )}
      >
        <span className={value ? "text-[var(--foreground)]" : "text-[var(--text-faint)]"}>
          {value || placeholder}
        </span>
        <CalendarDays className={cn("h-4 w-4", accentStyle.icon)} aria-hidden="true" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[4px]"
            onMouseDown={() => setOpen(false)}
          >
            <div
              className="w-[min(22rem,calc(100vw-2rem))] border p-2 shadow-[0_18px_48px_-14px_rgba(31,24,18,0.35)]"
              style={{ backgroundColor: "var(--surface-base)", borderColor: "var(--border-default)" }}
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Calendar picker"
            >
              <Calendar
                mode="single"
                showOutsideDays={false}
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  onChange(toIsoDate(date));
                  setOpen(false);
                }}
                className="mx-auto w-fit font-sans"
                classNames={{
                  day_button: cn(
                    "flex h-9 w-9 items-center justify-center border border-transparent text-[var(--foreground)] transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] hover:bg-[var(--surface-card)] data-[selected]:text-white data-[today]:font-semibold data-[outside]:text-[var(--text-faint)] data-[disabled]:cursor-not-allowed data-[disabled]:text-[var(--text-faint)]",
                    accentStyle.selectedDay
                  ),
                  today: cn(
                    "after:hidden [&>button]:border [&>button]:font-semibold data-[selected]:[&>button]:text-white",
                    accentStyle.todayHighlight
                  ),
                }}
              />

              <div className="mt-1 flex items-center justify-between px-1 pb-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className={cn("transition-colors", accentStyle.textAction)}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(toIsoDate(new Date()));
                    setOpen(false);
                  }}
                  className={cn("transition-colors", accentStyle.textAction)}
                >
                  Today
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
