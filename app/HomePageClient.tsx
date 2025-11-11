'use client'

import { useState } from 'react'
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

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface WhyWorkWithUsItem {
  id: string
  title: string
  description: string
  link_text: string
  link_url: string
  icon?: string
}

interface TestimonialItem {
  id: string
  quote: string
  rating: number
  author_name: string
  author_title: string
  author_company: string
  author_image?: string
}

interface ServiceItem {
  id: string
  title: string
  image?: string
  link_url?: string
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
  hero_footer_cta_text?: string
  hero_footer_cta_link?: string
  hero_bg_gradient?: string
  hero_text_color?: string
  hero_cta_bg_color?: string
  hero_cta_text_color?: string
  quiz_title?: string
  quiz_description?: string
  quiz_cta_text?: string
  quiz_cta_link?: string
  quiz_steps?: string
  quiz_badge_text?: string
  tech_carousel_title?: string
  tech_carousel_items?: Array<{ id: string; name: string; icon?: string }>
  tech_carousel_bg_color?: string
  how_it_works_title?: string
  how_it_works_steps?: Array<{ id: string; number: string; title: string; description: string; image?: string; link_text?: string; link_url?: string }>
  how_it_works_bg_color?: string
  why_work_with_us_title?: string
  why_work_with_us_subtitle?: string
  why_work_with_us_description?: string
  why_work_with_us_items?: WhyWorkWithUsItem[]
  why_work_with_us_bg_color?: string
  faq_items?: FAQItem[]
  faq_bg_color?: string
  testimonials_label?: string
  testimonials_title?: string
  testimonials_subtitle?: string
  testimonials_items?: TestimonialItem[]
  testimonials_bg_color?: string
  services_section_title?: string
  services_section_description?: string
  services_items?: ServiceItem[]
  services_bg_color?: string
  blog_grid_bg_color?: string
  quiz_cta_bg_color?: string
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
  const heroFooterCTAText = homepageContent?.hero_footer_cta_text || 'Get Started'
  const heroFooterCTALink = homepageContent?.hero_footer_cta_link || 'mailto:hello@doubleclicker.com'
  const heroImage = homepageContent?.hero_image || ''
  const heroBgGradient = homepageContent?.hero_bg_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  const heroTextColor = homepageContent?.hero_text_color || '#ffffff'
  const heroCTABgColor = homepageContent?.hero_cta_bg_color || '#000000'
  const heroCTATextColor = homepageContent?.hero_cta_text_color || '#ffffff'
  const quizTitle = homepageContent?.quiz_title || 'Take the 12-Step Quiz'
  const quizDescription = homepageContent?.quiz_description || 'See where you&apos;re missing out on LLM visibility. Get personalized insights in minutes.'
  const quizCTAText = homepageContent?.quiz_cta_text || 'Start Quiz'
  const quizCTALink = homepageContent?.quiz_cta_link || '/quiz'
  const quizSteps = homepageContent?.quiz_steps || '12'
  const quizBadgeText = homepageContent?.quiz_badge_text || 'Steps'
  const techCarouselTitle = homepageContent?.tech_carousel_title || 'Technology we work with'
  const techCarouselItems = homepageContent?.tech_carousel_items || [
    { id: '1', name: 'ChatGPT', icon: '' },
    { id: '2', name: 'Claude', icon: '' },
    { id: '3', name: 'Gemini', icon: '' },
    { id: '4', name: 'Grok', icon: '' },
    { id: '5', name: 'Perplexity', icon: '' },
    { id: '6', name: 'Supabase', icon: '' },
    { id: '7', name: 'n8n', icon: '' }
  ]
  const howItWorksTitle = homepageContent?.how_it_works_title || 'How it works'
  const howItWorksSteps = homepageContent?.how_it_works_steps || [
    { id: '1', number: '01', title: 'Simple Booking', description: 'Effortlessly schedule a consultation to discuss your business needs and challenges. We streamline the process to get started quickly.', image: '', link_text: 'Discover More', link_url: '#' }
  ]
  const step2 = homepageContent?.how_it_works_steps?.[1] || { id: '2', number: '02', title: 'Tailored Strategy', description: 'We analyze your goals and create a customized strategy designed to drive measurable success for your business needs.', image: '', link_text: 'Discover More', link_url: '#' }
  const step3 = homepageContent?.how_it_works_steps?.[2] || { id: '3', number: '03', title: 'Continuous Support', description: 'From implementation to optimization, we provide ongoing guidance and adjustments to ensure long-term growth for you and your business.', image: '', link_text: 'Discover More', link_url: '#' }
  const aboutTitle = homepageContent?.about_title || 'about.'
  const aboutDescription = homepageContent?.about_description || 'When customers ask AI assistants about your industry, your brand needs to be the answer they get. LLM ranking isn&apos;t just the future of search—it&apos;s happening now. We help brand owners ensure their websites rank in AI responses, driving visibility, traffic, and competitive advantage.'
  const aboutImage = homepageContent?.about_image || ''
  const contactCTAText = homepageContent?.contact_cta_text || 'Get Started'
  const contactCTALink = homepageContent?.contact_cta_link || 'mailto:hello@doubleclicker.com'
  const linkedinUrl = homepageContent?.contact_linkedin_url || '#'
  const twitterUrl = homepageContent?.contact_twitter_url || '#'
  const behanceUrl = homepageContent?.contact_behance_url || '#'
  const whyWorkWithUsTitle = homepageContent?.why_work_with_us_title || 'Why Work With Us'
  const whyWorkWithUsSubtitle = homepageContent?.why_work_with_us_subtitle || 'We strive to deliver value to our clients'
  const whyWorkWithUsDescription = homepageContent?.why_work_with_us_description || 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.'
  const whyWorkWithUsItems = homepageContent?.why_work_with_us_items || [
    { id: '1', title: 'Proven track record', description: 'We have helped countless businesses overcome challenges.', link_text: 'Our track record', link_url: '#', icon: '' },
    { id: '2', title: 'Collaborative approach', description: 'We ensure transparency throughout the process.', link_text: 'Our process', link_url: '#', icon: '' },
    { id: '3', title: 'Innovative solutions', description: 'We leverage the latest technologies to deliver solutions.', link_text: 'Our solutions', link_url: '#', icon: '' }
  ]
  const techCarouselBgColor = homepageContent?.tech_carousel_bg_color || '#ffffff'
  const howItWorksBgColor = homepageContent?.how_it_works_bg_color || '#ffffff'
  const whyWorkWithUsBgColor = homepageContent?.why_work_with_us_bg_color || '#ffffff'
  const faqBgColor = homepageContent?.faq_bg_color || '#ffffff'
  const testimonialsLabel = homepageContent?.testimonials_label || 'Testimonials'
  const testimonialsTitle = homepageContent?.testimonials_title || 'Trusted by 10k+ customers'
  const testimonialsSubtitle = homepageContent?.testimonials_subtitle || 'Whether you\'re a small startup or a multinational corporation, let us be your trusted advisor on the path to success.'
  const testimonialsItems = homepageContent?.testimonials_items || [
    { id: '1', quote: 'The impact of Consulting\'s work on our organization has been transformative. Their dedication to our success have helped us achieve remarkable growth.', rating: 5, author_name: 'Alex Peterson', author_title: 'CEO', author_company: 'Thompson Industries', author_image: '' },
    { id: '2', quote: 'Their team\'s depth of knowledge, strategic thinking, and commitment to excellence have been instrumental in helping us navigate complex challenges.', rating: 4, author_name: 'David Martinez', author_title: 'Director', author_company: 'Johnson Enterprises', author_image: '' },
    { id: '3', quote: 'The team at Consulting exceeded our expectations in every way. We are grateful for their partnership and the positive impact they\'ve had on our business.', rating: 5, author_name: 'John Smith', author_title: 'Founder', author_company: 'JS Solutions', author_image: '' }
  ]
  const testimonialsBgColor = homepageContent?.testimonials_bg_color || '#f5f5f5'
  const servicesSectionTitle = homepageContent?.services_section_title || 'Our services'
  const servicesSectionDescription = homepageContent?.services_section_description || 'Our team combines expertise with creativity to transform outdoor spaces into breathtaking landscapes that enhance the beauty of any property.'
  const servicesItems = homepageContent?.services_items || [
    { id: '1', title: 'Landscaping works', image: '', link_url: '#' },
    { id: '2', title: 'Garden design', image: '', link_url: '#' },
    { id: '3', title: 'Seasonal planting', image: '', link_url: '#' }
  ]
  const servicesBgColor = homepageContent?.services_bg_color || '#ffffff'
  const blogGridBgColor = homepageContent?.blog_grid_bg_color || '#ffffff'
  const quizCtaBgColor = homepageContent?.quiz_cta_bg_color || '#ffffff'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const faqItems = [
    {
      question: 'How does your consulting process work?',
      answer: 'Our consulting process begins with a comprehensive analysis of your current LLM visibility. We assess how AI systems understand and rank your brand, then create a customized strategy to improve your positioning. Throughout the process, we provide ongoing guidance and optimization to ensure long-term success.'
    },
    {
      question: 'What industries do you specialize in?',
      answer: 'We work with brands across various industries, from technology and SaaS to e-commerce, healthcare, finance, and professional services. Our approach is tailored to each industry\'s unique challenges and opportunities in AI-powered search.'
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Results can vary depending on your current visibility and the scope of optimization needed. Typically, you\'ll start seeing improvements in LLM rankings within 4-8 weeks, with more significant gains appearing over 3-6 months as AI systems index and understand your optimized content.'
    },
    {
      question: 'Do you offer one-time consultations?',
      answer: 'Yes, we offer both one-time consultations and ongoing partnerships. A one-time consultation provides you with a strategic roadmap and actionable recommendations, while ongoing partnerships include continuous optimization, monitoring, and support.'
    },
    {
      question: 'Can small businesses afford your services?',
      answer: 'Absolutely. We offer flexible pricing options designed to accommodate businesses of all sizes. Our services are structured to provide value at every level, from startups to enterprise organizations. Contact us to discuss a solution that fits your budget.'
    },
    {
      question: 'How do I get started?',
      answer: 'Getting started is simple. Take our 12-step quiz to see where you\'re missing out on LLM visibility, or reach out directly through our contact form. We\'ll schedule a consultation to discuss your goals and create a customized plan for your brand.'
    }
  ]

  return (
    <main>
      {/* Hero Section - Stripe-style Design */}
      <section className="hero-stripe">
        {/* Hamburger Menu - Inside Hero Container */}
        <button className="hero-menu-icon" onClick={handleMenuToggle} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </button>

        {/* Main Content */}
        <div className="hero-stripe-content">
          <div className="hero-stripe-grid">
            {/* Left Column - Content with Gradient Background */}
            <div 
              className="hero-stripe-left"
              style={{
                background: heroBgGradient,
                color: heroTextColor
              }}
            >
              <div className="hero-stripe-left-inner">
                <h1 className="hero-stripe-title">
                  {heroTitle.split('\n').map((line, i) => (
                    <span key={i} className="title-line">{line}</span>
                  ))}
                </h1>
                <p className="hero-stripe-description">
                  {heroDescription}
                </p>
              </div>
            </div>

            {/* Right Column - Quiz CTA */}
            <div className="hero-stripe-right">
              <div className="hero-quiz-cta">
                <div className="quiz-badge">
                  <span className="quiz-steps">{quizSteps}</span>
                  <span className="quiz-badge-text">{quizBadgeText}</span>
                </div>
                <h2 className="quiz-title">{quizTitle}</h2>
                <p className="quiz-description">{quizDescription}</p>
                <Link 
                  href={quizCTALink} 
                  className="quiz-cta-button"
                  style={{
                    backgroundColor: heroCTABgColor,
                    color: heroCTATextColor
                  }}
                >
                  {quizCTAText}
                  <svg className="cta-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Carousel Section */}
      <section className="tech-carousel-section" style={{ background: techCarouselBgColor }}>
        <div className="tech-carousel-header">
          <h2 className="section-label">{techCarouselTitle}</h2>
        </div>
        <div className="tech-carousel-wrapper">
          <div className="tech-carousel-track">
            {/* First set of items */}
            {techCarouselItems.map((item) => (
              <div key={item.id} className="tech-carousel-item">
                <div className="tech-icon-wrapper">
                  {item.icon ? (
                    <img src={item.icon} alt={item.name} className="tech-icon" width={80} height={80} />
                  ) : (
                    <div className="tech-icon-placeholder">
                      <span className="tech-icon-text">{item.name}</span>
                    </div>
                  )}
                </div>
                <div className="tech-title">{item.name}</div>
              </div>
            ))}
            {/* Duplicate set for seamless infinite scroll */}
            {techCarouselItems.map((item) => (
              <div key={`${item.id}-duplicate`} className="tech-carousel-item">
                <div className="tech-icon-wrapper">
                  {item.icon ? (
                    <img src={item.icon} alt={item.name} className="tech-icon" width={80} height={80} />
                  ) : (
                    <div className="tech-icon-placeholder">
                      <span className="tech-icon-text">{item.name}</span>
                    </div>
                  )}
                </div>
                <div className="tech-title">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Timeline Layout */}
      <section className="how-it-works-section" style={{ background: howItWorksBgColor }}>
        <div className="how-it-works-header">
          <h2 className="section-label">{howItWorksTitle}</h2>
        </div>
        <div className="how-it-works-timeline">
          {howItWorksSteps.map((step, index) => {
            const isReversed = index % 2 === 1
            return (
              <div
                key={step.id}
                className={`timeline-row ${isReversed ? 'timeline-row--reverse' : ''}`}
              >
                <div className="timeline-side timeline-side--text">
                  <h3 className="timeline-title">{step.title}</h3>
                  <p className="timeline-description">{step.description}</p>
                  {step.link_text && step.link_url && (
                    <Link href={step.link_url} className="timeline-link">
                      {step.link_text}
                      <svg className="timeline-link-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  )}
                </div>
                <div className="timeline-marker">
                  <span className="timeline-number">{step.number}</span>
                </div>
                <div className="timeline-side timeline-side--media">
                  <div className="timeline-media">
                    <div className="timeline-media-inner">
                      {step.image ? (
                        <img
                          src={step.image}
                          alt={step.title}
                          className="timeline-media-image"
                          width={500}
                          height={500}
                          loading="lazy"
                        />
                      ) : (
                        <div className="timeline-media-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Step 2 - Reversed Layout (within same timeline) */}
          <div className="timeline-row timeline-row--continue">
            <div className="step-card-media">
              <div className="step-card-media-inner">
                {step2.image ? (
                  <img
                    src={step2.image}
                    alt={step2.title}
                    className="step-card-image"
                    width={500}
                    height={500}
                    loading="lazy"
                  />
                ) : (
                  <div className="step-card-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="timeline-marker">
              <span className="timeline-number">{step2.number}</span>
            </div>
            <div className="step-card-text">
              <h3 className="timeline-title">{step2.title}</h3>
              <p className="timeline-description">{step2.description}</p>
              {step2.link_text && step2.link_url && (
                <Link href={step2.link_url} className="timeline-link">
                  {step2.link_text}
                  <svg className="timeline-link-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Step 3 - Separate Section (Image Right, Text Left - Same as Step 1) */}
      <section className="step-card-section">
        <div className="step-card-container">
          <div className="timeline-row">
            <div className="timeline-side timeline-side--text">
              <h3 className="timeline-title">{step3.title}</h3>
              <p className="timeline-description">{step3.description}</p>
              {step3.link_text && step3.link_url && (
                <Link href={step3.link_url} className="timeline-link">
                  {step3.link_text}
                  <svg className="timeline-link-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
            <div className="timeline-marker">
              <span className="timeline-number">{step3.number}</span>
            </div>
            <div className="timeline-side timeline-side--media">
              <div className="timeline-media">
                <div className="timeline-media-inner">
                  {step3.image ? (
                    <img
                      src={step3.image}
                      alt={step3.title}
                      className="timeline-media-image"
                      width={500}
                      height={500}
                      loading="lazy"
                    />
                  ) : (
                    <div className="timeline-media-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz CTA Section */}
      <section className="quiz-cta-section" style={{ background: quizCtaBgColor }}>
        <div className="quiz-cta-container">
          <h2 className="quiz-cta-title">Want More SEO Traffic?</h2>
          <p className="quiz-cta-subtitle">
            Answer 5 quick questions and I will give you a step-by-step <strong>7-week action plan</strong> showing you exactly what you need to do to get more traffic.
          </p>
          <div className="quiz-cta-form">
            <input 
              type="url" 
              placeholder="What is the URL of your website?" 
              className="quiz-cta-input"
            />
            <Link href={quizCTALink} className="quiz-cta-button">NEXT</Link>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="why-work-with-us-section" style={{ background: whyWorkWithUsBgColor }}>
        <div className="why-work-with-us-container">
          <div className="why-work-with-us-header">
            <div className="why-work-with-us-label-line"></div>
            <span className="why-work-with-us-label">{whyWorkWithUsTitle}</span>
            <h2 className="why-work-with-us-title">{whyWorkWithUsSubtitle}</h2>
            <p className="why-work-with-us-description">{whyWorkWithUsDescription}</p>
          </div>
          <div className="why-work-with-us-grid">
            {whyWorkWithUsItems.map((item) => (
              <div key={item.id} className="why-work-with-us-card">
                <div className="why-work-with-us-icon-wrapper">
                  {item.icon ? (
                    <img src={item.icon} alt={item.title} className="why-work-with-us-icon" width={64} height={64} />
                  ) : (
                    <div className="why-work-with-us-icon-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="why-work-with-us-card-title">{item.title}</h3>
                <p className="why-work-with-us-card-description">{item.description}</p>
                <Link href={item.link_url} className="why-work-with-us-link">
                  {item.link_text}
                  <svg className="why-work-with-us-link-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" style={{ background: faqBgColor }}>
        <div className="faq-container">
          <div className="faq-header">
            <span className="faq-label">FAQ</span>
            <h2 className="faq-title">Answers to your most common questions</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <svg
                    className={`faq-chevron ${openFaqIndex === index ? 'faq-chevron-open' : ''}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openFaqIndex === index && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" style={{ background: testimonialsBgColor }}>
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="testimonials-label">{testimonialsLabel}</span>
            <div className="testimonials-header-content">
              <h2 className="testimonials-title">{testimonialsTitle}</h2>
              <p className="testimonials-subtitle">{testimonialsSubtitle}</p>
            </div>
          </div>
          <div className="testimonials-grid">
            {testimonialsItems.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, index) => (
                    <svg
                      key={index}
                      className={`star ${index < testimonial.rating ? 'star-filled' : 'star-empty'}`}
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 1L12.5 7.5L19 8.5L14.5 13L15.5 19L10 16L4.5 19L5.5 13L1 8.5L7.5 7.5L10 1Z"
                        fill={index < testimonial.rating ? '#FFB800' : '#E0E0E0'}
                        stroke={index < testimonial.rating ? '#FFB800' : '#E0E0E0'}
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ))}
                </div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <div className="testimonial-author-image">
                    {testimonial.author_image ? (
                      <img
                        src={testimonial.author_image}
                        alt={testimonial.author_name}
                        width={56}
                        height={56}
                      />
                    ) : (
                      <div className="testimonial-author-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="testimonial-author-info">
                    <div className="testimonial-author-name">{testimonial.author_name}</div>
                    <div className="testimonial-author-title">{testimonial.author_company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-showcase-section" style={{ background: servicesBgColor }}>
        <div className="services-showcase-container">
          <div className="services-showcase-header">
            <h2 className="services-showcase-title">{servicesSectionTitle}</h2>
            <p className="services-showcase-description">{servicesSectionDescription}</p>
          </div>
          <div className="services-showcase-grid">
            {servicesItems.map((service) => (
              <Link
                key={service.id}
                href={service.link_url || '#'}
                className="service-showcase-card"
              >
                <div className="service-showcase-image">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      width={440}
                      height={480}
                    />
                  ) : (
                    <div className="service-showcase-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}
                  <div className="service-showcase-overlay"></div>
                </div>
                <div className="service-showcase-content">
                  <h3 className="service-showcase-card-title">{service.title}</h3>
                  <svg className="service-showcase-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts - 3x2 Grid */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="blog-grid-section" style={{ background: blogGridBgColor }}>
          <div className="blog-grid-container">
            <div className="blog-grid-3x2">
              {latestPosts.slice(0, 6).map((post) => (
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
                      {new Date(post.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quiz CTA Section - Bottom */}
      <section className="quiz-cta-section">
        <div className="quiz-cta-container">
          <h2 className="quiz-cta-title">Want More SEO Traffic?</h2>
          <p className="quiz-cta-subtitle">
            Answer 5 quick questions and I will give you a step-by-step <strong>7-week action plan</strong> showing you exactly what you need to do to get more traffic.
          </p>
          <div className="quiz-cta-form">
            <input 
              type="url" 
              placeholder="What is the URL of your website?" 
              className="quiz-cta-input"
            />
            <Link href={quizCTALink} className="quiz-cta-button">NEXT</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} SEWO - Get Found Everywhere. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Menu Component */}
      <MobileMenu isOpen={isMenuOpen} onClose={handleMenuToggle} />
    </main>
  )
}

