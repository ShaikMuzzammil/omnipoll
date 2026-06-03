"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Self-contained ScrollArea — no @radix-ui/react-scroll-area needed

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, children, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <div
      className={cn(
        "h-full w-full rounded-[inherit]",
        orientation === "vertical" ? "overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden"
      )}
      style={{ scrollbarWidth: "thin", scrollbarColor: "#C4A882 transparent" }}
    >
      {children}
    </div>
    <ScrollBar orientation={orientation} />
  </div>
));
ScrollArea.displayName = "ScrollArea";

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px] absolute right-0 top-0",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px] absolute bottom-0 left-0",
      className
    )}
    {...props}
  >
    <div className="relative flex-1 rounded-full bg-clay/40" />
  </div>
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
