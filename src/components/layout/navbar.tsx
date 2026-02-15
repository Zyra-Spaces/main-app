"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { buttonVariants, ButtonCornerWrapper } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
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
          {user ? (
            <>
              <Link
                href="/feed"
                className={cn(
                  "font-inconsolata text-sm transition-colors",
                  pathname === "/feed" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Feed
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  "font-inconsolata text-sm transition-colors",
                  pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/projects/new"
                className="font-inconsolata text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Project
              </Link>
              <Link
                href="/profile"
                className={cn(
                  "font-inconsolata text-sm transition-colors",
                  pathname.startsWith("/profile") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Profile
              </Link>
              <Link
                href="/products"
                className={cn(
                  "font-inconsolata text-sm transition-colors",
                  pathname.startsWith("/products") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Products
              </Link>
              <ButtonCornerWrapper variant="outline">
                <button
                  onClick={() => signOut()}
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Sign out
                </button>
              </ButtonCornerWrapper>
            </>
          ) : (
            <>
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
              <ButtonCornerWrapper variant="default">
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "sm", variant: "default" }))}
                >
                  Log in
                </Link>
              </ButtonCornerWrapper>
            </>
          )}
        </div>

      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
            {user ? (
              <>
                <Link href="/feed" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Feed
                </Link>
                <Link href="/dashboard" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/projects/new" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Start Project
                </Link>
                <Link href="/profile" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                <Link href="/products" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Products
                </Link>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className={cn(buttonVariants({ variant: "outline" }), "font-inconsolata text-left")}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="#features" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Features
                </Link>
                <Link href="#waitlist" className="font-inconsolata text-sm" onClick={() => setMobileOpen(false)}>
                  Early Access
                </Link>
                <ButtonCornerWrapper variant="default">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className={cn(buttonVariants())}>
                    Log in
                  </Link>
                </ButtonCornerWrapper>
              </>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
