"use client";

import { DitherShader } from "@/components/ui/dither-shader";
import heroBg from "../../../assets/images/1.jpg";
import { buttonVariants, ButtonCornerWrapper } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 lg:pt-28 lg:pb-28">
      {/* Dither Shader background - full bleed */}
      <div className="absolute inset-0 -z-10">
        <DitherShader
          src={heroBg.src}
          gridSize={1}
          ditherMode="bayer"
          colorMode="duotone"
          primaryColor="#0a0a0a"
          secondaryColor="#ffffff"
          threshold={0.2}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Centered hero content */}
      <div className="relative mx-auto max-w-4xl px-6 sm:px-12 lg:px-[140px] text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15, delayChildren: 0.2 },
            },
          }}
          className="space-y-6"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
            className="font-inconsolata text-sm text-white font-medium tracking-wider uppercase"
          >
            Early Access Waitlist Open
          </motion.p>

          <h1 className="font-geist-pixel text-4xl sm:text-5xl md:text-4xl lg:text-4xl xl:text-7xl leading-[1.1] tracking-tight text-white overflow-hidden">
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block whitespace-nowrap"
            >
              WHERE BUILDERS
            </motion.span>
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              MEET BUILDERS
            </motion.span>
          </h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
            className="font-inconsolata text-lg sm:text-xl text-white/70 max-w-2xl mx-auto"
          >
            Where founders connect with fellow builders. Discover open-source
            projects and startups. Contribute, get invited, share ideas, and
            ship products together.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="flex flex-col sm:flex-row gap-4 pt-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <ButtonCornerWrapper variant="default">
                <Link
                  href="#waitlist"
                  className={cn(buttonVariants({ size: "xl", variant: "default" }))}
                >
                  Get Early Access
                </Link>
              </ButtonCornerWrapper>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <ButtonCornerWrapper variant="outline">
                <Link
                  href="#features"
                  className={cn(buttonVariants({ size: "xl", variant: "outline" }))}
                >
                  See How It Works
                </Link>
              </ButtonCornerWrapper>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
