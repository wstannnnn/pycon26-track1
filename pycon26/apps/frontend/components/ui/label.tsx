import * as React from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "grid gap-2 text-sm font-bold leading-none text-slate-900 dark:text-slate-100",
        className,
      )}
      {...props}
    />
  );
}
