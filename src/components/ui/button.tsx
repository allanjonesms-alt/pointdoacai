import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] hover:shadow-[0_20px_40px_-10px_hsl(var(--primary)/0.25)] hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_4px_14px_-3px_hsl(var(--secondary)/0.4)]",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        acai: "bg-gradient-to-r from-[hsl(280,70%,30%)] via-[hsl(300,60%,40%)] to-[hsl(330,70%,50%)] text-white shadow-[0_4px_14px_-3px_hsl(280,65%,35%/0.4)] hover:shadow-[0_20px_40px_-10px_hsl(280,65%,35%/0.25)] hover:-translate-y-0.5 active:translate-y-0",
        tropical: "bg-[hsl(145,60%,45%)] text-white hover:bg-[hsl(145,60%,40%)] shadow-[0_4px_14px_-3px_hsl(145,60%,45%/0.4)]",
        soft: "bg-[hsl(280,50%,85%)] text-primary hover:bg-[hsl(280,50%,80%)]",
        icon: "bg-muted hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
