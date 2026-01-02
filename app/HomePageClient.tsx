'use client'

import { useState, memo, lazy, Suspense, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { trackQuizStart, trackScrollDepth, trackCTAClick } from '@/lib/analytics'
import SiteHeader from '@/components/SiteHeader'

// Dynamic imports for code splitting - load below-the-fold components lazily
const SubscribeHero = dynamic(() => import('@/components/SubscribeHero'), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/HowItWorks'), { ssr: true })
const ParticleAnimation = dynamic(() => import('@/components/ParticleAnimation'), { ssr: false })

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
  image?: string
}

interface ProofResultItem {
  id: string
  title: string
  description: string
  image?: string
  cta_text: string
  cta_link: string
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
  quiz_cta_border_color?: string
  quiz_title?: string
  quiz_description?: string
  quiz_cta_text?: string
  quiz_cta_link?: string
  quiz_steps?: string
  quiz_badge_text?: string
  quiz_form_title?: string
  quiz_form_description?: string
  quiz_form_placeholder?: string
  quiz_form_cta_text?: string
  quiz_form_cta_link?: string
  questions_discovery_title?: string
  questions_discovery_description?: string
  questions_discovery_cta_text?: string
  ai_fact_1?: string
  ai_fact_2?: string
  ai_fact_3?: string
  ai_fact_4?: string
  ai_fact_5?: string
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
  blog_grid_title?: string
  blog_grid_bg_color?: string
  blog_section_visible?: boolean
  proof_results_title?: string
  proof_results_subtitle?: string
  proof_results_items?: ProofResultItem[]
  proof_results_bg_color?: string
  quiz_cta_bg_color?: string
  problem_statement_title?: string
  problem_statement_para_1?: string
  problem_statement_para_2?: string
  problem_statement_para_3?: string
  problem_statement_highlight?: string
  problem_statement_para_4?: string
  problem_statement_para_5?: string
  problem_statement_image?: string
  problem_statement_bg_color?: string
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
  solution_kicker?: string
  solution_headline?: string
  solution_subtitle?: string
  solution_body_para_1?: string
  solution_body_para_2?: string
  solution_body_para_3?: string
  solution_body_para_4?: string
  solution_body_para_5?: string
  solution_cta_text?: string
  solution_cta_link?: string
  solution_note?: string
  solution_pillars_heading?: string
  solution_pillars?: Array<{ id: string; title: string; description: string }>
  solution_testimonial_quote?: string
  solution_testimonial_author_name?: string
  solution_testimonial_author_company?: string
  solution_testimonial_author_image?: string
  solution_bg_color?: string
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

function HomePageClient({ latestPosts, homepageContent }: HomePageClientProps) {
  // Default content if not set in CMS
  const logoImage = homepageContent?.logo_image || ''
  const logoText = homepageContent?.logo_text || 'SEWO'
  const heroTitle = homepageContent?.hero_title || 'Make Your Brand the Answer Ai Recommends'
  const heroDescription = homepageContent?.hero_description || 'Hello, I&apos;m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let&apos;s create!'
  const heroCTAText = homepageContent?.hero_cta_text || 'Get Started'
  const heroCTALink = homepageContent?.hero_cta_link || '#contact'
  const heroFooterCTAText = homepageContent?.hero_footer_cta_text || 'Get Started'
  const heroFooterCTALink = homepageContent?.hero_footer_cta_link || 'mailto:hello@sewo.io'
  const heroImage = homepageContent?.hero_image || ''
  const heroBgGradient = homepageContent?.hero_bg_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  const heroTextColor = homepageContent?.hero_text_color || '#ffffff'
  const heroCTABgColor = homepageContent?.hero_cta_bg_color || '#000000'
  const heroCTATextColor = homepageContent?.hero_cta_text_color || '#ffffff'
  const quizCTABorderColor = homepageContent?.quiz_cta_border_color || '#000000'
  const quizTitle = homepageContent?.quiz_title || 'Take the 12-Step Quiz'
  const quizDescription = homepageContent?.quiz_description || 'See where you&apos;re missing out on LLM visibility. Get personalized insights in minutes.'
  const quizCTAText = homepageContent?.quiz_cta_text || 'Start Quiz'
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
  const aboutTitle = homepageContent?.about_title || 'about.'
  const aboutDescription = homepageContent?.about_description || 'When customers ask AI assistants about your industry, your brand needs to be the answer they get. LLM ranking isn&apos;t just the future of search—it&apos;s happening now. We help brand owners ensure their websites rank in AI responses, driving visibility, traffic, and competitive advantage.'
  const aboutImage = homepageContent?.about_image || ''
  const contactCTAText = homepageContent?.contact_cta_text || 'Get Started'
  const contactCTALink = homepageContent?.contact_cta_link || 'mailto:hello@sewo.io'
  const linkedinUrl = homepageContent?.contact_linkedin_url || '#'
  const twitterUrl = homepageContent?.contact_twitter_url || '#'
  const behanceUrl = homepageContent?.contact_behance_url || '#'
  const whyWorkWithUsTitle = homepageContent?.why_work_with_us_title || 'Why Work With Us'
  const whyWorkWithUsSubtitle = homepageContent?.why_work_with_us_subtitle || 'We strive to deliver value to our clients'
  const whyWorkWithUsDescription = homepageContent?.why_work_with_us_description || 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.'
  const whyWorkWithUsItems = (homepageContent?.why_work_with_us_items || [
    { id: '1', title: 'Proven track record', description: 'We have helped countless businesses overcome challenges.', image: '' },
    { id: '2', title: 'Collaborative approach', description: 'We ensure transparency throughout the process.', image: '' },
    { id: '3', title: 'Innovative solutions', description: 'We leverage the latest technologies to deliver solutions.', image: '' }
  ]).map((item: any) => ({
    ...item,
    image: item.image || item.icon || ''
  }))
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
  const blogGridTitle = homepageContent?.blog_grid_title || 'Latest from the blog'
  const blogSectionVisible = homepageContent?.blog_section_visible ?? true
  const proofResultsTitle = homepageContent?.proof_results_title || 'Proof of Results'
  const proofResultsSubtitle = homepageContent?.proof_results_subtitle || 'Real outcomes from our LLM optimization work'
  const proofResultsItems = homepageContent?.proof_results_items || [
    { id: '1', title: 'Case Study 1', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' },
    { id: '2', title: 'Case Study 2', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' },
    { id: '3', title: 'ChatGPT 5.2', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' }
  ]
  const proofResultsBgColor = homepageContent?.proof_results_bg_color || '#ffffff'
  const quizCtaBgColor = homepageContent?.quiz_cta_bg_color || '#ffffff'
  
  // Problem Statement Section
  const problemStatementTitle = homepageContent?.problem_statement_title || 'Publishing Content Isn\'t The Problem.\nBeing Recognised By AI Is.'
  const problemStatementPara1 = homepageContent?.problem_statement_para_1 || 'Businesses are waking up to the fact that customers aren\'t just searching anymore — they\'re having conversations with AI.'
  const problemStatementPara2 = homepageContent?.problem_statement_para_2 || 'The shift has happened faster than anyone expected, but the guidance hasn\'t caught up.'
  const problemStatementPara3 = homepageContent?.problem_statement_para_3 || 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.'
  const problemStatementHighlight = homepageContent?.problem_statement_highlight || 'We exist to solve this.'
  const problemStatementPara4 = homepageContent?.problem_statement_para_4 || 'Because when customers ask AI for answers, your brand either shows up — or it doesn\'t.'
  const problemStatementPara5 = homepageContent?.problem_statement_para_5 || 'And that visibility gap is the exact problem we\'re built to fix.'
  const problemStatementImage = homepageContent?.problem_statement_image || ''
  const problemStatementBgColor = homepageContent?.problem_statement_bg_color || '#f8f9fa'

  // AI Visibility System (Solution) Section
  const solutionKicker = homepageContent?.solution_kicker || 'Introducing'
  const solutionHeadline = homepageContent?.solution_headline || 'AI Visibility System'
  const solutionSubtitle = homepageContent?.solution_subtitle || 'Our authority framework for AI search and summaries'
  const solutionBodyPara1 = homepageContent?.solution_body_para_1 || 'Most brands are guessing how to get recommended by AI.'
  const solutionBodyPara2 = homepageContent?.solution_body_para_2 || 'They\'re chasing prompts, publishing more content, and hoping something sticks — while the market fills with quick fixes, hacks, and tactics that don\'t translate into lasting visibility.'
  const solutionBodyPara3 = homepageContent?.solution_body_para_3 || 'We built the AI Visibility System to remove that guesswork.'
  const solutionBodyPara4 = homepageContent?.solution_body_para_4 || 'It\'s a structured approach to how AI systems interpret, trust, and reuse your brand\'s information — not just what you publish, but how your brand presents itself as a whole.'
  const solutionBodyPara5 = homepageContent?.solution_body_para_5 || 'This isn\'t a one-off optimisation. It\'s designed to compound — building durable authority that strengthens over time.'
  const solutionCTAText = homepageContent?.solution_cta_text || 'Apply to Work With Us'
  const solutionCTALink = homepageContent?.solution_cta_link || '/guide'
  const solutionNote = homepageContent?.solution_note || 'Limited capacity. We take on a small number of brands at a time.'
  const solutionPillarsHeading = homepageContent?.solution_pillars_heading || 'Why this works differently'
  const solutionPillars = homepageContent?.solution_pillars || [
    {
      id: '1',
      title: 'Built for AI discovery, not traditional SEO',
      description: 'Traditional search optimisation and paid media focus on direct inputs. AI recommendations don\'t. We specialise specifically in AI summaries and AI recommendations — how language models decide which brands to surface, cite, and suggest when users ask questions.'
    },
    {
      id: '2',
      title: 'Authority over volume',
      description: 'More content isn\'t the answer. AI systems favour brands that demonstrate consistency, credibility, and clarity across multiple touchpoints — not those publishing the most pages. Our focus is on making your brand the trusted source AI systems return to, not another voice in the noise.'
    },
    {
      id: '3',
      title: 'Designed to compound',
      description: 'AI visibility isn\'t something you switch on. It\'s something you build. Each piece of work reinforces the next — content, site structure, brand signals, and proof working together to deepen trust and increase confidence over time. That\'s why results don\'t reset every few months. They accumulate.'
    },
    {
      id: '4',
      title: 'Proven approach, low guesswork',
      description: 'This work isn\'t experimental. Our process is refined, repeatable, and grounded in how AI systems actually behave — not theory, not trends, and not short-lived tactics. We don\'t attempt to game the system. We focus on building the conditions AI relies on to recommend brands with confidence.'
    }
  ]
  const solutionTestimonialQuote = homepageContent?.solution_testimonial_quote || 'I really think is the future if you\'re serious about ranking in Ai search.'
  const solutionTestimonialAuthorName = homepageContent?.solution_testimonial_author_name || 'James Neilson-Watt'
  const solutionTestimonialAuthorCompany = homepageContent?.solution_testimonial_author_company || 'learnspark.io'
  const solutionTestimonialAuthorImage = homepageContent?.solution_testimonial_author_image || 'https://framerusercontent.com/images/0WlUXwlUVlsMtOtPEH9RIoG0CFQ.jpeg?width=400&height=400'
  const solutionBgColor = homepageContent?.solution_bg_color || '#fafafa'

  // Product & Consulting Offerings
  const pricingTitle = homepageContent?.pricing_title || 'AI Strategies'
  const pricingTiers = (homepageContent?.pricing && homepageContent.pricing.length > 0) ? homepageContent.pricing : [
    {
      id: 'guide',
      name: 'The Playbook',
      price: '$97',
      period: 'once',
      description: 'The complete blueprint for LLM ranking. Everything you need to self-implement.',
      features: [
        'AI Visibility Roadmap',
        'Custom Prompt Library',
        '30-Day Implementation Plan',
        'Lifetime Updates'
      ],
      cta_text: 'Buy Playbook',
      cta_link: '/guide',
      featured: false
    },
    {
      id: 'course',
      name: 'Content Accelerator',
      price: '$249',
      period: 'once',
      description: 'A deep-dive mini-course for teams building high-scale AI content systems.',
      features: [
        'Advanced System Architecture',
        'High-Scale Workflows',
        'Evaluation Frameworks',
        'Team Training Templates'
      ],
      cta_text: 'Enroll Now',
      cta_link: '/course',
      featured: true
    },
    {
      id: 'strategy',
      name: 'Strategy Session',
      price: '$450',
      period: 'once',
      description: 'A focused, 1-on-1 session to build your category-specific ranking roadmap.',
      features: [
        'Personalized Audit',
        'Question Discovery',
        '60-Minute Deep Dive',
        'Custom Ranking Plan'
      ],
      cta_text: 'Book Session',
      cta_link: '/book-call',
      featured: false
    },
    {
      id: 'fractional',
      name: 'Fractional AI Growth Lead',
      price: 'Custom',
      period: 'monthly',
      description: 'A dedicated partner to own and scale your AI-powered search visibility program. Limited to 3 clients.',
      features: [
        'Custom Strategy & Roadmap',
        'Content Architecture Audit',
        'Team Training & Systems',
        'Ongoing Optimization',
        'Performance Monitoring',
        'Unlimited Async Support'
      ],
      cta_text: 'Learn More',
      cta_link: '/consulting',
      featured: false
    }
  ]

  const outcomesTitle = homepageContent?.outcomes_title || 'Work With Me'
  const outcomesSubtitle = homepageContent?.outcomes_subtitle || 'Fractional AI Growth Lead'
  const outcomesList = (homepageContent?.outcomes && homepageContent.outcomes.length > 0) ? homepageContent.outcomes : [
    {
      id: 'fractional',
      title: 'Fractional AI Growth Lead',
      description: 'I work with select brands as a dedicated partner to own and scale their AI-powered search visibility program. Limited to 3 clients.'
    }
  ]

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showMidQuiz, setShowMidQuiz] = useState(false)
  const [showBottomQuiz, setShowBottomQuiz] = useState(false)
  const [isQuizLoaded, setIsQuizLoaded] = useState(false)
  const quizContainerRef = useRef<HTMLDivElement>(null)
  const heroQuizRef = useRef<HTMLDivElement>(null)
  const midQuizRef = useRef<HTMLDivElement>(null)
  const bottomQuizRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // A/B Test: 50% Quiz vs 50% Questions Discovery
  const [heroVariant, setHeroVariant] = useState<'quiz' | 'questions'>('quiz')
  const [isClient, setIsClient] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  // Helper to ensure ScoreApp iframe exists even if their embed script fails
  const ensureScoreAppIframe = useCallback((root: HTMLDivElement | null) => {
    if (!root) return

    // If an iframe already exists, nothing to do
    const existingIframe = root.querySelector('iframe')
    if (existingIframe) return

    // Find the ScoreApp placeholder with data-sa-url
    const placeholder = root.querySelector('[data-sa-url]') as HTMLElement | null
    const url = placeholder?.getAttribute('data-sa-url')
    if (!placeholder || !url) return

    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.style.width = '100%'
    iframe.style.border = '0'
    iframe.style.background = 'transparent'
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute('allowTransparency', 'true')

    placeholder.appendChild(iframe)
  }, [])

  useEffect(() => {
    // Set isClient to true to indicate we're on the client
    setIsClient(true)
    
    // Check localStorage for variant
    const storedVariant = localStorage.getItem('hero_ab_test_variant')
    if (storedVariant === 'quiz' || storedVariant === 'questions') {
      setHeroVariant(storedVariant)
    } else {
      // Assign random variant (50/50 split)
      const variant = Math.random() < 0.5 ? 'quiz' : 'questions'
      setHeroVariant(variant)
      localStorage.setItem('hero_ab_test_variant', variant)
    }
  }, [])

  useEffect(() => {
    // Track A/B test assignment only once
    if (isClient) {
      const tracked = sessionStorage.getItem('ab_test_tracked')
      if (!tracked && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ab_test_assigned', {
          variant: heroVariant,
          test_name: 'hero_quiz_vs_questions',
        })
        sessionStorage.setItem('ab_test_tracked', 'true')
      }
    }
  }, [heroVariant, isClient])

  useEffect(() => {
    const container = quizContainerRef.current
    if (!container) return

    // Function to setup iframe listener
    const setupIframeListener = (iframe: HTMLIFrameElement) => {
      if (isQuizLoaded) return
      
      const handleLoad = () => {
        setIsQuizLoaded(true)
      }

      iframe.addEventListener('load', handleLoad)
      
      // Cleanup
      return () => iframe.removeEventListener('load', handleLoad)
    }

    // Check if iframe already exists
    const existingIframe = container.querySelector('iframe')
    if (existingIframe) {
      setupIframeListener(existingIframe)
    }

    // Watch for iframe injection
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const iframe = container.querySelector('iframe')
          if (iframe) {
            setupIframeListener(iframe)
          }
        }
      }
    })

    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isQuizLoaded])

  // Force hide spinner after a timeout once quiz is shown, just in case
  useEffect(() => {
    if (showQuiz && !isQuizLoaded) {
      const timer = setTimeout(() => setIsQuizLoaded(true), 5000) // 5s fallback
      return () => clearTimeout(timer)
    }
  }, [showQuiz, isQuizLoaded])

  // Fallback: if ScoreApp script doesn't inject the iframe, create it manually
  useEffect(() => {
    if (!showQuiz) return

    const timeout = setTimeout(() => {
      ensureScoreAppIframe(quizContainerRef.current)
    }, 800)

    return () => clearTimeout(timeout)
  }, [showQuiz, ensureScoreAppIframe])

  // Ensure inline (middle) quiz always has iframe when opened
  useEffect(() => {
    if (!showMidQuiz) return

    const timeout = setTimeout(() => {
      ensureScoreAppIframe(midQuizRef.current as HTMLDivElement | null)
    }, 800)

    return () => clearTimeout(timeout)
  }, [showMidQuiz, ensureScoreAppIframe])

  // Ensure bottom quiz always has iframe when opened
  useEffect(() => {
    if (!showBottomQuiz) return

    const timeout = setTimeout(() => {
      ensureScoreAppIframe(bottomQuizRef.current as HTMLDivElement | null)
    }, 800)

    return () => clearTimeout(timeout)
  }, [showBottomQuiz, ensureScoreAppIframe])

  // Auto-center hero quiz when opened (top CTA)
  useEffect(() => {
    if (showQuiz && quizContainerRef.current) {
      setTimeout(() => {
        const el = quizContainerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const absoluteTop = rect.top + window.scrollY
        const targetScroll = absoluteTop + rect.height / 2 - window.innerHeight / 2
        window.scrollTo({
          top: Math.max(targetScroll, 0),
          behavior: 'smooth',
        })
      }, 150)
    }
  }, [showQuiz])

  // Smoothly scroll inline (middle) quiz into true center when it opens
  useEffect(() => {
    if (showMidQuiz && midQuizRef.current) {
      setTimeout(() => {
        const el = midQuizRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const absoluteTop = rect.top + window.scrollY
        const targetScroll = absoluteTop + rect.height / 2 - window.innerHeight / 2
        window.scrollTo({
          top: Math.max(targetScroll, 0),
          behavior: 'smooth',
        })
      }, 150)
    }
  }, [showMidQuiz])

  useEffect(() => {
    if (showBottomQuiz && bottomQuizRef.current) {
      // Add a small delay to ensure the quiz container is visible before scrolling
      setTimeout(() => {
        bottomQuizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [showBottomQuiz])

  // Track scroll depth for homepage engagement
  useEffect(() => {
    const scrollDepths = { 25: false, 50: false, 75: false, 100: false }
    
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100

      if (scrollPercent >= 25 && !scrollDepths[25]) {
        scrollDepths[25] = true
        trackScrollDepth(25, '/')
      }
      if (scrollPercent >= 50 && !scrollDepths[50]) {
        scrollDepths[50] = true
        trackScrollDepth(50, '/')
      }
      if (scrollPercent >= 75 && !scrollDepths[75]) {
        scrollDepths[75] = true
        trackScrollDepth(75, '/')
      }
      if (scrollPercent >= 100 && !scrollDepths[100]) {
        scrollDepths[100] = true
        trackScrollDepth(100, '/')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const openHeroQuiz = () => {
    setShowParticles(true)
    setShowQuiz(true)
    trackQuizStart('hero')
  }

  const openMidQuiz = () => {
    setShowParticles(true)
    setShowMidQuiz(true)
    trackQuizStart('mid')
  }

  const openBottomQuiz = () => {
    setShowParticles(true)
    setShowBottomQuiz(true)
    trackQuizStart('bottom')
  }

  const faqItems = homepageContent?.faq_items || [
    {
      id: '1',
      question: 'How does your consulting process work?',
      answer: 'Our consulting process begins with a comprehensive analysis of your current LLM visibility. We assess how AI systems understand and rank your brand, then create a customized strategy to improve your positioning. Throughout the process, we provide ongoing guidance and optimization to ensure long-term success.'
    },
    {
      id: '2',
      question: 'What industries do you specialize in?',
      answer: 'We work with brands across various industries, from technology and SaaS to e-commerce, healthcare, finance, and professional services. Our approach is tailored to each industry\'s unique challenges and opportunities in AI-powered search.'
    },
    {
      id: '3',
      question: 'How long does it take to see results?',
      answer: 'Results can vary depending on your current visibility and the scope of optimization needed. Typically, you\'ll start seeing improvements in LLM rankings within 4-8 weeks, with more significant gains appearing over 3-6 months as AI systems index and understand your optimized content.'
    },
    {
      id: '4',
      question: 'Do you offer one-time consultations?',
      answer: 'Yes, we offer both one-time consultations and ongoing partnerships. A one-time consultation provides you with a strategic roadmap and actionable recommendations, while ongoing partnerships include continuous optimization, monitoring, and support.'
    },
    {
      id: '5',
      question: 'Can small businesses afford your services?',
      answer: 'Absolutely. We offer flexible pricing options designed to accommodate businesses of all sizes. Our services are structured to provide value at every level, from startups to enterprise organizations. Contact us to discuss a solution that fits your budget.'
    },
    {
      id: '6',
      question: 'How do I get started?',
      answer: 'Getting started is simple. Take our 12-step quiz to see where you\'re missing out on LLM visibility, or reach out directly through our contact form. We\'ll schedule a consultation to discuss your goals and create a customized plan for your brand.'
    }
  ]

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.sewo.io'
  
  // JSON-LD structured data for Organization
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SEWO',
    url: baseUrl,
    logo: logoImage || `${baseUrl}/logo.png`,
    description: 'Expert LLM ranking optimization to boost your visibility in AI-powered search',
    sameAs: [
      // Add social media URLs here if available
    ],
  }

  return (
    <>
      {/* Site Header with shadow */}
      <SiteHeader blogVisible={blogSectionVisible} />
      
    <main>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      
        {/* Hero Section - Full Width */}
        <section 
          className="hero-stripe"
              style={{
                background: heroBgGradient,
                color: heroTextColor
              }}
            >
          {/* Main Content */}
          <div className="hero-stripe-content">
            {/* Full Width Hero Content */}
            <div className="hero-stripe-full">
              <div className="container">
                <div className="hero-stripe-inner">
                <h1 className="hero-stripe-title">
                  {heroTitle.split('\n').map((line, i) => (
                    <span key={i} className="title-line">{line}</span>
                  ))}
                </h1>
                <p className="hero-stripe-description">
                  {heroDescription}
                </p>
                  <div className="hero-cta-wrapper">
                    <Link 
                      href="#apply-form" 
                      className="hero-cta-button"
                    style={{
                      backgroundColor: heroCTABgColor,
                      color: heroCTATextColor,
                      }}
                    >
                      Apply to Work With Us
                    </Link>
                    <p className="hero-cta-subtext">
                      For established brands serious about AI-driven discovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Not Traditional SEO Section */}
      <section className="not-seo-section">
        <div className="container">
          <div className="not-seo-grid">
            <div className="not-seo-image">
              <div className="not-seo-image-placeholder">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                </div>
            </div>
            <div className="not-seo-content">
              <h1 className="not-seo-title">This Is Not Traditional SEO Or Paid Media</h1>
              <div className="not-seo-body">
                <p>Most marketing services are built around direct inputs.</p>
                <p className="not-seo-list">
                  Paid ads buy attention.<br />
                  Traditional SEO optimises pages for rankings.<br />
                  Both can work — but neither explains why AI recommends one brand and ignores another.
                </p>
                <p className="not-seo-emphasis">AI systems don&apos;t respond to single tactics in isolation.</p>
                <p>They evaluate patterns of trust across content, structure, brand presence, and evidence.</p>
                <p>That&apos;s why this work sits in a different category.</p>
                <p>We specialise specifically in AI summaries and AI recommendations — how AI systems decide which brands to surface, cite, and suggest when users ask questions.</p>
                <p>And that decision is influenced by far more than content alone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="problem-statement-section" style={{ background: problemStatementBgColor }}>
        <div className="container">
          <h1 className="problem-statement-title">
            {problemStatementTitle.split('\n').map((line, i) => (
              <span key={i}>{line}{i < problemStatementTitle.split('\n').length - 1 && <br />}</span>
            ))}
          </h1>
          <div className="problem-statement-grid">
            <div className="problem-statement-text">
              {problemStatementPara1 && <p>{problemStatementPara1}</p>}
              {problemStatementPara2 && <p>{problemStatementPara2}</p>}
              {problemStatementPara3 && <p>{problemStatementPara3}</p>}
                    </div>
            <div className="problem-statement-image">
              {problemStatementImage ? (
                <Image 
                  src={problemStatementImage} 
                  alt="Problem Statement" 
                  width={600}
                  height={450}
                  style={{ objectFit: 'cover', width: '100%', height: 'auto', borderRadius: '12px' }}
                />
              ) : (
                <div className="problem-statement-image-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Connected Signals Section */}
      <section className="connected-signals-section">
        <div className="container">
          <div className="connected-signals-grid">
            <div className="connected-signals-image">
              <div className="connected-signals-image-placeholder">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
            <div className="connected-signals-text">
              <h2 className="connected-signals-title">AI Recommendations Are Shaped By Connected Signals</h2>
              
              <p className="connected-signals-intro">
                Content is the foundation — but it&apos;s not the whole system.
              </p>

              <div className="connected-signals-body">
                {problemStatementHighlight && (
                  <p className="connected-signals-highlight">{problemStatementHighlight}</p>
                )}
                {problemStatementPara4 && <p>{problemStatementPara4}</p>}
                {problemStatementPara5 && <p>{problemStatementPara5}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Consistency Signals Section */}
      <section className="ai-consistency-signals-section">
        <div className="container">
          <div className="ai-consistency-signals-grid">
            <div className="ai-consistency-signals-column">
              <p className="ai-consistency-signals-heading"><strong>AI systems look for consistency across:</strong></p>
              <ul className="ai-consistency-signals-list">
                <li>how your site is structured and understood</li>
                <li>whether your expertise is supported by evidence</li>
                <li>whether your brand appears active and credible beyond your website</li>
                <li>whether claims are reinforced by real-world validation</li>
              </ul>
            </div>
            <div className="ai-consistency-signals-column">
              <p className="ai-consistency-signals-heading"><strong>That includes elements like:</strong></p>
              <ul className="ai-consistency-signals-list">
                <li>site architecture and technical clarity</li>
                <li>case studies and testimonials</li>
                <li>visible activity across relevant social platforms</li>
                <li>consistency between what you publish and how your brand shows up elsewhere</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Signals Conclusion Section */}
      <section className="signals-conclusion-section">
        <div className="container">
          <div className="signals-conclusion-content">
            <h1 className="signals-conclusion-title">These Signals Don&apos;t Operate Independently.<br />They Reinforce Each Other.</h1>
            <p className="signals-conclusion-text">This is why shortcuts, hacks, and isolated optimisations rarely lead to lasting AI visibility.</p>
            <div className="signals-conclusion-cta">
              <Link 
                href="#apply-form" 
                className="signals-conclusion-button"
                  style={{ 
                  backgroundColor: heroCTABgColor,
                  color: heroCTATextColor,
                }}
              >
                Apply to Work With Us
              </Link>
                    </div>
          </div>
        </div>
      </section>

      {/* AI Visibility System Section */}
      <section className="solution-section" style={{ background: solutionBgColor }}>
        <div className="solution-container">
          <div className="solution-grid">
            {/* Left Column - Narrative */}
            <div className="solution-narrative">
              <span className="solution-kicker">{solutionKicker}</span>
              <h2 className="solution-headline">{solutionHeadline}</h2>
              <p className="solution-subtitle">{solutionSubtitle}</p>
              <div className="solution-body">
                {solutionBodyPara1 && <p>{solutionBodyPara1}</p>}
                {solutionBodyPara2 && <p>{solutionBodyPara2}</p>}
                {solutionBodyPara3 && <p className="solution-emphasis">{solutionBodyPara3}</p>}
                {solutionBodyPara4 && <p>{solutionBodyPara4}</p>}
                {solutionBodyPara5 && <p>{solutionBodyPara5.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < solutionBodyPara5.split('\n').length - 1 && <br />}</span>
                ))}</p>}
              </div>
              <div className="solution-cta">
                <Link 
                  href="#apply-form" 
                  className="solution-button"
                      style={{
                    backgroundColor: heroCTABgColor,
                    color: heroCTATextColor,
                  }}
                >
                  {solutionCTAText}
                </Link>
                {solutionNote && <p className="solution-note">{solutionNote}</p>}
                    </div>
              
              {solutionTestimonialQuote && (
                <div className="solution-testimonial">
                  <div className="solution-testimonial-content">
                    <p className="solution-testimonial-quote">
                      &quot;{solutionTestimonialQuote}&quot;
                    </p>
                    <div className="solution-testimonial-author">
                      {solutionTestimonialAuthorImage && (
                        <div className="solution-testimonial-image">
                          <Image
                            src={solutionTestimonialAuthorImage}
                            alt={solutionTestimonialAuthorName}
                            width={56}
                            height={56}
                        loading="lazy"
                            style={{ objectFit: 'cover', borderRadius: '50%', width: '56px', height: '56px' }}
                      />
                        </div>
                    )}
                      <div className="solution-testimonial-author-info">
                        <p className="solution-testimonial-author-name">{solutionTestimonialAuthorName}</p>
                        <p className="solution-testimonial-author-company">{solutionTestimonialAuthorCompany}</p>
                  </div>
                </div>
              </div>
            </div>
              )}
          </div>

            {/* Right Column - Pillars */}
            <div className="solution-pillars">
              {solutionPillarsHeading && <h3 className="pillars-heading">{solutionPillarsHeading}</h3>}
              
              {solutionPillars.map((pillar, index) => {
                // Icon mapping based on index
                const icons = [
                  // Icon 1: Search/AI
                  <svg key="icon1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                  </svg>,
                  // Icon 2: Authority/Shield
                  <svg key="icon2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>,
                  // Icon 3: Growth/Compound
                  <svg key="icon3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>,
                  // Icon 4: Proven/Target
                  <svg key="icon4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                ]
                
                return (
                  <div key={pillar.id} className="solution-pillar">
                    <div className="pillar-icon">
                      {icons[index % icons.length]}
        </div>
                    <div className="pillar-content">
                      <h4 className="pillar-title">{pillar.title}</h4>
                      {pillar.description.split('\n').map((para, i) => (
                        <p key={i} className="pillar-description">{para}</p>
                      ))}
                    </div>
                </div>
                )
              })}
              </div>
          </div>
        </div>
      </section>

      {/* Proof of Results Section */}
      <section className="proof-results-section" style={{ background: proofResultsBgColor }}>
        <div className="proof-results-container">
          <div className="proof-results-header">
            <h2 className="proof-results-title">{proofResultsTitle}</h2>
            <p className="proof-results-subtitle">{proofResultsSubtitle}</p>
          </div>

          {/* Case Study Text Block */}
          <div className="proof-results-case-study">
            <h3 className="proof-results-case-study-title">Case study: AI visibility in a highly competitive market</h3>
            <div className="proof-results-case-study-content">
              <p>
                In a highly competitive U.S. skincare market, we applied our AI Visibility System to restructure how content, site signals, and brand authority were presented to AI systems.
              </p>
              <p>
                Rather than relying on shortcuts or volume, the work focused on clarity, trust signals, and consistency across content, structure, and supporting brand signals.
              </p>
              <p>
                Within the first 30 days, the brand achieved top placement in AI-generated results, maintained that visibility, and saw a <strong>450% increase in organic traffic</strong> — driven by sustained inclusion in AI summaries and recommendations.
              </p>
              <p>
                This outcome wasn&apos;t the result of a single tactic, but a connected system designed to compound over time.
              </p>
            </div>
          </div>

          <div className="proof-results-grid">
            {proofResultsItems.map((item) => (
              <article key={item.id} className="proof-result-card">
                <div className="proof-result-image">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      width={400}
                      height={225}
                      loading="lazy"
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="proof-result-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 15l4-4a2 2 0 012.828 0L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 13l2-2a2 2 0 012.828 0L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="proof-result-content">
                  <h3 className="proof-result-card-title">{item.title}</h3>
                  <p className="proof-result-description">{item.description}</p>
                  <Link href={item.cta_link} className="proof-result-cta">
                    {item.cta_text}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks
        title={howItWorksTitle}
        steps={howItWorksSteps}
        bgColor={howItWorksBgColor}
      />

      {/* FAQ CTA - Above FAQ Section */}
      <div className="faq-cta-wrapper">
        <div className="faq-cta">
          <Link 
            href="#apply-form" 
            className="faq-cta-button"
            style={{
              backgroundColor: heroCTABgColor,
              color: heroCTATextColor,
            }}
          >
            Apply to Work With Us
          </Link>
        </div>
      </div>

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

      {/* Apply to Work With Us Form */}
      <section id="apply-form" className="apply-form-section">
        <div className="container">
          <div className="apply-form-wrapper">
            <div className="apply-form-header">
              <h2>Apply to Work With Us</h2>
              <p className="apply-form-intro">
                Tell us about your brand and how we can help you get recommended by AI.
              </p>
            </div>

            <ApplyForm 
              buttonBgColor={heroCTABgColor}
              buttonTextColor={heroCTATextColor}
            />
          </div>
        </div>
      </section>

      {/* Latest Blog Posts - 3x2 Grid */}
      {blogSectionVisible && latestPosts && latestPosts.length > 0 && (
        <section className="blog-grid-section" style={{ background: blogGridBgColor }}>
          <div className="blog-grid-container">
            <div className="blog-grid-header">
              <h2 className="blog-grid-title">{blogGridTitle}</h2>
            </div>
            <div className="blog-grid-3x2">
              {latestPosts.slice(0, 6).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="blog-card">
                  <article>
                    {post.featured_image && (
                      <div className="blog-card-image">
                        <Image 
                          src={post.featured_image} 
                          alt={post.title}
                          loading="lazy"
                          width={400}
                          height={250}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </div>
                    )}
                    <div className="blog-card-content">
                      <h3 className="blog-card-title">
                        {post.title}
                      </h3>
                      {post.meta_description && (
                        <p className="blog-card-excerpt">{post.meta_description}</p>
                      )}
                      <div className="blog-card-meta">
                        <time dateTime={post.created_date}>
                          {new Date(post.created_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Particle Animation */}
      <ParticleAnimation 
        isActive={showParticles} 
        onComplete={() => setShowParticles(false)} 
      />
    </main>
    </>
  )
}

// Apply Form Component - Optimized for AI bots
interface ApplyFormProps {
  buttonBgColor: string
  buttonTextColor: string
}

function ApplyForm({ buttonBgColor, buttonTextColor }: ApplyFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email_address: '',
    website_url: '',
    company_description: '',
    current_challenges: '',
    goals: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.contact_name,
          email: formData.email_address,
          phone: '',
          source: 'apply_to_work_with_us',
          website: formData.website_url,
          company_name: formData.company_name,
          message: `Company: ${formData.company_name}\nWebsite: ${formData.website_url}\n\nCompany Description:\n${formData.company_description}\n\nCurrent Challenges:\n${formData.current_challenges}\n\nGoals:\n${formData.goals}`
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          company_name: '',
          contact_name: '',
          email_address: '',
          website_url: '',
          company_description: '',
          current_challenges: '',
          goals: ''
        })
        // Scroll to top of form to show success message
        document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="apply-form" aria-label="Apply to Work With Us Form">
      {submitStatus === 'success' && (
        <div className="form-message form-message-success" role="alert">
          <p>Thank you! We&apos;ve received your application and will be in touch soon.</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="form-message form-message-error" role="alert">
          <p>There was an error submitting your application. Please try again or contact us directly.</p>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="company_name">Company Name</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
            placeholder="Enter your company name"
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_name">Your Name</label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            aria-required="true"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email_address">Email Address</label>
          <input
            type="email"
            id="email_address"
            name="email_address"
            value={formData.email_address}
            onChange={handleChange}
            required
            placeholder="your.email@company.com"
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="website_url">Website URL</label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            required
            placeholder="https://www.yourcompany.com"
            aria-required="true"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="company_description">Tell us about your company</label>
        <textarea
          id="company_description"
          name="company_description"
          value={formData.company_description}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe what your company does, your industry, and your target audience."
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="current_challenges">What challenges are you facing with AI visibility?</label>
        <textarea
          id="current_challenges"
          name="current_challenges"
          value={formData.current_challenges}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe your current challenges with AI search, recommendations, or visibility."
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="goals">What are your goals?</label>
        <textarea
          id="goals"
          name="goals"
          value={formData.goals}
          onChange={handleChange}
          required
          rows={4}
          placeholder="What do you hope to achieve by working with us?"
          aria-required="true"
        />
      </div>

      <div className="form-submit">
        <button
          type="submit"
          className="apply-form-submit-button"
          disabled={isSubmitting}
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(HomePageClient)

