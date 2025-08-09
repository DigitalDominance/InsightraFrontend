"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className = "", hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-xl p-6 shadow-2xl overflow-hidden border",
        "border-white/10 backdrop-blur-xl",
        className,
      )}
      style={{
        background: "rgba(17, 17, 17, 0.6)", // more visible glass
        boxShadow: `
          0 0 0 1px rgba(73, 234, 203, 0.08),
          0 10px 30px rgba(0, 0, 0, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.04)
        `,
      }}
      whileHover={
        hover
          ? {
              scale: 1.01,
              y: -1,
            }
          : {}
      }
      transition={{ duration: 0.2 }}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
