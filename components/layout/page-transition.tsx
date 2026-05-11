"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="h-full"
        initial={
          prefersReducedMotion
            ? { opacity: 1, filter: "blur(0px)" }
            : { opacity: 0, filter: "blur(8px)" }
        }
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={
          prefersReducedMotion
            ? { opacity: 1, filter: "blur(0px)" }
            : { opacity: 0, filter: "blur(8px)" }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
        }
      >
        {children}
      </motion.div>
      <motion.div
        key={`${pathname}-overlay`}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
        }
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </AnimatePresence>
  );
}
