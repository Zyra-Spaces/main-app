"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ButtonCornerWrapper, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects/new", label: "Start Project" },
  { href: "/profile", label: "Profile" },
  { href: "/products", label: "Products" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen border-r border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <Link href="/feed" className="font-nunito text-xl font-bold tracking-tight">
          Zyra
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "block font-inconsolata text-sm py-2.5 px-3 rounded transition-colors",
              pathname === href || (href !== "/feed" && pathname.startsWith(href))
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className="p-3 border-t border-border space-y-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-3 rounded border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={undefined} alt="" />
              <AvatarFallback className="font-inconsolata text-xs">
                {user.email?.slice(0, 2).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-inconsolata text-sm text-foreground truncate">
              {user.email?.split("@")[0] ?? "Profile"}
            </span>
          </Link>
          <ButtonCornerWrapper variant="outline" className="w-full">
            <button
              onClick={() => signOut()}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full font-inconsolata")}
            >
              Sign out
            </button>
          </ButtonCornerWrapper>
        </div>
      )}
    </aside>
  );
}
