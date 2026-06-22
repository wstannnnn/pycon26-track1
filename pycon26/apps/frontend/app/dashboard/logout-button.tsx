"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearAuthCookie } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearAuthCookie();
    router.push("/login");
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}
