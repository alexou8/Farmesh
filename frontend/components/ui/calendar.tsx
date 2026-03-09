"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type ClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames: Partial<ClassNames> = {
    months: "relative flex flex-col gap-4 sm:flex-row",
    month: "w-full",
    month_caption: "relative mx-10 mb-2 flex h-9 items-center justify-center",
    caption_label: "text-sm font-semibold text-[var(--foreground)]",
    nav: "absolute top-0 flex w-full justify-between",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 text-[var(--text-muted)] hover:text-[var(--foreground)]"
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 text-[var(--text-muted)] hover:text-[var(--foreground)]"
    ),
    weekdays: "mb-1 flex",
    weekday: "h-9 w-9 p-0 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase",
    week: "mt-0.5 flex w-full",
    day: "group h-9 w-9 p-0 text-sm",
    day_button:
      "flex h-9 w-9 items-center justify-center border border-transparent text-[var(--foreground)] transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] hover:bg-[var(--surface-card)] data-[selected]:border-green-600 data-[selected]:bg-green-600 data-[selected]:text-white data-[today]:font-semibold data-[outside]:text-[var(--text-faint)] data-[disabled]:cursor-not-allowed data-[disabled]:text-[var(--text-faint)]",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "data-[selected]:after:bg-white after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-green-600",
    outside: "text-[var(--text-faint)]",
    hidden: "invisible",
    week_number: "h-9 w-9 p-0 text-xs font-semibold text-[var(--text-muted)]",
  };

  const mergedClassNames: Partial<ClassNames> = { ...defaultClassNames };

  if (classNames) {
    Object.entries(classNames).forEach(([key, value]) => {
      if (!value) return;
      const classKey = key as keyof ClassNames;
      mergedClassNames[classKey] = cn(defaultClassNames[classKey], value);
    });
  }

  const defaultComponents: CalendarProps["components"] = {
    Chevron: ({ orientation, className: chevronClassName }) =>
      orientation === "left" ? (
        <ChevronLeft className={cn("h-4 w-4", chevronClassName)} strokeWidth={2} aria-hidden="true" />
      ) : (
        <ChevronRight className={cn("h-4 w-4", chevronClassName)} strokeWidth={2} aria-hidden="true" />
      ),
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
