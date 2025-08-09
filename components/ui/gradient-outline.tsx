"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { forwardRef } from "react"

type Size = "sm" | "md" | "lg"

function sizeClasses(size: Size) {
  switch (size) {
    case "sm":
      return { pad: "px-3 py-1.5 text-sm", radius: "rounded-lg" }
    case "lg":
      return { pad: "px-6 py-3 text-lg", radius: "rounded-xl" }
    case "md":
    default:
      return { pad: "px-4 py-2 text-base", radius: "rounded-xl" }
  }
}

interface OutlineBaseProps {
  className?: string
  size?: Size
  active?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

export const OutlineButton = forwardRef<
  HTMLButtonElement,
  OutlineBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function OutlineButton({ className, size = "md", active = false, disabled, children, ...props }, ref) {
  const s = sizeClasses(size)
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      className={cn(
        "relative inline-flex items-center justify-center",
        s.pad,
        s.radius,
        // Glass background
        "bg-neutral-900/60 backdrop-blur-md",
        "border-2 border-transparent",
        "text-white font-sleek",
        "transition-all duration-200",
        // Gradient border using background-clip
        "bg-clip-padding",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      style={{
        backgroundImage:
          active || !disabled
            ? "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, #49EACB, #7C3AED)"
            : "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, rgba(73, 234, 203, 0.3), rgba(124, 58, 237, 0.3))",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: active
          ? "0 0 25px rgba(73,234,203,0.25), 0 0 25px rgba(124,58,237,0.25)"
          : disabled
            ? "none"
            : "0 0 0 rgba(73,234,203,0.18), 0 0 0 rgba(124,58,237,0.18)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = "0 0 18px rgba(73,234,203,0.18), 0 0 18px rgba(124,58,237,0.18)"
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = active
            ? "0 0 25px rgba(73,234,203,0.25), 0 0 25px rgba(124,58,237,0.25)"
            : "0 0 0 rgba(73,234,203,0.18), 0 0 0 rgba(124,58,237,0.18)"
        }
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
})

export function OutlineLink({
  href,
  className,
  size = "md",
  active = false,
  children,
}: OutlineBaseProps & { href: string }) {
  const s = sizeClasses(size)
  return (
    <Link href={href} className="inline-block">
      <motion.span
        className={cn(
          "inline-flex items-center justify-center",
          s.pad,
          s.radius,
          "bg-neutral-900/60 backdrop-blur-md",
          "border-2 border-transparent",
          "text-white font-cyber tracking-wide",
          "transition-all duration-200",
          "bg-clip-padding",
          className,
        )}
        style={{
          backgroundImage: active
            ? "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, #49EACB, #7C3AED)"
            : "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, rgba(73, 234, 203, 0.3), rgba(124, 58, 237, 0.3))",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: active
            ? "0 0 25px rgba(73,234,203,0.25), 0 0 25px rgba(124,58,237,0.25)"
            : "0 0 0 rgba(73,234,203,0.18), 0 0 0 rgba(124,58,237,0.18)",
        }}
        whileHover={{
          boxShadow: "0 0 18px rgba(73,234,203,0.18), 0 0 18px rgba(124,58,237,0.18)",
        }}
      >
        {children}
      </motion.span>
    </Link>
  )
}

export function OutlineField({
  className,
  children,
  active = false,
}: { className?: string; children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-transparent bg-clip-padding transition-all duration-200",
        className,
      )}
      style={{
        backgroundImage: active
          ? "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, #49EACB, #7C3AED)"
          : "linear-gradient(rgba(23, 23, 23, 0.6), rgba(23, 23, 23, 0.6)), linear-gradient(135deg, rgba(73, 234, 203, 0.3), rgba(124, 58, 237, 0.3))",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: active
          ? "0 0 25px rgba(73,234,203,0.25), 0 0 25px rgba(124,58,237,0.25)"
          : "0 0 0 rgba(73,234,203,0.18), 0 0 0 rgba(124,58,237,0.18)",
      }}
    >
      <div className="rounded-[10px] bg-neutral-900/60 backdrop-blur-md border border-white/10">{children}</div>
    </div>
  )
}
