"use client";

import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";
import { clearAuthCookie, clearAuthUser } from "@/lib/auth";

type LogoutButtonProps = Pick<ButtonProps, "className" | "size" | "variant">;

export function LogoutButton({ className, size, variant = "outline" }: LogoutButtonProps) {
  const router = useRouter();

  function handleLogout() {
    clearAuthCookie();
    clearAuthUser();
    router.push("/login");
  }

  return (
    <Button className={className} size={size} type="button" variant={variant} onClick={handleLogout}>
      Logout
    </Button>
  );
}
