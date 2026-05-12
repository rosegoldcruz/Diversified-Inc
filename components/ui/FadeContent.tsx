"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type FadeContentProps = {
  children: ReactNode;
  blur?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
};

export function FadeContent({
  children,
  blur = true,
  duration = 800,
  delay = 50,
  className,
  as = "div",
}: FadeContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component =
    as === "section"
      ? motion.section
      : as === "article"
        ? motion.article
        : motion.div;

  return (
    <Component
      className={cn(className)}
      initial={
        prefersReducedMotion
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 14, filter: blur ? "blur(14px)" : "blur(0px)" }
      }
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : duration / 1000,
        delay: prefersReducedMotion ? 0 : delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </Component>
  );
}
