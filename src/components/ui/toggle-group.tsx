"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

// Self-contained ToggleGroup — no @radix-ui/react-toggle-group needed

type ToggleGroupType = "single" | "multiple";

interface ToggleGroupContextValue {
  type: ToggleGroupType;
  value: string | string[];
  onValueChange: (value: string) => void;
  variant?: VariantProps<typeof toggleVariants>["variant"];
  size?: VariantProps<typeof toggleVariants>["size"];
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  type: "single",
  value: "",
  onValueChange: () => {},
});

interface ToggleGroupSingleProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleVariants> {
  type: "single";
  value?: string;
  onValueChange?: (value: string) => void;
}

interface ToggleGroupMultipleProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleVariants> {
  type: "multiple";
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type, value, onValueChange, variant, size, children, ...props }, ref) => {
    const handleChange = (itemValue: string) => {
      if (type === "single") {
        (onValueChange as ((v: string) => void) | undefined)?.(itemValue);
      } else {
        const current = (value as string[]) || [];
        const next = current.includes(itemValue)
          ? current.filter((v) => v !== itemValue)
          : [...current, itemValue];
        (onValueChange as ((v: string[]) => void) | undefined)?.(next);
      }
    };

    return (
      <ToggleGroupContext.Provider
        value={{ type, value: value || (type === "multiple" ? [] : ""), onValueChange: handleChange, variant, size }}
      >
        <div
          ref={ref}
          className={cn("flex items-center justify-center gap-1", className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleVariants> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, children, value, variant, size, ...props }, ref) => {
    const ctx = React.useContext(ToggleGroupContext);
    const isPressed =
      ctx.type === "single"
        ? ctx.value === value
        : Array.isArray(ctx.value) && ctx.value.includes(value);

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          toggleVariants({ variant: variant ?? ctx.variant, size: size ?? ctx.size }),
          "flex-1 data-[state=on]:bg-parchment",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
