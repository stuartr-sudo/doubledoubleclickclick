import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function MagicOrbLoader({ open, label, duration = 60 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      // Reset when closed
      setTimeLeft(duration);
      setProgress(100);
      return;
    }

    // Reset timer when modal opens
    setTimeLeft(duration);
    setProgress(100);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          return 0;
        }
        return newTime;
      });
      
      setProgress(prev => {
        const newProgress = prev - (100 / duration);
        return Math.max(0, newProgress);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12"
        hideClose
      >
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Animated Orb */}
          <div className="relative">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-50 blur-xl"
              animate={{
                scale: [1.2, 1.5, 1.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Label */}
          {label && (
            <p className="text-center text-white text-lg font-medium max-w-sm">
              {label}
            </p>
          )}

          {/* Timer and Progress */}
          <div className="w-full space-y-3">
            <div className="text-center">
              <span className="text-white/70 text-sm">Estimated time remaining</span>
              <div className="text-white text-2xl font-bold mt-1">
                {formatTime(timeLeft)}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}