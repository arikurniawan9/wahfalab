"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PremiumPageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PremiumPageWrapper({ children, className }: PremiumPageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for premium feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PremiumCard({ children, delay = 0, className }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
