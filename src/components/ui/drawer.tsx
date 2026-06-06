"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained Drawer — no vaul package needed

interface DrawerContextValue {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: "top" | "bottom" | "left" | "right";
}

const DrawerContext = React.createContext<DrawerContextValue>({
  open: false, onOpenChange: () => {}, direction: "bottom",
});

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  shouldScaleBackground?: boolean;
}

const Drawer = ({ open = false, onOpenChange = () => {}, direction = "bottom", children, shouldScaleBackground }: DrawerProps) => {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <DrawerContext.Provider value={{ open, onOpenChange, direction }}>
      {children}
    </DrawerContext.Provider>
  );
};
Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DrawerContext);
    return (
      <button
        ref={ref}
        onClick={(e) => { onOpenChange(true); onClick?.(e); }}
        {...props}
      />
    );
  }
);
DrawerTrigger.displayName = "DrawerTrigger";

const DrawerClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DrawerContext);
    return (
      <button
        ref={ref}
        onClick={(e) => { onOpenChange(false); onClick?.(e); }}
        {...props}
      />
    );
  }
);
DrawerClose.displayName = "DrawerClose";

const DrawerPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
DrawerPortal.displayName = "DrawerPortal";

const DrawerOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DrawerContext);
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);
DrawerOverlay.displayName = "DrawerOverlay";

const slideIn: Record<string, string> = {
  bottom: "bottom-0 left-0 right-0 rounded-t-2xl translate-y-0",
  top:    "top-0 left-0 right-0 rounded-b-2xl",
  left:   "left-0 top-0 bottom-0 rounded-r-2xl",
  right:  "right-0 top-0 bottom-0 rounded-l-2xl",
};

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, direction } = React.useContext(DrawerContext);
    if (!open) return null;
    return (
      <>
        <DrawerOverlay />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 flex flex-col bg-warm-white border border-clay/30 shadow-xl",
            "max-h-[96dvh]",
            slideIn[direction] ?? slideIn.bottom,
            className
          )}
          {...props}
        >
          {direction === "bottom" && (
            <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-clay/40" />
          )}
          {children}
        </div>
      </>
    );
  }
);
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("font-playfair text-lg font-bold text-charcoal", className)} {...props} />
  )
);
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate", className)} {...props} />
  )
);
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose,
  DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription,
};
