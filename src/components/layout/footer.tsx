"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="border-t border-border py-12"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-[140px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-nunito text-lg font-bold">Zyra</span>
          </div>

          <div className="flex items-center gap-8">
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
              Waitlist
            </Link>
          </div>
        </div>

        <p className="mt-8 font-inconsolata text-xs text-muted-foreground text-center md:text-left">
          © {new Date().getFullYear()} Zyra. Built for founders who build.
        </p>
      </div>
    </motion.footer>
  );
}
