"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Circle } from "lucide-react"

// Self-contained Menubar — no @radix-ui/react-menubar needed

const MenubarContext = React.createContext<{ open: string | null; setOpen: (v: string | null) => void }>({
  open: null, setOpen: () => {},
});

const Menubar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState<string | null>(null);
    return (
      <MenubarContext.Provider value={{ open, setOpen }}>
        <div
          ref={ref}
          className={cn("flex h-10 items-center space-x-1 rounded-xl border border-clay/40 bg-warm-white p-1", className)}
          {...props}
        >
          {children}
        </div>
      </MenubarContext.Provider>
    );
  }
);
Menubar.displayName = "Menubar";

const MenubarMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MenubarMenu.displayName = "MenubarMenu";

const MenubarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:bg-parchment focus:text-charcoal data-[state=open]:bg-parchment data-[state=open]:text-charcoal",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
MenubarTrigger.displayName = "MenubarTrigger";

const MenubarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-clay/30 bg-warm-white p-1 shadow-md",
        className
      )}
      {...props}
    />
  )
);
MenubarContent.displayName = "MenubarContent";

const MenubarItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-parchment focus:text-charcoal",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
);
MenubarItem.displayName = "MenubarItem";

const MenubarSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-clay/20", className)} {...props} />
  )
);
MenubarSeparator.displayName = "MenubarSeparator";

const MenubarLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold text-charcoal", inset && "pl-8", className)} {...props} />
  )
);
MenubarLabel.displayName = "MenubarLabel";

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-slate", className)} {...props} />
);
MenubarShortcut.displayName = "MenubarShortcut";

const MenubarSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MenubarSub.displayName = "MenubarSub";

const MenubarSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-parchment", inset && "pl-8", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  )
);
MenubarSubTrigger.displayName = "MenubarSubTrigger";

const MenubarSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-xl border border-clay/30 bg-warm-white p-1 shadow-lg", className)} {...props} />
  )
);
MenubarSubContent.displayName = "MenubarSubContent";

const MenubarCheckboxItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { checked?: boolean }>(
  ({ className, children, checked, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-parchment", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
);
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

const MenubarRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MenubarRadioGroup.displayName = "MenubarRadioGroup";

const MenubarRadioItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-parchment", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Circle className="h-2 w-2 fill-current" />
      </span>
      {children}
    </div>
  )
);
MenubarRadioItem.displayName = "MenubarRadioItem";

const MenubarGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MenubarGroup.displayName = "MenubarGroup";

const MenubarPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MenubarPortal.displayName = "MenubarPortal";

export {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
  MenubarSeparator, MenubarLabel, MenubarShortcut, MenubarSub,
  MenubarSubTrigger, MenubarSubContent, MenubarCheckboxItem,
  MenubarRadioGroup, MenubarRadioItem, MenubarGroup, MenubarPortal,
};
