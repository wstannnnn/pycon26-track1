import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(email: string) {
  const words = email
    .split(/[\s@._-]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

type UserProfileProps = {
  className?: string;
  email: string;
  tone?: "dark" | "light";
};

export function UserProfile({ className, email, tone = "dark" }: UserProfileProps) {
  const initials = getInitials(email) || "U";
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-end gap-3 rounded-lg px-3 py-2",
        isLight ? "bg-white/10" : "bg-slate-50 dark:bg-slate-900",
        className,
      )}
    >
      <Avatar aria-hidden="true">
        <AvatarFallback className={isLight ? "bg-white text-slate-800" : undefined}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-left">
        <p
          className={cn(
            "m-0 max-w-56 truncate text-sm font-bold",
            isLight ? "text-white" : "text-slate-900 dark:text-white",
          )}
        >
          {email}
        </p>
        <p
          className={cn(
            "m-0 text-xs font-medium",
            isLight ? "text-white/75" : "text-slate-500 dark:text-slate-400",
          )}
        >
          Learner account
        </p>
      </div>
    </div>
  );
}
