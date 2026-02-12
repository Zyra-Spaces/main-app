import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Wraps Link or other elements with button styles to add L-shaped corner accents */
export function ButtonCornerWrapper({
  children,
  className,
  variant = "outline",
}: {
  children: React.ReactNode;
  className?: string;
  /** "default" = dark corners (for white buttons), "outline" = white corners (for dark/outline buttons) */
  variant?: "default" | "outline";
}) {
  const cornerClass = variant === "default" ? "btn-corner-accent btn-corner-accent-dark" : "btn-corner-accent btn-corner-accent-outline";
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn(cornerClass, "btn-corner-accent-tl")} aria-hidden />
      <span className={cn(cornerClass, "btn-corner-accent-tr")} aria-hidden />
      <span className={cn(cornerClass, "btn-corner-accent-bl")} aria-hidden />
      <span className={cn(cornerClass, "btn-corner-accent-br")} aria-hidden />
      {children}
    </span>
  );
}

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-geist-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-lg hover:bg-white/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-[hsl(0,0%,6%)]",
        outline:
          "border-2 border-[hsl(0,0%,55%)] bg-transparent text-white hover:bg-white hover:text-black hover:border-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    const cornerClass = variant === "outline" || variant === "secondary"
      ? "btn-corner-accent btn-corner-accent-outline"
      : "btn-corner-accent btn-corner-accent-dark";
    return (
      <span className="relative inline-flex">
        <span className={cn(cornerClass, "btn-corner-accent-tl")} aria-hidden />
        <span className={cn(cornerClass, "btn-corner-accent-tr")} aria-hidden />
        <span className={cn(cornerClass, "btn-corner-accent-bl")} aria-hidden />
        <span className={cn(cornerClass, "btn-corner-accent-br")} aria-hidden />
        <button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      </span>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
