"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Self-contained Calendar — no react-day-picker package needed

type Modifiers = Record<string, boolean>;

export interface DayPickerProps {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  selected?: Date | Date[] | { from?: Date; to?: Date };
  onSelect?: (date: Date | undefined) => void;
  onDayClick?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  mode?: "single" | "range" | "multiple";
  initialFocus?: boolean;
  fromDate?: Date;
  toDate?: Date;
  defaultMonth?: Date;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function Calendar({
  className,
  selected,
  onSelect,
  onDayClick,
  disabled,
  showOutsideDays = true,
  defaultMonth,
  ...props
}: DayPickerProps) {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(defaultMonth ?? today);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const cells: Array<{ date: Date; outside: boolean }> = [];
  // Prev month fill
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), outside: true });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  // Next month fill
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), outside: true });
  }

  const isSelected = (date: Date): boolean => {
    if (!selected) return false;
    if (selected instanceof Date) return isSameDay(date, selected);
    if (Array.isArray(selected)) return selected.some((d) => isSameDay(d, date));
    if ("from" in selected) {
      const { from, to } = selected as { from?: Date; to?: Date };
      if (from && to) return date >= from && date <= to;
      if (from) return isSameDay(date, from);
    }
    return false;
  };

  const handleClick = (date: Date) => {
    if (disabled?.(date)) return;
    onDayClick?.(date);
    onSelect?.(date);
  };

  return (
    <div className={cn("p-3", className)} {...(props as object)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-charcoal">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-slate font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, outside }, i) => {
          const sel = isSelected(date);
          const dis = disabled?.(date) ?? false;
          const todayCell = isSameDay(date, today);
          if (outside && !showOutsideDays) {
            return <div key={i} />;
          }
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => handleClick(date)}
              className={cn(
                "h-8 w-8 mx-auto rounded-xl text-sm transition-colors",
                "flex items-center justify-center",
                outside && "text-slate/40",
                !outside && !sel && !dis && "hover:bg-parchment text-charcoal",
                sel && "bg-terracotta text-white font-semibold",
                todayCell && !sel && "border border-terracotta text-terracotta",
                dis && "opacity-30 cursor-not-allowed"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
