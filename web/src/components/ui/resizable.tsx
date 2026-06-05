"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained resizable panels — no react-resizable-panels package needed

interface PanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, PanelGroupProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => (
    <div
      ref={ref}
      data-panel-group-direction={direction}
      className={cn(
        "flex h-full w-full",
        direction === "vertical" && "flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, defaultSize, children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{ flex: defaultSize ? `0 0 ${defaultSize}%` : "1 1 0", ...style }}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
);
ResizablePanel.displayName = "ResizablePanel";

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean;
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ withHandle, className, ...props }, ref) => (
    <div
      ref={ref}
      data-panel-resize-handle-enabled="true"
      className={cn(
        "relative flex w-px items-center justify-center bg-clay/30 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]]:h-px [&[data-panel-group-direction=vertical]]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-clay/40 bg-warm-white">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  )
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
