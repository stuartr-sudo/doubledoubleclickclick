'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useAnimation, Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export interface HowItWorksStep {
  id: string
  number?: string
  title: string
  description: string
  image?: string
  link_text?: string
  link_url?: string
  secondary_link_text?: string
  secondary_link_url?: string
  button1?: string
  button1_link?: string
  button2?: string
  button2_link?: string
}

interface HowItWorksProps {
  title?: string
  subtitle?: string
  steps: HowItWorksStep[]
  bgColor?: string
}

const fadeInVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.17, 0.67, 0.83, 0.67],
    },
  },
}

interface StepProps {
  step: HowItWorksStep
  index: number
  isReversed: boolean
}

const Step = ({ step, index, isReversed }: StepProps) => {
  const controls = useAnimation()
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })

  React.useEffect(() => {
    if (inView) controls.start('visible')
  }, [controls, inView])

  const primaryText = step.link_text || step.button1
  const primaryLink = step.link_url || step.button1_link
  const secondaryText = step.secondary_link_text || step.button2
  const secondaryLink = step.secondary_link_url || step.button2_link
  const stepNumber = step.number || String(index + 1).padStart(2, '0')

  const renderButton = (
    text?: string,
    href?: string | null,
    variant: 'primary' | 'secondary' = 'primary'
  ) => {
    if (!text) return null

    const className = `hiw-button${variant === 'secondary' ? ' hiw-button--secondary' : ''}`

    if (href) {
      return (
        <Link href={href} className={className}>
          {text}
        </Link>
      )
    }

    return (
      <span className={`${className} hiw-button--static`}>
        {text}
      </span>
    )
  }

  return (
    <motion.div
      ref={ref}
      variants={fadeInVariant}
      initial="hidden"
      animate={controls}
      className={`hiw-step ${isReversed ? 'hiw-step--reverse' : ''}`}
    >
      <div className="hiw-step-number">
        <div className="hiw-step-number-circle">{stepNumber}</div>
      </div>

      <div className="hiw-step-image">
        {step.image ? (
          <Image 
            src={step.image} 
            alt={step.title} 
            width={500} 
            height={350} 
            loading="lazy"
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
            style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
          />
        ) : (
          <div className="hiw-step-image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      <div className="hiw-step-content">
        <h3 className="hiw-step-title">{step.title}</h3>
        <p className="hiw-step-description">{step.description}</p>
        {(primaryText || secondaryText) && (
          <div className="hiw-step-actions">
            {renderButton(primaryText, primaryLink || '#', 'primary')}
            {renderButton(secondaryText, secondaryLink || '#', 'secondary')}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const HowItWorks = ({ title, subtitle, steps, bgColor }: HowItWorksProps) => {
  if (!steps || steps.length === 0) return null

  return (
    <section className="hiw-section" style={{ background: bgColor || '#ffffff' }}>
      {(title || subtitle) && (
        <div className="hiw-container">
          <div className="hiw-header">
            {title && <h2 className="hiw-title">{title}</h2>}
            {subtitle && <p className="hiw-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="hiw-container hiw-container--timeline">
        <div className="hiw-line" />

        <div className="hiw-steps">
          {steps.map((step, index) => (
            <Step
              key={step.id || index.toString()}
              step={step}
              index={index}
              isReversed={index % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
