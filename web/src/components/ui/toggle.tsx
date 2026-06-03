"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Self-contained Toggle — no @radix-ui/react-toggle needed

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors hover:bg-parchment hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-parchment data-[state=on]:text-charcoal",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-clay/40 bg-transparent hover:bg-parchment hover:text-charcoal",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant, size, pressed, onPressedChange, onClick, children, ...props }, ref) => {
    const [internalPressed, setInternalPressed] = React.useState(pressed ?? false);
    const isPressed = pressed !== undefined ? pressed : internalPressed;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = !isPressed;
      if (pressed === undefined) setInternalPressed(next);
      onPressedChange?.(next);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        onClick={handleClick}
        className={cn(toggleVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
