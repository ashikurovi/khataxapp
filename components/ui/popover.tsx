"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement>;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
          triggerRef.current &&
          contentRef.current &&
          !triggerRef.current.contains(target) &&
          !contentRef.current.contains(target)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

Popover.displayName = "Popover";

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const PopoverTrigger = React.forwardRef<HTMLDivElement, PopoverTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error("PopoverTrigger must be used within Popover");

    const combinedRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => combinedRef.current!);
    React.useEffect(() => {
      if (combinedRef.current && context.triggerRef) {
        (context.triggerRef as React.MutableRefObject<HTMLDivElement | null>).current = combinedRef.current;
      }
    }, [context]);

    return (
      <div
        ref={combinedRef}
        className={cn("w-full", className)}
        onClick={() => context.setOpen(!context.open)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "start", side = "bottom", children, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);

    React.useImperativeHandle(ref, () => contentRef.current!);

    React.useEffect(() => {
      if (context?.open && context.triggerRef.current && contentRef.current) {
        const triggerRect = context.triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        let top = triggerRect.bottom + 4;
        let left = triggerRect.left;

        if (side === "top") {
          top = triggerRect.top - contentRect.height - 4;
        }

        if (align === "end") {
          left = triggerRect.right - contentRect.width;
        } else if (align === "center") {
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        }

        setPosition({
          top,
          left,
          width: triggerRect.width,
        });
      }
    }, [context?.open, align, side]);

    if (!context?.open || !position) return null;

    return (
      <div
        ref={contentRef}
        className="fixed z-50"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
        data-popover
      >
        <div
          className={cn(
            "rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
            side === "top" && "slide-in-from-bottom-2",
            side === "bottom" && "slide-in-from-top-2",
            side === "left" && "slide-in-from-right-2",
            side === "right" && "slide-in-from-left-2",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
