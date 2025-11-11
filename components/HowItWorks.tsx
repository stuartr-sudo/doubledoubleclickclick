'use client'

import React from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

type Step = {
  id: number | string
  title: string
  description: string
  image?: string
  button1?: string
  button2?: string
}

const fadeInVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

function StepRow({ step, isLeft }: { step: Step; isLeft: boolean }) {
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
      className={`hiw-step ${isLeft ? 'hiw-step--reverse' : ''}`}
    >
      {/* Step number */}
      <div className="hiw-num">
        <span>{String(step.id).padStart(2, '0')}</span>
      </div>

      {/* Media */}
      <div className="hiw-media">
        {step.image ? (
          <img src={step.image} alt={step.title} width={320} height={320} />
        ) : (
          <div className="hiw-media-placeholder">
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
      <div className="hiw-content">
        <h3 className="hiw-title">{step.title}</h3>
        <p className="hiw-desc">{step.description}</p>
        {(step.button1 || step.button2) && (
          <div className="hiw-actions">
            {step.button1 && <button className="hiw-btn hiw-btn--primary">{step.button1}</button>}
            {step.button2 && <button className="hiw-btn hiw-btn--ghost">{step.button2}</button>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function HowItWorks({
  title,
  steps
}: {
  title?: string
  steps: Step[]
}) {
  return (
    <section className="hiw">
      <div className="hiw-header">
        <h2 className="section-label">{title || 'How it works'}</h2>
      </div>
      <div className="hiw-line" />
      {steps.map((s, i) => (
        <StepRow key={s.id} step={s} isLeft={i % 2 === 1} />
      ))}
    </section>
  )
}


