"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { logout } from "@/lib/actions/auth";

export function SignOut() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="!py-1.5 text-foreground"
      onClick={async () => {
        await logout();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
