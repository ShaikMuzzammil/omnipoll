"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Self-contained HoverCard — no @radix-ui/react-hover-card needed

interface HoverCardContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  openDelay: number;
  closeDelay: number;
}

const HoverCardContext = React.createContext<HoverCardContextValue>({
  open: false, setOpen: () => {}, openDelay: 700, closeDelay: 300,
});

interface HoverCardProps {
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const HoverCard = ({
  children, openDelay = 700, closeDelay = 300,
  open: controlledOpen, onOpenChange, defaultOpen = false,
}: HoverCardProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((v: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(v);
    onOpenChange?.(v);
  }, [controlledOpen, onOpenChange]);

  return (
    <HoverCardContext.Provider value={{ open, setOpen, openDelay, closeDelay }}>
      {children}
    </HoverCardContext.Provider>
  );
};
HoverCard.displayName = "HoverCard";

const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const { setOpen, openDelay, closeDelay } = React.useContext(HoverCardContext);
    const openTimer = React.useRef<ReturnType<typeof setTimeout>>();
    const closeTimer = React.useRef<ReturnType<typeof setTimeout>>();

    const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      clearTimeout(closeTimer.current);
      openTimer.current = setTimeout(() => setOpen(true), openDelay);
      onMouseEnter?.(e);
    };
    const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      clearTimeout(openTimer.current);
      closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
      onMouseLeave?.(e);
    };

    return (
      <div
        ref={ref}
        className={className}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        {...props}
      />
    );
  }
);
HoverCardTrigger.displayName = "HoverCardTrigger";

const HoverCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { open, setOpen, closeDelay } = React.useContext(HoverCardContext);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>();

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-64 rounded-2xl border border-clay/30 bg-warm-white p-4 shadow-xl",
        "text-charcoal text-sm",
        className
      )}
      onMouseEnter={() => clearTimeout(closeTimer.current)}
      onMouseLeave={() => { closeTimer.current = setTimeout(() => setOpen(false), closeDelay); }}
      {...props}
    />
  );
});
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };
