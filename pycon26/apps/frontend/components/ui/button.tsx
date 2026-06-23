import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-800 text-white hover:bg-slate-900",
        outline:
          "border border-slate-200 bg-white text-slate-800 hover:border-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-100 dark:hover:border-sky-400",
        ghost: "text-slate-800 hover:bg-sky-50 dark:text-sky-100 dark:hover:bg-slate-800",
      },
      size: {
        default: "px-5",
        sm: "min-h-9 px-3",
        lg: "min-h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
