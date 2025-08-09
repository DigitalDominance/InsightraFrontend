"use client";

import { motion } from "framer-motion";
import GlassCard from "@/components/ui/glass-card";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="text-center" hover={false}>
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="w-12 h-12 border-4 border-gray-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-[#49EACB] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
              Loading Insightra
            </h2>
            <p className="text-gray-400 text-sm">
              Preparing your prediction markets...
            </p>
          </div>
        </motion.div>
      </GlassCard>
    </div>
  );
}
