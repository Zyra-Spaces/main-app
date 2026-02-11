"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-center px-6 py-4 sm:px-12 lg:px-[140px]">
        <div className="md:hidden absolute left-6 flex items-center justify-between w-[calc(100%-3rem)]">
          <button
            className="p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
          </button>
          <Link href="/" className="font-nunito text-xl font-bold tracking-tight md:hidden">
            Zyra
          </Link>
          <div className="w-10" />
        </div>

        <div className="hidden md:flex items-center justify-center gap-8">
          <Link href="/" className="font-nunito text-xl font-bold tracking-tight">
            Zyra
          </Link>
          <Link
            href="#features"
            className="font-inconsolata text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#waitlist"
            className="font-inconsolata text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Early Access
          </Link>
          <Link
            href="#waitlist"
            className={cn(buttonVariants({ size: "sm", variant: "default" }))}
          >
            Join Waitlist
          </Link>
        </div>

      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-border px-6 py-4">
          <div className="flex flex-col gap-4">
            <Link
              href="#features"
              className="font-inconsolata text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#waitlist"
              className="font-inconsolata text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Early Access
            </Link>
            <Link
              href="#waitlist"
              onClick={() => setMobileOpen(false)}
              className={cn(buttonVariants())}
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
