'use client'

import React from 'react'
import { motion, useAnimation, Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'

interface Step {
  id: string
  number: string
  title: string
  description: string
  image?: string
  link_text?: string
  link_url?: string
}

interface HowItWorksProps {
  title?: string
  steps: Step[]
  bgColor?: string
}

// Fade-in animation variant
const fadeInVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.17, 0.67, 0.83, 0.67] },
  },
}

const Step = ({ step, isLeft }: { step: Step; isLeft: boolean }) => {
  const controls = useAnimation()
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })

  React.useEffect(() => {
    if (inView) controls.start('visible')
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      variants={fadeInVariant}
      initial="hidden"
      animate={controls}
      className={`how-it-works-step ${isLeft ? 'how-it-works-step--reverse' : ''}`}
    >
      {/* Step Number */}
      <div className="how-it-works-step-number">
        <div className="how-it-works-step-number-circle">
          {step.number}
        </div>
      </div>

      {/* Image */}
      <div className="how-it-works-step-image">
        {step.image ? (
          <img
            src={step.image}
            alt={step.title}
            className="how-it-works-step-image-img"
          />
        ) : (
          <div className="how-it-works-step-image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="how-it-works-step-content">
        <h3 className="how-it-works-step-title">{step.title}</h3>
        <p className="how-it-works-step-description">{step.description}</p>
        <div className="how-it-works-step-actions">
          {step.link_text && step.link_url && (
            <Link href={step.link_url} className="how-it-works-step-button how-it-works-step-button--primary">
              {step.link_text}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const HowItWorks = ({ title, steps, bgColor }: HowItWorksProps) => {
  return (
    <section className="how-it-works-section-new" style={{ background: bgColor || '#ffffff' }}>
      {title && (
        <div className="how-it-works-header-new">
          <h2 className="section-label">{title}</h2>
        </div>
      )}
      <div className="how-it-works-container">
        {/* Vertical Line */}
        <div className="how-it-works-line" />

        {steps.map((step, index) => (
          <Step key={step.id} step={step} isLeft={index % 2 !== 0} />
        ))}
      </div>
    </section>
  )
}

export default HowItWorks

