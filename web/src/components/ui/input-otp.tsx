"use client"

import * as React from "react"
import { Dot } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained OTP input — no external 'input-otp' package needed

interface InputOTPProps extends React.HTMLAttributes<HTMLDivElement> {
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const InputOTPContext = React.createContext<{
  slots: { char: string | null; hasFakeCaret: boolean; isActive: boolean }[];
}>({ slots: [] });

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, maxLength = 6, value = "", onChange, disabled, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const currentValue = onChange ? value : internalValue;

    const slots = Array.from({ length: maxLength }, (_, i) => ({
      char: currentValue[i] ?? null,
      hasFakeCaret: i === currentValue.length,
      isActive: i === activeIndex,
    }));

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, "").slice(0, maxLength);
      if (onChange) onChange(v);
      else setInternalValue(v);
      setActiveIndex(Math.min(v.length, maxLength - 1));
    };

    return (
      <InputOTPContext.Provider value={{ slots }}>
        <div
          ref={ref}
          className={cn("relative flex items-center gap-2", className)}
          onClick={() => inputRef.current?.focus()}
          {...props}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={currentValue}
            onChange={handleInput}
            disabled={disabled}
            maxLength={maxLength}
            className="absolute inset-0 opacity-0 cursor-default"
            onFocus={() => setActiveIndex(currentValue.length)}
            onBlur={() => setActiveIndex(-1)}
          />
          {children}
        </div>
      </InputOTPContext.Provider>
    );
  }
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  )
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { index: number }>(
  ({ index, className, ...props }, ref) => {
    const { slots } = React.useContext(InputOTPContext);
    const slot = slots[index] ?? { char: null, hasFakeCaret: false, isActive: false };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center border-y border-r border-clay/40 text-sm transition-all first:rounded-l-xl first:border-l last:rounded-r-xl",
          slot.isActive && "z-10 ring-2 ring-terracotta ring-offset-background",
          className
        )}
        {...props}
      >
        {slot.char}
        {slot.hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="animate-caret-blink h-4 w-px bg-charcoal duration-1000" />
          </div>
        )}
      </div>
    );
  }
);
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  )
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
