import * as React from "react"

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, style, children, ...props }, ref) => (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%", paddingBottom: `${(1 / ratio) * 100}%`, ...style }}
      {...props}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {children}
      </div>
    </div>
  )
)
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }