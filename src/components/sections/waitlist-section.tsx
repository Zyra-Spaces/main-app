"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      // TODO: Replace with your actual waitlist API endpoint
      // For now, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Example: await fetch("/api/waitlist", { method: "POST", body: JSON.stringify({ email }) });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 sm:px-12 lg:px-[140px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden border border-border bg-card p-8 sm:p-12 shadow-2xl"
        >

          <div className="relative text-center">
            <h2 className="font-nunito text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Join the Early Access Waitlist
            </h2>
            <p className="font-inconsolata text-muted-foreground mb-8">
              Be among the first founders and builders on Zyra. Get notified when
              we launch.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="flex-1 font-geist-mono"
              />
              <Button
                type="submit"
                size="lg"
                disabled={status === "loading" || status === "success"}
                className="sm:w-auto"
              >
                {status === "loading" ? "Joining..." : status === "success" ? "You're in!" : "Join Waitlist"}
              </Button>
            </form>

            {status === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 font-inconsolata text-sm text-white"
              >
                Thanks! We&apos;ll be in touch when Zyra is ready.
              </motion.p>
            )}

            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 font-inconsolata text-sm text-destructive"
              >
                Something went wrong. Please try again.
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
