"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return children;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
