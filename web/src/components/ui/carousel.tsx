"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Self-contained Carousel — no embla-carousel-react needed

interface CarouselOptions {
  loop?: boolean;
  align?: "start" | "center" | "end";
}

interface CarouselContextValue {
  carouselRef: React.RefObject<HTMLDivElement>;
  api: { scrollPrev: () => void; scrollNext: () => void; canScrollPrev: () => boolean; canScrollNext: () => boolean } | null;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: "horizontal" | "vertical";
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>");
  return ctx;
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselContextValue["api"]) => void;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ orientation = "horizontal", opts, setApi, className, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [total, setTotal] = React.useState(0);

    React.useEffect(() => {
      if (containerRef.current) {
        setTotal(containerRef.current.children.length);
      }
    });

    const scrollPrev = React.useCallback(() => {
      setCurrentIndex((i) => {
        const next = i - 1;
        if (next < 0) return opts?.loop ? total - 1 : 0;
        return next;
      });
    }, [total, opts?.loop]);

    const scrollNext = React.useCallback(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= total) return opts?.loop ? 0 : total - 1;
        return next;
      });
    }, [total, opts?.loop]);

    const canScrollPrev = opts?.loop ? true : currentIndex > 0;
    const canScrollNext = opts?.loop ? true : currentIndex < total - 1;

    const api = React.useMemo(() => ({
      scrollPrev, scrollNext,
      canScrollPrev: () => canScrollPrev,
      canScrollNext: () => canScrollNext,
    }), [scrollPrev, scrollNext, canScrollPrev, canScrollNext]);

    React.useEffect(() => { setApi?.(api); }, [api, setApi]);

    // Scroll container to current item
    React.useEffect(() => {
      if (!containerRef.current) return;
      const child = containerRef.current.children[currentIndex] as HTMLElement;
      child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, [currentIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (orientation === "horizontal") {
        if (e.key === "ArrowLeft") { e.preventDefault(); scrollPrev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); scrollNext(); }
      } else {
        if (e.key === "ArrowUp") { e.preventDefault(); scrollPrev(); }
        if (e.key === "ArrowDown") { e.preventDefault(); scrollNext(); }
      }
    };

    return (
      <CarouselContext.Provider value={{ carouselRef: containerRef, api, scrollPrev, scrollNext, canScrollPrev, canScrollNext, orientation }}>
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();
    return (
      <div className="overflow-hidden">
        <div
          ref={carouselRef}
          className={cn(
            "flex",
            orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();
    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
        {...props}
      />
    );
  }
);
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  }
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  }
);
CarouselNext.displayName = "CarouselNext";

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
