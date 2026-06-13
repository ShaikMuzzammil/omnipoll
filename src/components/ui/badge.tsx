import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-terracotta/10 text-terracotta",
        secondary: "border-transparent bg-parchment text-charcoal",
        destructive: "border-transparent bg-red-100 text-red-600",
        outline: "border-clay/50 text-charcoal",
        sage: "border-transparent bg-sage/10 text-sage",
        amber: "border-transparent bg-amber-100 text-amber-700",
        live: "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        paused: "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        closed: "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
