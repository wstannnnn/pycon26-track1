import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/15 invalid:focus:border-red-600 invalid:focus:ring-red-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:invalid:focus:border-red-400 dark:invalid:focus:ring-red-400/20",
        className,
      )}
      {...props}
    />
  );
}
