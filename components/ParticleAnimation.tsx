'use client'

import { useEffect, useState } from 'react'

interface ParticleAnimationProps {
  isActive: boolean
  onComplete?: () => void
}

export default function ParticleAnimation({ isActive, onComplete }: ParticleAnimationProps) {
  const [particles, setParticles] = useState<number[]>([])

  useEffect(() => {
    if (isActive) {
      // Generate 400 particles
      setParticles(Array.from({ length: 400 }, (_, i) => i))

      // Clear particles after animation completes (3 seconds)
      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  if (!isActive || particles.length === 0) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .particle-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
          }

          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            animation: shoot 3s ease-out forwards, fade 3s ease-out forwards;
          }

          @keyframes shoot {
            0% {
              transform: translate(50vw, 50vh);
            }
          }

          @keyframes fade {
            to {
              opacity: 0;
            }
          }
        `
      }} />
      
      <div className="particle-container">
        {particles.map((i) => {
          // Random values for each particle
          const randomX = Math.random() * 100
          const randomY = Math.random() * 100
          const randomHue = Math.random() * 360
          const duration = (1 + Math.random()) * 1 // 1-2 seconds
          const delay = -Math.random() * duration * 0.01 // Stagger start times

          return (
            <div
              key={i}
              className="particle"
              style={{
                transform: `translate(${randomX}vw, ${randomY}vh)`,
                backgroundColor: `hsl(${randomHue}, 100%, 65%)`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}
      </div>
    </>
  )
}

