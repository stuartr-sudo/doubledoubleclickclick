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
  how_it_works_title?: string
  how_it_works_steps?: Array<{ id: string; number: string; title: string; description: string; image?: string; link_text?: string; link_url?: string }>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

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
      <section className="tech-carousel-section">
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

      {/* Quiz CTA Section */}
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

      {/* Latest Blog Posts - 3x2 Grid */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="blog-grid-section">
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
          <p>&copy; {new Date().getFullYear()} DoubleClicker. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Menu Component */}
      <MobileMenu isOpen={isMenuOpen} onClose={handleMenuToggle} />
    </main>
  )
}

