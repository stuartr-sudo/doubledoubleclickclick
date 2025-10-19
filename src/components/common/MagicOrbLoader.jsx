import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function MagicOrbLoader({ open, label, duration = 60 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setTimeLeft(duration);
      setProgress(100);
      return;
    }

    setTimeLeft(duration);
    setProgress(100);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        return newTime <= 0 ? 0 : newTime;
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
        className="max-w-md border-none bg-transparent p-0 shadow-none"
        hideClose
      >
        <div className="flex flex-col items-center justify-center space-y-8 relative">
          {/* Electric Orb Container */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            
            {/* Outer Electric Field */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-60"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "linear",
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            
            <motion.div
              className="absolute inset-0 rounded-full border border-blue-500 opacity-40"
              animate={{ 
                rotate: -360,
                scale: [1.1, 1, 1.1]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity, 
                ease: "linear",
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Main Electric Orb */}
            <motion.div
              className="relative w-32 h-32 rounded-full"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, 
                    rgba(34, 211, 238, 0.9) 0%,
                    rgba(59, 130, 246, 0.95) 25%,
                    rgba(147, 51, 234, 0.9) 50%,
                    rgba(236, 72, 153, 0.8) 75%,
                    rgba(34, 211, 238, 0.7) 100%
                  )
                `,
                boxShadow: `
                  0 0 80px rgba(34, 211, 238, 0.8),
                  0 0 160px rgba(147, 51, 234, 0.6),
                  inset 0 0 80px rgba(255, 255, 255, 0.2)
                `,
              }}
            >
              {/* Electric Core */}
              <motion.div
                className="absolute inset-6 rounded-full bg-gradient-to-br from-white/30 to-cyan-200/40"
                animate={{
                  opacity: [0.4, 0.9, 0.4],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Electric Surface Animation */}
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 40% 60%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Electric Arcs */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`arc-${i}`}
                className="absolute w-1 h-20 bg-gradient-to-b from-cyan-400 via-blue-500 to-transparent"
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: '50% 0%',
                  transform: `translateX(-50%) rotate(${i * 60}deg)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scaleY: [0, 1.2, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Electric Sparks */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-1 h-1 bg-cyan-300 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateX(100px)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 2, 0.5],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Label with Electric Glow */}
          {label && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.p 
                className="text-white text-lg font-medium max-w-sm"
                animate={{
                  textShadow: [
                    '0 0 15px rgba(34, 211, 238, 0.8), 0 0 25px rgba(147, 51, 234, 0.6)',
                    '0 0 25px rgba(147, 51, 234, 0.8), 0 0 35px rgba(34, 211, 238, 0.6)',
                    '0 0 15px rgba(34, 211, 238, 0.8), 0 0 25px rgba(147, 51, 234, 0.6)',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: 'linear-gradient(45deg, #22d3ee, #9333ea, #22d3ee)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradientShift 3s ease-in-out infinite',
                }}
              >
                {label}
              </motion.p>
            </motion.div>
          )}

          {/* Timer with Electric Effects */}
          <div className="w-full space-y-4">
            <div className="text-center">
              <motion.span 
                className="text-cyan-300/80 text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Estimated time remaining
              </motion.span>
              <motion.div 
                className="text-white text-3xl font-bold mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                style={{
                  textShadow: '0 0 20px rgba(34, 211, 238, 0.9), 0 0 30px rgba(147, 51, 234, 0.7)',
                  background: 'linear-gradient(45deg, #22d3ee, #9333ea, #22d3ee)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatTime(timeLeft)}
              </motion.div>
            </div>
            
            {/* Electric Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #22d3ee, #9333ea, #22d3ee)',
                  backgroundSize: '200% 200%',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
                }}
                animate={{
                  width: `${progress}%`,
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  width: { duration: 0.5, ease: "linear" },
                  backgroundPosition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}