"use client";

import { usePathname } from "next/navigation";

import { Navbar, type NavbarUser } from "@/components/navbar";

const HIDE_ON = ["/login", "/register"];

export function AppChrome({
  user,
  children,
}: {
  user: NavbarUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar user={user} />
      <div className="pt-24">{children}</div>
    </>
  );
}
