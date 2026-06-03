"use client"

import { Toaster as SonnerToaster } from "sonner"

// Wrapper without next-themes dependency
type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-warm-white group-[.toaster]:text-charcoal group-[.toaster]:border-clay/30 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate",
          actionButton:
            "group-[.toast]:bg-terracotta group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-parchment group-[.toast]:text-slate",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
