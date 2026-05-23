"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained ContextMenu — no @radix-ui/react-context-menu needed

interface MenuState { x: number; y: number; open: boolean; }

const ContextMenuContext = React.createContext<{
  state: MenuState;
  close: () => void;
}>({ state: { x: 0, y: 0, open: false }, close: () => {} });

const ContextMenu = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = React.useState<MenuState>({ x: 0, y: 0, open: false });
  const close = React.useCallback(() => setState((s) => ({ ...s, open: false })), []);

  React.useEffect(() => {
    if (state.open) {
      const handler = () => close();
      window.addEventListener("click", handler);
      window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      return () => window.removeEventListener("click", handler);
    }
  }, [state.open, close]);

  return (
    <ContextMenuContext.Provider value={{ state, close }}>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setState({ x: e.clientX, y: e.clientY, open: true });
        }}
        className="contents"
      >
        {children}
      </div>
    </ContextMenuContext.Provider>
  );
};

const ContextMenuTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
);
ContextMenuTrigger.displayName = "ContextMenuTrigger";

const ContextMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { state } = React.useContext(ContextMenuContext);
    if (!state.open) return null;
    return (
      <div
        ref={ref}
        style={{ position: "fixed", top: state.y, left: state.x, zIndex: 9999 }}
        className={cn(
          "min-w-[8rem] overflow-hidden rounded-xl border border-clay/30 bg-warm-white p-1 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ContextMenuContent.displayName = "ContextMenuContent";

const ContextMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; disabled?: boolean }>(
  ({ className, inset, disabled, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none",
        "hover:bg-parchment hover:text-charcoal",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    />
  )
);
ContextMenuItem.displayName = "ContextMenuItem";

const ContextMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold text-charcoal", inset && "pl-8", className)} {...props} />
  )
);
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-clay/20", className)} {...props} />
  )
);
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-slate", className)} {...props} />
);
ContextMenuShortcut.displayName = "ContextMenuShortcut";

const ContextMenuCheckboxItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { checked?: boolean }>(
  ({ className, children, checked, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm hover:bg-parchment", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
);
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

const ContextMenuRadioItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm hover:bg-parchment", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Circle className="h-2 w-2 fill-current" />
      </span>
      {children}
    </div>
  )
);
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

const ContextMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;
ContextMenuSub.displayName = "ContextMenuSub";

const ContextMenuSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm hover:bg-parchment", inset && "pl-8", className)} {...props}>
      {children}<ChevronRight className="ml-auto h-4 w-4" />
    </div>
  )
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

const ContextMenuSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-xl border border-clay/30 bg-warm-white p-1 shadow-xl", className)} {...props} />
  )
);
ContextMenuSubContent.displayName = "ContextMenuSubContent";

const ContextMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
ContextMenuGroup.displayName = "ContextMenuGroup";

const ContextMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
ContextMenuPortal.displayName = "ContextMenuPortal";

const ContextMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
ContextMenuRadioGroup.displayName = "ContextMenuRadioGroup";

export {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut,
  ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuSub,
  ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuGroup,
  ContextMenuPortal, ContextMenuRadioGroup,
};
