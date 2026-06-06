"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained Command palette — no cmdk package needed

interface CommandContextValue {
  search: string;
  setSearch: (v: string) => void;
  selected: number;
  setSelected: (v: number) => void;
}

const CommandContext = React.createContext<CommandContextValue>({
  search: "", setSearch: () => {},
  selected: 0, setSelected: () => {},
});

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const [search, setSearch] = React.useState("");
    const [selected, setSelected] = React.useState(0);
    return (
      <CommandContext.Provider value={{ search, setSearch, selected, setSelected }}>
        <div
          ref={ref}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-warm-white text-charcoal",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    );
  }
);
Command.displayName = "Command";

const CommandDialog = ({ children, open, onOpenChange, ...props }: {
  children: React.ReactNode; open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & React.HTMLAttributes<HTMLDivElement>) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange?.(false)} />
      <Command className="relative z-10 max-h-[80vh] w-full max-w-lg shadow-2xl border border-clay/30" {...props}>
        {children}
      </Command>
    </div>
  );
};
CommandDialog.displayName = "CommandDialog";

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const { search, setSearch } = React.useContext(CommandContext);
    return (
      <div className="flex items-center border-b border-clay/30 px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate" />
        <input
          ref={ref}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "flex h-11 w-full rounded-xl bg-transparent py-3 text-sm text-charcoal outline-none placeholder:text-slate disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate hover:text-charcoal">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />
  )
);
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} className="py-6 text-center text-sm text-slate" {...props} />
);
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { heading?: string }>(
  ({ className, heading, children, ...props }, ref) => {
    const { search } = React.useContext(CommandContext);
    return (
      <div ref={ref} className={cn("overflow-hidden p-1 text-charcoal", className)} {...props}>
        {heading && (
          <div className="px-2 py-1.5 text-xs font-semibold text-slate">{heading}</div>
        )}
        {children}
      </div>
    );
  }
);
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 h-px bg-clay/20", className)} {...props} />
  )
);
CommandSeparator.displayName = "CommandSeparator";

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; onSelect?: (value: string) => void; value?: string }
>(({ className, disabled, onSelect, value, children, ...props }, ref) => (
  <div
    ref={ref}
    role="option"
    aria-disabled={disabled}
    onClick={() => !disabled && onSelect?.(value ?? "")}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-xl px-2 py-1.5 text-sm outline-none",
      "hover:bg-parchment hover:text-charcoal",
      "aria-selected:bg-parchment aria-selected:text-charcoal",
      disabled && "pointer-events-none opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CommandItem.displayName = "CommandItem";

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-slate", className)} {...props} />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command, CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
};
