'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import MobileMenu from '@/components/MobileMenu'
import SubscribeHero from '@/components/SubscribeHero'

interface Service {
  id: string
  title: string
  description: string
  icon?: string
}

interface Program {
  id: string
  badge: string
  title: string
  description: string
  cta_text: string
  cta_link: string
}

interface PricingTier {
  id: string
  name: string
  price: string
  period: string
  description: string
  annual_price?: string
  annual_savings?: string
  features: string[]
  cta_text: string
  cta_link: string
  featured: boolean
}

interface Outcome {
  id: string
  title: string
  description: string
}

interface HomepageContent {
  logo_image?: string
  logo_text?: string
  hero_title?: string
  hero_description?: string
  hero_image?: string
  about_image?: string
  hero_cta_text?: string
  hero_cta_link?: string
  about_title?: string
  about_description?: string
  services_title?: string
  services?: Service[]
  programs_title?: string
  programs?: Program[]
  pricing_title?: string
  pricing?: PricingTier[]
  outcomes_title?: string
  outcomes_subtitle?: string
  outcomes?: Outcome[]
  contact_email?: string
  contact_cta_text?: string
  contact_cta_link?: string
  contact_linkedin_url?: string
  contact_twitter_url?: string
  contact_behance_url?: string
}

interface HomePageClientProps {
  latestPosts: Array<{
    id: string
    title: string
    slug: string | null
    meta_description: string | null
    featured_image: string | null
    created_date: string
  }>
  homepageContent: HomepageContent | null
}

export default function HomePageClient({ latestPosts, homepageContent }: HomePageClientProps) {
  // Default content if not set in CMS
  const logoImage = homepageContent?.logo_image || ''
  const logoText = homepageContent?.logo_text || 'DoubleClicker'
  const heroTitle = homepageContent?.hero_title || 'Make Your Brand the Answer AI Suggests'
  const heroDescription = homepageContent?.hero_description || 'Hello, I&apos;m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let&apos;s create!'
  const heroCTAText = homepageContent?.hero_cta_text || 'Get Started'
  const heroCTALink = homepageContent?.hero_cta_link || '#contact'
  const heroImage = homepageContent?.hero_image || ''
  const aboutTitle = homepageContent?.about_title || 'about.'
  const aboutDescription = homepageContent?.about_description || 'When customers ask AI assistants about your industry, your brand needs to be the answer they get. LLM ranking isn&apos;t just the future of search—it&apos;s happening now. We help brand owners ensure their websites rank in AI responses, driving visibility, traffic, and competitive advantage.'
  const aboutImage = homepageContent?.about_image || ''
  const contactCTAText = homepageContent?.contact_cta_text || 'Get Started'
  const contactCTALink = homepageContent?.contact_cta_link || 'mailto:hello@doubleclicker.com'
  const linkedinUrl = homepageContent?.contact_linkedin_url || '#'
  const twitterUrl = homepageContent?.contact_twitter_url || '#'
  const behanceUrl = homepageContent?.contact_behance_url || '#'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const benefitsSectionRef = useRef<HTMLElement | null>(null)
  const benefitItemsRef = useRef<Array<HTMLDivElement | null>>([])

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Parallax effect for benefits images (subtle, elegant)
  useEffect(() => {
    const handleScroll = () => {
      const section = benefitsSectionRef.current
      if (!section) return

      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY

      if (scrollY + windowHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
        benefitItemsRef.current.forEach((item, index) => {
          if (!item) return
          const rect = item.getBoundingClientRect()
          const centerY = windowHeight / 2
          const distanceFromCenter = rect.top + rect.height / 2 - centerY
          const speed = parseFloat(item.getAttribute('data-parallax') || '0.2')
          const translateY = distanceFromCenter * speed
          const horizontal = (index % 2 === 0 ? -1 : 1) * distanceFromCenter * 0.02

          const image = (item.querySelector('.benefit-image') ||
            item.querySelector('.benefit-image-placeholder')) as HTMLElement | null
          if (image) {
            image.style.transform = `translate(${horizontal}px, ${translateY}px) scale(1)`
          }
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main>
      {/* Hero Section - Minimalist Design */}
      <section className="hero-minimal">
          {/* Header */}
          <header className="hero-minimal-header">
            <div className="hero-minimal-header-content">
              <Link href="/" className="hero-brand">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={logoText} 
                    className="hero-brand-logo"
                    width={150}
                    height={40}
                  />
                ) : (
                  <span>{logoText}</span>
                )}
              </Link>
              <button className="hero-menu-icon" onClick={handleMenuToggle} aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </header>

        {/* Main Content */}
        <div className="hero-minimal-content">
          <div className="hero-minimal-grid">
            {/* Left Side - Name */}
            <div className="hero-minimal-left">
              <h1 className="hero-minimal-name">
                {heroTitle.split('\n').map((line, i) => (
                  <span key={i} className="name-line">{line}</span>
                ))}
              </h1>
            </div>

            {/* Right Side - Image and Text */}
            <div className="hero-minimal-right">
              <div className="hero-minimal-image-wrapper">
                <div className="hero-minimal-image-container">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt="Hero"
                      className="hero-minimal-image"
                      width={300}
                      height={300}
                      loading="lazy"
                    />
                  ) : (
                    // Profile Icon Placeholder
                    <svg 
                      className="hero-minimal-image"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      width="300"
                      height="300"
                    >
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <p className="hero-minimal-intro">
                {heroDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Contact */}
        <div className="hero-minimal-footer">
          <a href="mailto:hello@doubleclicker.com" className="hero-minimal-contact">
            <span>hello@doubleclicker.com</span>
            <svg className="contact-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section" ref={benefitsSectionRef}>
        <div className="benefits-header">
          <h2 className="section-label">benefits.</h2>
        </div>
        <div className="benefits-grid">
          <div
            className="benefit-image-item"
            data-parallax="0.22"
            ref={(el) => { benefitItemsRef.current[0] = el }}
          >
            <div className="benefit-image-wrapper" aria-hidden="true">
              {/* Replace with /public/benefit-1.jpg */}
              <div className="benefit-image-placeholder benefit-1">
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#efefef" />
                      <stop offset="100%" stopColor="#d9d9d9" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="400" fill="url(#g1)" />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="benefit-image-item"
            data-parallax="0.3"
            ref={(el) => { benefitItemsRef.current[1] = el }}
          >
            <div className="benefit-image-wrapper" aria-hidden="true">
              {/* Replace with /public/benefit-2.jpg */}
              <div className="benefit-image-placeholder benefit-2">
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f2f2f2" />
                      <stop offset="100%" stopColor="#e6e6e6" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="400" fill="url(#g2)" />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="benefit-image-item"
            data-parallax="0.26"
            ref={(el) => { benefitItemsRef.current[2] = el }}
          >
            <div className="benefit-image-wrapper" aria-hidden="true">
              {/* Replace with /public/benefit-3.jpg */}
              <div className="benefit-image-placeholder benefit-3">
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ededed" />
                      <stop offset="100%" stopColor="#dcdcdc" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="400" fill="url(#g3)" />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="benefit-image-item"
            data-parallax="0.34"
            ref={(el) => { benefitItemsRef.current[3] = el }}
          >
            <div className="benefit-image-wrapper" aria-hidden="true">
              {/* Replace with /public/benefit-4.jpg */}
              <div className="benefit-image-placeholder benefit-4">
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g4" x1="1" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f0f0f0" />
                      <stop offset="100%" stopColor="#e1e1e1" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="400" fill="url(#g4)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes Section - Outcome-driven value props */}
      <section className="outcomes-section">
        <div className="outcomes-header">
          <h2 className="section-label">{homepageContent?.outcomes_title || 'outcomes.'}</h2>
          <h3 className="outcomes-heading">Become the brand AI recommends</h3>
          <p className="outcomes-subtitle">
            {homepageContent?.outcomes_subtitle || 'We specialize in one thing: ranking your brand inside AI assistants. Every program below is designed to move you toward that outcome.'}
          </p>
        </div>
        <div className="outcomes-grid">
          {homepageContent?.outcomes && homepageContent.outcomes.length > 0 ? (
            homepageContent.outcomes.map((outcome) => (
              <div key={outcome.id} className="outcome-card">
                <h4 className="outcome-title">{outcome.title}</h4>
                <p className="outcome-text">{outcome.description}</p>
              </div>
            ))
          ) : (
            <>
              <div className="outcome-card">
                <h4 className="outcome-title">Visibility in AI Answers</h4>
                <p className="outcome-text">Appear when customers ask ChatGPT, Claude, and Perplexity about your category.</p>
              </div>
              <div className="outcome-card">
                <h4 className="outcome-title">Qualified Demand</h4>
                <p className="outcome-text">Turn intent-rich AI recommendations into visitors, trials, and purchases.</p>
              </div>
              <div className="outcome-card">
                <h4 className="outcome-title">Competitive Positioning</h4>
                <p className="outcome-text">Own the answer before competitors do with a defensible LLM content strategy.</p>
              </div>
              <div className="outcome-card">
                <h4 className="outcome-title">Future‑Proof SEO</h4>
                <p className="outcome-text">Bridge traditional search and LLM ranking to sustain growth through the shift to AI.</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Programs & Products */}
      <section className="products-section" id="products">
        <div className="products-header">
          <h2 className="section-label">{homepageContent?.programs_title || 'programs & products.'}</h2>
        </div>
        <div className="products-grid">
          {homepageContent?.programs && homepageContent.programs.length > 0 ? (
            homepageContent.programs.map((program) => (
              <div key={program.id} className="product-card">
                <div className="product-badge">{program.badge}</div>
                <h3 className="product-title">{program.title}</h3>
                <p className="product-description">{program.description}</p>
                <Link href={program.cta_link} className="btn-pricing">{program.cta_text}</Link>
              </div>
            ))
          ) : (
            <>
              <div className="product-card">
                <div className="product-badge">Guide</div>
                <h3 className="product-title">The LLM Ranking Playbook</h3>
                <p className="product-description">
                  A practical, step‑by‑step system to make your brand the answer AI suggests. Frameworks, prompts, and implementation checklists.
                </p>
                <Link href="/lead-capture?type=ebook" className="btn-pricing">Get Early Access</Link>
              </div>
              <div className="product-card">
                <div className="product-badge">Training</div>
                <h3 className="product-title">Rank in LLMs — Team Course</h3>
                <p className="product-description">
                  A live, cohort‑based program for brand and content teams. Build your LLM content architecture and ship a first ranking sprint in 4 weeks.
                </p>
                <Link href="/lead-capture?type=course" className="btn-pricing">Join the Waitlist</Link>
              </div>
              <div className="product-card product-card-accent">
                <div className="product-badge accent">Software (Beta)</div>
                <h3 className="product-title">DoubleClicker — LLM Visibility</h3>
                <p className="product-description">
                  Plan, publish, and monitor content for AI ranking. Limited beta access for qualified brands.
                </p>
                <Link href="/lead-capture?type=beta" className="btn-pricing">Apply for Beta</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="services">
        <div className="services-header">
          <h2 className="section-label">services.</h2>
          <button className="show-more-btn">Show More</button>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="service-title">LLM Optimization</h3>
            <p className="service-description">
              We optimize your website content to be understood and recommended by AI systems. Your brand becomes discoverable when customers ask AI assistants.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="service-title">Brand Visibility</h3>
            <p className="service-description">
              Increase your presence in AI responses across ChatGPT, Claude, Perplexity, and other LLM platforms. Be the answer your customers find.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="service-title">Competitive Advantage</h3>
            <p className="service-description">
              Stay ahead in AI-powered search. We help you rank higher than competitors when customers use AI to discover brands in your industry.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">how it works.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3 className="step-title">Analyze Your Current LLM Visibility</h3>
            <p className="step-description">
              We assess how AI systems currently understand and rank your brand. Discover where you stand and identify opportunities for improvement.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h3 className="step-title">Optimize Your Content for AI Understanding</h3>
            <p className="step-description">
              We refine your website content to be perfectly structured for AI comprehension. Your brand becomes easier for LLMs to recommend.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h3 className="step-title">Monitor and Improve Rankings</h3>
            <p className="step-description">
              Track your visibility across AI platforms and continuously optimize. Watch your brand become the answer AI suggests to more customers.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="privacy">
        <div className="about-header">
          <h2 className="section-label">{aboutTitle}</h2>
          <button className="show-more-btn">Show More</button>
        </div>
        <div className="about-content">
          <div className="about-text-block">
            <p className="about-main-text">
              {aboutDescription}
            </p>
          </div>
          <div className="about-image-block">
            <div className="about-image-wrapper">
              {/* About Image (dynamic) */}
              <div className="about-image-container">
                {aboutImage ? (
                  <img
                    src={aboutImage}
                    alt="About"
                    className="about-image"
                    width={500}
                    height={600}
                    loading="lazy"
                  />
                ) : (
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="about-image"
                    width="500"
                    height="600"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <p className="about-secondary-text">
              We work with brands of all sizes to optimize their content for AI understanding. Our approach ensures your brand becomes discoverable when customers use AI assistants to find products, services, or solutions in your space.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-header">
          <h2 className="section-label">{homepageContent?.pricing_title || 'pricing.'}</h2>
        </div>
        <div className="pricing-grid">
          {homepageContent?.pricing && homepageContent.pricing.length > 0 ? (
            homepageContent.pricing.map((tier) => (
              <div key={tier.id} className={`pricing-card ${tier.featured ? 'pricing-card-featured' : ''}`}>
                <h3 className="pricing-tier">{tier.name}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{tier.price}</span>
                  {tier.period && <span className="price-period">{tier.period}</span>}
                </div>
                {tier.annual_price && (
                  <div className="pricing-annual">
                    <span className="annual-label">Annual:</span>
                    <span className="annual-price">{tier.annual_price}</span>
                    {tier.annual_savings && <span className="annual-savings">({tier.annual_savings})</span>}
                  </div>
                )}
                {tier.description && <p className="pricing-description">{tier.description}</p>}
                <ul className="pricing-features">
                  {tier.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <Link href={tier.cta_link} className="btn-pricing">
                  {tier.cta_text}
                </Link>
              </div>
            ))
          ) : (
            <>
              <div className="pricing-card">
                <h3 className="pricing-tier">Brands</h3>
                <div className="pricing-price">
                  <span className="price-amount">$1,997</span>
                  <span className="price-period">/month</span>
                </div>
                <div className="pricing-annual">
                  <span className="annual-label">Annual:</span>
                  <span className="annual-price">$19,171</span>
                  <span className="annual-savings">(20% off)</span>
                </div>
                <ul className="pricing-features">
                  <li>LLM Optimization for 1 website</li>
                  <li>Monthly visibility reports</li>
                  <li>Content optimization recommendations</li>
                  <li>Email support</li>
                </ul>
                <a href="#contact" className="btn-pricing">
                  Get Started
                </a>
              </div>
              <div className="pricing-card pricing-card-featured">
                <h3 className="pricing-tier">Agencies</h3>
                <div className="pricing-price">
                  <span className="price-amount">Custom</span>
                </div>
                <p className="pricing-description">Tailored solutions for agencies managing multiple client websites.</p>
                <ul className="pricing-features">
                  <li>Multi-website management</li>
                  <li>White-label reporting</li>
                  <li>Priority support</li>
                  <li>Dedicated account manager</li>
                  <li>Custom integrations</li>
                </ul>
                <Link href="/agencies" className="btn-pricing">
                  Learn More
                </Link>
              </div>
              <div className="pricing-card">
                <h3 className="pricing-tier">Enterprise</h3>
                <div className="pricing-price">
                  <span className="price-amount">Custom</span>
                </div>
                <p className="pricing-description">Enterprise-grade solutions for large organizations.</p>
                <ul className="pricing-features">
                  <li>Unlimited websites</li>
                  <li>Advanced analytics & insights</li>
                  <li>24/7 priority support</li>
                  <li>Custom SLA</li>
                  <li>On-site training & consultation</li>
                  <li>API access</li>
                </ul>
                <Link href="/enterprise" className="btn-pricing">
                  Contact Sales
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-header">
          <nav className="contact-nav">
            <a href={linkedinUrl} className="contact-link" target="_blank" rel="noopener noreferrer">Linkedin</a>
            <a href={twitterUrl} className="contact-link" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href={behanceUrl} className="contact-link" target="_blank" rel="noopener noreferrer">Behance</a>
          </nav>
        </div>
        <div className="contact-content">
          <h2 className="contact-headline">
            Ready to make your brand the answer AI suggests?
            <br />
            Let&apos;s get your website ranking in LLMs.
            <span className="cursor-icon">●</span>
          </h2>
          <div className="contact-cta">
            <a href={contactCTALink} className="btn-contact">
              {contactCTAText}
            </a>
            <div className="availability-status">
              <span className="status-dot"></span>
              <span className="status-text">Available For Work</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Hero */}
      <SubscribeHero source="homepage" />

      {/* Latest Blog Posts Preview */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="blog-preview">
          <div className="container">
            <h2 className="section-title">Latest Blog Posts</h2>
            <div className="blog-grid">
              {latestPosts.map((post) => (
                <article key={post.id} className="blog-card">
                  {post.featured_image && (
                    <div className="blog-card-image">
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        loading="lazy"
                        width={400}
                        height={250}
                      />
                    </div>
                  )}
                  <div className="blog-card-content">
                    <h3>
                      <Link href={`/blog/${post.slug || post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    {post.meta_description && (
                      <p>{post.meta_description}</p>
                    )}
                    <time dateTime={post.created_date}>
                      {new Date(post.created_date).toLocaleDateString()}
                    </time>
                  </div>
                </article>
              ))}
            </div>
            <div className="blog-preview-cta">
              <Link href="/blog" className="btn btn-secondary">
                View All Posts
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} DoubleClicker. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Menu Component */}
      <MobileMenu isOpen={isMenuOpen} onClose={handleMenuToggle} />
    </main>
  )
}

