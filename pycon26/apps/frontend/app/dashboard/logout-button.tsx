"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    router.push("/login");
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}
