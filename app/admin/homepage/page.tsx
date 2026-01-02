'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import TextEnhancer from '@/components/TextEnhancer'
import { AdminAuthCheck } from '@/components/AdminAuthCheck'

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

interface ProofResultItem {
  id: string
  title: string
  description: string
  image?: string
  cta_text: string
  cta_link: string
}

interface SolutionPillarItem {
  id: string
  title: string
  description: string
}

interface HomepageContent {
  logo_image: string
  logo_text: string
  hero_title: string
  hero_description: string
  hero_image: string
  hero_cta_text: string
  hero_cta_link: string
  hero_footer_cta_text: string
  hero_footer_cta_link: string
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
  problem_statement_title?: string
  problem_statement_para_1?: string
  problem_statement_para_2?: string
  problem_statement_para_3?: string
  problem_statement_highlight?: string
  problem_statement_para_4?: string
  problem_statement_para_5?: string
  problem_statement_image?: string
  problem_statement_bg_color?: string
  quiz_cta_bg_color?: string
  quiz_landing_title?: string
  quiz_landing_description?: string
  find_questions_title?: string
  find_questions_description?: string
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
  solution_pillars?: SolutionPillarItem[]
  solution_testimonial_quote?: string
  solution_testimonial_author_name?: string
  solution_testimonial_author_company?: string
  solution_testimonial_author_image?: string
  solution_bg_color?: string
}

function HomepageEditorPageInner() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTechTab, setActiveTechTab] = useState(0)
  // Gradient color picker state
  const [gradientStartColor, setGradientStartColor] = useState('#667eea')
  const [gradientEndColor, setGradientEndColor] = useState('#764ba2')
  const [gradientDirection, setGradientDirection] = useState('135deg')
  // Global AI provider/model used as defaults across fields
  const AI_PROVIDERS = {
    openai: {
      name: 'ChatGPT (OpenAI)',
      models: [
        { id: 'gpt-5-2025-08-07', name: 'GPT-5 (Latest)' },
        { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini (Latest)' },
        { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)' },
        { id: 'gpt-4o', name: 'GPT-4o (Best Quality)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Recommended)' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fastest)' },
      ],
      default: 'gpt-4o-mini',
    },
    claude: {
      name: 'Claude (Anthropic)',
      models: [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Latest)' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      ],
      default: 'claude-3-5-sonnet-20241022',
    },
    gemini: {
      name: 'Gemini (Google)',
      models: [
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Latest)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Latest)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
        { id: 'gemini-pro', name: 'Gemini Pro' },
      ],
      default: 'gemini-1.5-flash',
    },
  } as const
  const [aiProvider, setAiProvider] = useState<keyof typeof AI_PROVIDERS>('openai')
  const [aiModel, setAiModel] = useState<string>(AI_PROVIDERS.openai.default)
  const [formData, setFormData] = useState<HomepageContent>({
    logo_image: '',
    logo_text: 'SEWO',
    hero_title: 'Make Your Brand the Answer Ai Recommends',
    hero_description: 'Hello, I\'m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let\'s create!',
    hero_image: '',
    hero_cta_text: 'Get Started',
    hero_cta_link: '#contact',
    hero_footer_cta_text: 'Get Started',
    hero_footer_cta_link: 'mailto:hello@sewo.io',
    hero_bg_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    hero_text_color: '#ffffff',
    hero_cta_bg_color: '#000000',
    hero_cta_text_color: '#ffffff',
    quiz_cta_border_color: '#000000',
    quiz_title: 'Take the 12-Step Quiz',
    quiz_description: 'See where you\'re missing out on LLM visibility. Get personalized insights in minutes.',
    quiz_cta_text: 'Start Quiz',
    quiz_cta_link: '/quiz',
    quiz_steps: '12',
    quiz_badge_text: 'Steps',
    quiz_form_title: 'Want More SEO Traffic?',
    quiz_form_description: 'Answer 5 quick questions and I will give you a step-by-step <strong>7-week action plan</strong> showing you exactly what you need to do to get more traffic.',
    quiz_form_placeholder: 'What is the URL of your website?',
    quiz_form_cta_text: 'NEXT',
    quiz_form_cta_link: '/quiz',
    questions_discovery_title: 'See What Questions Your Prospects Are Asking',
    questions_discovery_description: 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.',
    questions_discovery_cta_text: 'Book a Discovery Call',
    ai_fact_1: 'Did you know? Over 85% of consumers use AI-powered search before making purchase decisions.',
    ai_fact_2: 'ChatGPT reaches 100 million users in just 2 months - the fastest growing app in history.',
    ai_fact_3: 'Brands optimized for AI discovery see up to 300% more referral traffic.',
    ai_fact_4: 'By 2025, 50% of all searches will be conducted through AI assistants.',
    ai_fact_5: 'AI citations drive 4x higher conversion rates than traditional search results.',
    tech_carousel_title: 'Technology we work with',
    tech_carousel_items: [
      { id: '1', name: 'ChatGPT', icon: '' },
      { id: '2', name: 'Claude', icon: '' },
      { id: '3', name: 'Gemini', icon: '' },
      { id: '4', name: 'Grok', icon: '' },
      { id: '5', name: 'Perplexity', icon: '' },
      { id: '6', name: 'Supabase', icon: '' },
      { id: '7', name: 'n8n', icon: '' }
    ],
    tech_carousel_bg_color: '#ffffff',
    how_it_works_title: 'How it works',
    how_it_works_steps: [
      { id: '1', number: '01', title: 'Simple Booking', description: 'Effortlessly schedule a consultation to discuss your business needs and challenges. We streamline the process to get started quickly.', image: '', link_text: 'Discover More', link_url: '#' }
    ],
    how_it_works_bg_color: '#ffffff',
    why_work_with_us_title: 'Why Work With Us',
    why_work_with_us_subtitle: 'We strive to deliver value to our clients',
    why_work_with_us_description: 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.',
    why_work_with_us_items: [
      { id: '1', title: 'Proven track record', description: 'We have helped countless businesses overcome challenges.', image: '' },
      { id: '2', title: 'Collaborative approach', description: 'We ensure transparency throughout the process.', image: '' },
      { id: '3', title: 'Innovative solutions', description: 'We leverage the latest technologies to deliver solutions.', image: '' }
    ],
    why_work_with_us_bg_color: '#ffffff',
    faq_items: [
      { id: '1', question: 'How does your consulting process work?', answer: 'Our consulting process begins with a comprehensive analysis of your current LLM visibility. We assess how AI systems understand and rank your brand, then create a customized strategy to improve your positioning.' },
      { id: '2', question: 'What industries do you specialize in?', answer: 'We work with brands across various industries, from technology and SaaS to e-commerce, healthcare, finance, and professional services.' },
      { id: '3', question: 'How long does it take to see results?', answer: 'Results can vary depending on your current visibility and the scope of optimization needed. Typically, you\'ll start seeing improvements in LLM rankings within 4-8 weeks.' },
      { id: '4', question: 'Do you offer one-time consultations?', answer: 'Yes, we offer both one-time consultations and ongoing partnerships. A one-time consultation provides you with a strategic roadmap and actionable recommendations.' },
      { id: '5', question: 'Can small businesses afford your services?', answer: 'Absolutely. We offer flexible pricing options designed to accommodate businesses of all sizes. Our services are structured to provide value at every level.' },
      { id: '6', question: 'How do I get started?', answer: 'Getting started is simple. Take our 12-step quiz to see where you\'re missing out on LLM visibility, or reach out directly through our contact form.' }
    ],
    faq_bg_color: '#ffffff',
    testimonials_label: 'Testimonials',
    testimonials_title: 'Trusted by 10k+ customers',
    testimonials_subtitle: 'Whether you\'re a small startup or a multinational corporation, let us be your trusted advisor on the path to success.',
    testimonials_items: [
      { id: '1', quote: 'The impact of Consulting\'s work on our organization has been transformative. Their dedication to our success have helped us achieve remarkable growth.', rating: 5, author_name: 'Alex Peterson', author_title: 'CEO', author_company: 'Thompson Industries', author_image: '' },
      { id: '2', quote: 'Their team\'s depth of knowledge, strategic thinking, and commitment to excellence have been instrumental in helping us navigate complex challenges.', rating: 4, author_name: 'David Martinez', author_title: 'Director', author_company: 'Johnson Enterprises', author_image: '' },
      { id: '3', quote: 'The team at Consulting exceeded our expectations in every way. We are grateful for their partnership and the positive impact they\'ve had on our business.', rating: 5, author_name: 'John Smith', author_title: 'Founder', author_company: 'JS Solutions', author_image: '' }
    ],
    testimonials_bg_color: '#f5f5f5',
    services_section_title: 'Our services',
    services_section_description: 'Our team combines expertise with creativity to transform outdoor spaces into breathtaking landscapes that enhance the beauty of any property.',
    services_items: [
      { id: '1', title: 'Landscaping works', image: '', link_url: '#' },
      { id: '2', title: 'Garden design', image: '', link_url: '#' },
      { id: '3', title: 'Seasonal planting', image: '', link_url: '#' }
    ],
    services_bg_color: '#ffffff',
    blog_grid_title: 'Popular posts',
    blog_grid_bg_color: '#ffffff',
    blog_section_visible: true,
    proof_results_title: 'Proof of Results',
    proof_results_subtitle: 'Real outcomes from our LLM optimization work',
    proof_results_items: [
      { id: '1', title: 'Case Study 1', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' },
      { id: '2', title: 'Case Study 2', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' },
      { id: '3', title: 'Case Study 3', description: 'Description of results achieved for this client...', image: '', cta_text: 'READ MORE', cta_link: '#' }
    ],
    proof_results_bg_color: '#ffffff',
    quiz_cta_bg_color: '#ffffff',
    problem_statement_title: 'Publishing content isn\'t the problem.\nBeing recognised by AI is.',
    problem_statement_para_1: 'Businesses are waking up to the fact that customers aren\'t just searching anymore — they\'re having conversations with AI.',
    problem_statement_para_2: 'The shift has happened faster than anyone expected, but the guidance hasn\'t caught up.',
    problem_statement_para_3: 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.',
    problem_statement_highlight: 'We exist to solve this.',
    problem_statement_para_4: 'Because when customers ask AI for answers, your brand either shows up — or it doesn\'t.',
    problem_statement_para_5: 'And that visibility gap is the exact problem we\'re built to fix.',
    problem_statement_image: '',
    problem_statement_bg_color: '#f8f9fa',
    solution_kicker: 'Introducing',
    solution_headline: 'AI Visibility System',
    solution_subtitle: 'Our authority framework for AI search and summaries',
    solution_body_para_1: 'Most brands are guessing how to get recommended by AI.',
    solution_body_para_2: 'They\'re chasing prompts, publishing more content, and hoping something sticks — while the market fills with quick fixes, hacks, and tactics that don\'t translate into lasting visibility.',
    solution_body_para_3: 'We built the AI Visibility System to remove that guesswork.',
    solution_body_para_4: 'It\'s a structured approach to how AI systems interpret, trust, and reuse your brand\'s information — not just what you publish, but how your brand presents itself as a whole.',
    solution_body_para_5: 'This isn\'t a one-off optimisation. It\'s designed to compound — building durable authority that strengthens over time.',
    solution_cta_text: 'Apply to Work With Us',
    solution_cta_link: '/guide',
    solution_note: 'Limited capacity. We take on a small number of brands at a time.',
    solution_pillars_heading: 'Why this works differently',
    solution_pillars: [
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
    ],
    solution_testimonial_quote: 'I really think is the future if you\'re serious about ranking in Ai search.',
    solution_testimonial_author_name: 'James Neilson-Watt',
    solution_testimonial_author_company: 'learnspark.io',
    solution_testimonial_author_image: 'https://framerusercontent.com/images/0WlUXwlUVlsMtOtPEH9RIoG0CFQ.jpeg?width=400&height=400',
    solution_bg_color: '#fafafa'
  })

  // Generate gradient string from color picker values
  const generateGradient = (start: string, end: string, direction: string) => {
    return `linear-gradient(${direction}, ${start} 0%, ${end} 100%)`
  }

  // Parse gradient string to extract colors and direction
  const parseGradient = (gradientString: string) => {
    try {
      // Match pattern: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
      const match = gradientString.match(/linear-gradient\((\d+deg),\s*(#[0-9a-fA-F]{6})\s+\d+%,\s*(#[0-9a-fA-F]{6})\s+\d+%\)/i)
      if (match) {
        setGradientDirection(match[1])
        setGradientStartColor(match[2])
        setGradientEndColor(match[3])
      }
    } catch (error) {
      console.error('Error parsing gradient:', error)
    }
  }

  const fetchHomepageContent = useCallback(async () => {
    try {
      const res = await fetch('/api/homepage')
      if (res.ok) {
        const data = await res.json()
        // Merge fetched data with defaults, ensuring all arrays exist
        setFormData(prev => ({
          ...prev,
          ...data,
          tech_carousel_items: Array.isArray(data.tech_carousel_items) ? data.tech_carousel_items : prev.tech_carousel_items,
          how_it_works_steps: Array.isArray(data.how_it_works_steps) ? data.how_it_works_steps : prev.how_it_works_steps,
          why_work_with_us_items: Array.isArray(data.why_work_with_us_items)
            ? data.why_work_with_us_items.map((item: any) => ({
                ...item,
                image: item.image || item.icon || ''
              }))
            : prev.why_work_with_us_items,
          faq_items: Array.isArray(data.faq_items) ? data.faq_items : prev.faq_items,
          proof_results_items: Array.isArray(data.proof_results_items) ? data.proof_results_items : prev.proof_results_items,
          solution_pillars: Array.isArray(data.solution_pillars) ? data.solution_pillars : prev.solution_pillars
        }))
        
        // Parse gradient and set color picker states
        if (data.hero_bg_gradient) {
          parseGradient(data.hero_bg_gradient)
        }
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHomepageContent()
  }, [fetchHomepageContent])

  // Handle gradient color changes
  const handleGradientColorChange = (type: 'start' | 'end', color: string) => {
    if (type === 'start') {
      setGradientStartColor(color)
    } else {
      setGradientEndColor(color)
    }
    const newGradient = generateGradient(
      type === 'start' ? color : gradientStartColor,
      type === 'end' ? color : gradientEndColor,
      gradientDirection
    )
    setFormData(prev => ({ ...prev, hero_bg_gradient: newGradient }))
  }

  // Handle gradient direction change
  const handleGradientDirectionChange = (direction: string) => {
    setGradientDirection(direction)
    const newGradient = generateGradient(gradientStartColor, gradientEndColor, direction)
    setFormData(prev => ({ ...prev, hero_bg_gradient: newGradient }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Why Work With Us handlers
  const handleWhyWorkWithUsChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const newItems = [...(formData.why_work_with_us_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, why_work_with_us_items: newItems }))
  }

  const handleWhyWorkWithUsImageChange = (index: number, url: string) => {
    const newItems = [...(formData.why_work_with_us_items || [])]
    newItems[index] = { ...newItems[index], image: url }
    setFormData(prev => ({ ...prev, why_work_with_us_items: newItems }))
  }

  const addWhyWorkWithUsItem = () => {
    setFormData(prev => ({
      ...prev,
      why_work_with_us_items: [
        ...(prev.why_work_with_us_items || []),
        { id: String(Date.now()), title: '', description: '', image: '' }
      ]
    }))
  }

  const removeWhyWorkWithUsItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      why_work_with_us_items: (prev.why_work_with_us_items || []).filter((_, i) => i !== index)
    }))
  }

  // FAQ handlers
  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...(formData.faq_items || [])]
    newFAQs[index] = { ...newFAQs[index], [field]: value }
    setFormData(prev => ({ ...prev, faq_items: newFAQs }))
  }

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faq_items: [
        ...(prev.faq_items || []),
        { id: String(Date.now()), question: '', answer: '' }
      ]
    }))
  }

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faq_items: (prev.faq_items || []).filter((_, i) => i !== index)
    }))
  }

  // Testimonial handlers
  const handleTestimonialChange = (index: number, field: keyof TestimonialItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      testimonials_items: (prev.testimonials_items || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addTestimonial = () => {
    setFormData(prev => ({
      ...prev,
      testimonials_items: [
        ...(prev.testimonials_items || []),
        { id: String(Date.now()), quote: '', rating: 5, author_name: '', author_title: '', author_company: '', author_image: '' }
      ]
    }))
  }

  const removeTestimonial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testimonials_items: (prev.testimonials_items || []).filter((_, i) => i !== index)
    }))
  }

  const handleTestimonialImageChange = (index: number, url: string) => {
    handleTestimonialChange(index, 'author_image', url)
  }

  // Service handlers
  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      services_items: (prev.services_items || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services_items: [
        ...(prev.services_items || []),
        { id: String(Date.now()), title: '', image: '', link_url: '#' }
      ]
    }))
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services_items: (prev.services_items || []).filter((_, i) => i !== index)
    }))
  }

  const handleServiceImageChange = (index: number, url: string) => {
    handleServiceChange(index, 'image', url)
  }

  // Proof Results handlers
  const handleProofResultChange = (index: number, field: 'title' | 'description' | 'cta_text' | 'cta_link', value: string) => {
    const newItems = [...(formData.proof_results_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, proof_results_items: newItems }))
  }

  const handleProofResultImageChange = (index: number, url: string) => {
    const newItems = [...(formData.proof_results_items || [])]
    newItems[index] = { ...newItems[index], image: url }
    setFormData(prev => ({ ...prev, proof_results_items: newItems }))
  }

  const addProofResult = () => {
    setFormData(prev => ({
      ...prev,
      proof_results_items: [
        ...(prev.proof_results_items || []),
        { id: String(Date.now()), title: '', description: '', image: '', cta_text: 'READ MORE', cta_link: '#' }
      ]
    }))
  }

  const removeProofResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      proof_results_items: (prev.proof_results_items || []).filter((_, i) => i !== index)
    }))
  }

  // Solution Section handlers
  const handleSolutionPillarChange = (index: number, field: 'title' | 'description', value: string) => {
    const newItems = [...(formData.solution_pillars || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, solution_pillars: newItems }))
  }

  const addSolutionPillar = () => {
    setFormData(prev => ({
      ...prev,
      solution_pillars: [
        ...(prev.solution_pillars || []),
        { id: String(Date.now()), title: '', description: '' }
      ]
    }))
  }

  const removeSolutionPillar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      solution_pillars: (prev.solution_pillars || []).filter((_, i) => i !== index)
    }))
  }

  // Tech Carousel handlers
  const handleTechCarouselItemChange = (index: number, field: 'name' | 'icon', value: string) => {
    const newItems = [...(formData.tech_carousel_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, tech_carousel_items: newItems }))
  }

  const addTechCarouselItem = () => {
    setFormData(prev => {
      const newItems = [
        ...(prev.tech_carousel_items || []),
        { id: String(Date.now()), name: '', icon: '' }
      ]
      setActiveTechTab(newItems.length - 1) // Switch to the new tab
      return {
        ...prev,
        tech_carousel_items: newItems
      }
    })
  }

  const removeTechCarouselItem = (index: number) => {
    setFormData(prev => {
      const newItems = (prev.tech_carousel_items || []).filter((_, i) => i !== index)
      // Adjust active tab if needed
      if (activeTechTab >= newItems.length && newItems.length > 0) {
        setActiveTechTab(newItems.length - 1)
      } else if (newItems.length === 0) {
        setActiveTechTab(0)
      }
      return {
        ...prev,
        tech_carousel_items: newItems
      }
    })
  }

  // How It Works handlers
  const handleHowItWorksStepChange = (index: number, field: 'number' | 'title' | 'description' | 'link_text' | 'link_url', value: string) => {
    const newSteps = [...(formData.how_it_works_steps || [])]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData(prev => ({ ...prev, how_it_works_steps: newSteps }))
  }

  const handleHowItWorksStepImageChange = (index: number, url: string) => {
    const newSteps = [...(formData.how_it_works_steps || [])]
    newSteps[index] = { ...newSteps[index], image: url }
    setFormData(prev => ({ ...prev, how_it_works_steps: newSteps }))
  }

  const addHowItWorksStep = () => {
    const currentSteps = formData.how_it_works_steps || []
    const nextNumber = String(currentSteps.length + 1).padStart(2, '0')
    setFormData(prev => ({
      ...prev,
      how_it_works_steps: [
        ...currentSteps,
        { id: String(Date.now()), number: nextNumber, title: '', description: '', image: '', link_text: 'Discover More', link_url: '#' }
      ]
    }))
  }

  const removeHowItWorksStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      how_it_works_steps: (prev.how_it_works_steps || []).filter((_, i) => i !== index)
    }))
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Log what we're sending (for debugging)
      console.log('Submitting formData:', { ...formData, logo_text: formData.logo_text })
      
      const res = await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const responseData = await res.json()

      if (res.ok) {
        // Refresh the data to show updated values
        fetchHomepageContent()
      } else {
        console.error('API Error:', responseData)
        alert(`Failed to update homepage content: ${responseData.error || 'Unknown error'}${responseData.details ? `\n\nDetails: ${responseData.details}` : ''}`)
      }
    } catch (error) {
      console.error('Error updating homepage:', error)
      alert(`Error updating homepage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">Loading homepage content...</div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <h1>Edit Homepage</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/" className="btn btn-secondary" target="_blank">
                Preview
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                ← Back to Admin
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <form onSubmit={handleSubmit} className="homepage-form">
          {/* AI Settings */}
          <div className="form-section">
            <h2 className="form-section-title">AI Settings</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ai_provider">Default AI Provider</label>
                <select
                  id="ai_provider"
                  value={aiProvider}
                  onChange={(e) => {
                    const prov = e.target.value as keyof typeof AI_PROVIDERS
                    setAiProvider(prov)
                    setAiModel(AI_PROVIDERS[prov].default)
                  }}
                >
                  {Object.entries(AI_PROVIDERS).map(([key, p]) => (
                    <option key={key} value={key}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ai_model">Default Model</label>
                <select
                  id="ai_model"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  {AI_PROVIDERS[aiProvider].models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Logo Section */}
          <div className="form-section">
            <h2 className="form-section-title">Logo & Branding</h2>
            
            <div className="form-group">
              <label htmlFor="logo_text">Logo Text</label>
              <input
                type="text"
                id="logo_text"
                name="logo_text"
                value={formData.logo_text}
                onChange={handleChange}
                placeholder="SEWO"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Text to display if no logo image is set (fallback)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="logo_image">Logo Image</label>
              <ImageUpload
                value={formData.logo_image}
                onChange={(url) => setFormData({ ...formData, logo_image: url })}
                label="Logo Image"
                folder="logos"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Upload a logo image (PNG with transparency recommended). Recommended size: 200x50px
              </p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="form-section">
            <h2 className="form-section-title">Hero Section</h2>
            
            <div className="form-group">
              <TextEnhancer
                value={formData.hero_title}
                onChange={(value) => setFormData({...formData, hero_title: value})}
                fieldType="hero_title"
                label="Hero Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.hero_description}
                onChange={(value) => setFormData({...formData, hero_description: value})}
                fieldType="hero_description"
                label="Hero Description"
                multiline={true}
                rows={4}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <ImageUpload
                value={formData.hero_image}
                onChange={(url) => setFormData({ ...formData, hero_image: url })}
                label="Hero Image (AI)"
                folder="hero"
                defaultPromptProvider={aiProvider}
                defaultPromptModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.hero_cta_text}
                  onChange={(value) => setFormData({...formData, hero_cta_text: value})}
                  fieldType="cta_text"
                  label="CTA Button Text"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hero_cta_link">CTA Button Link</label>
                <input
                  type="text"
                  id="hero_cta_link"
                  name="hero_cta_link"
                  value={formData.hero_cta_link}
                  onChange={handleChange}
                  placeholder="#contact or /signup"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.hero_footer_cta_text}
                  onChange={(value) => setFormData({...formData, hero_footer_cta_text: value})}
                  fieldType="cta_text"
                  label="Footer CTA Button Text"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hero_footer_cta_link">Footer CTA Button Link</label>
                <input
                  type="text"
                  id="hero_footer_cta_link"
                  name="hero_footer_cta_link"
                  value={formData.hero_footer_cta_link}
                  onChange={handleChange}
                  placeholder="mailto:hello@example.com or /contact"
                />
              </div>
            </div>

            {/* Hero Colors & Styling */}
            <div className="form-section">
              <h2 className="form-section-title">Hero Colors & Styling</h2>
              
              <div className="form-group">
                <label htmlFor="hero_bg_gradient">Background Gradient</label>
                
                {/* Color Pickers */}
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="gradient_start_color" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                      Start Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="gradient_start_color"
                        value={gradientStartColor}
                        onChange={(e) => handleGradientColorChange('start', e.target.value)}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={gradientStartColor}
                        onChange={(e) => handleGradientColorChange('start', e.target.value)}
                        placeholder="#667eea"
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gradient_end_color" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                      End Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="gradient_end_color"
                        value={gradientEndColor}
                        onChange={(e) => handleGradientColorChange('end', e.target.value)}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={gradientEndColor}
                        onChange={(e) => handleGradientColorChange('end', e.target.value)}
                        placeholder="#764ba2"
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Direction Selector */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="gradient_direction" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                    Direction
                  </label>
                  <select
                    id="gradient_direction"
                    value={gradientDirection}
                    onChange={(e) => handleGradientDirectionChange(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="0deg">To Right (→)</option>
                    <option value="45deg">To Bottom Right (↘)</option>
                    <option value="90deg">To Bottom (↓)</option>
                    <option value="135deg">To Bottom Left (↙)</option>
                    <option value="180deg">To Left (←)</option>
                    <option value="225deg">To Top Left (↖)</option>
                    <option value="270deg">To Top (↑)</option>
                    <option value="315deg">To Top Right (↗)</option>
                  </select>
                </div>

                {/* Gradient Preview */}
                <div 
                  key={formData.hero_bg_gradient || 'default'}
                  style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '8px',
                    background: formData.hero_bg_gradient || generateGradient(gradientStartColor, gradientEndColor, gradientDirection),
                    marginTop: '0.5rem',
                    border: '1px solid #ddd',
                    transition: 'background 0.1s ease'
                  }}
                />

                {/* Manual Override (Advanced) */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    Advanced: Manual CSS Gradient String
                  </summary>
                  <input
                    type="text"
                    id="hero_bg_gradient"
                    name="hero_bg_gradient"
                    value={formData.hero_bg_gradient || ''}
                    onChange={(e) => {
                      handleChange(e)
                      if (e.target.value) {
                        parseGradient(e.target.value)
                      }
                    }}
                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                    You can manually enter a CSS gradient string. The color pickers above will update automatically.
                  </p>
                </details>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hero_text_color">Text Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      id="hero_text_color"
                      name="hero_text_color"
                      value={formData.hero_text_color || '#ffffff'}
                      onChange={handleChange}
                      style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.hero_text_color || '#ffffff'}
                      onChange={(e) => setFormData({...formData, hero_text_color: e.target.value})}
                      placeholder="#ffffff"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="hero_cta_bg_color">CTA Background Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      id="hero_cta_bg_color"
                      name="hero_cta_bg_color"
                      value={formData.hero_cta_bg_color || '#000000'}
                      onChange={handleChange}
                      style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.hero_cta_bg_color || '#000000'}
                      onChange={(e) => setFormData({...formData, hero_cta_bg_color: e.target.value})}
                      placeholder="#000000"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="hero_cta_text_color">CTA Text Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="hero_cta_text_color"
                    name="hero_cta_text_color"
                    value={formData.hero_cta_text_color || '#ffffff'}
                    onChange={handleChange}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.hero_cta_text_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, hero_cta_text_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quiz_cta_border_color">Quiz Button Border Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="quiz_cta_border_color"
                    name="quiz_cta_border_color"
                    value={formData.quiz_cta_border_color || '#000000'}
                    onChange={handleChange}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.quiz_cta_border_color || '#000000'}
                    onChange={(e) => setFormData({...formData, quiz_cta_border_color: e.target.value})}
                    placeholder="#000000"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Problem Statement Section */}
          <div className="form-section">
            <h2 className="form-section-title">Problem Statement Section</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              This section appears directly below the hero. Two columns: text on left, image on right.
            </p>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <TextEnhancer
                  value={formData.problem_statement_title || ''}
                  onChange={(value) => setFormData({...formData, problem_statement_title: value})}
                  fieldType="problem_statement_title"
                  label="Section Title (use line breaks for multiple lines)"
                  multiline={true}
                  rows={2}
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="problem_statement_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="problem_statement_bg_color"
                    value={formData.problem_statement_bg_color || '#f8f9fa'}
                    onChange={(e) => setFormData({...formData, problem_statement_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.problem_statement_bg_color || '#f8f9fa'}
                    onChange={(e) => setFormData({...formData, problem_statement_bg_color: e.target.value})}
                    placeholder="#f8f9fa"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_para_1 || ''}
                onChange={(value) => setFormData({...formData, problem_statement_para_1: value})}
                fieldType="problem_statement_para"
                label="Paragraph 1"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_para_2 || ''}
                onChange={(value) => setFormData({...formData, problem_statement_para_2: value})}
                fieldType="problem_statement_para"
                label="Paragraph 2"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_para_3 || ''}
                onChange={(value) => setFormData({...formData, problem_statement_para_3: value})}
                fieldType="problem_statement_para"
                label="Paragraph 3"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_highlight || ''}
                onChange={(value) => setFormData({...formData, problem_statement_highlight: value})}
                fieldType="problem_statement_highlight"
                label="Highlight Text (displayed prominently)"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_para_4 || ''}
                onChange={(value) => setFormData({...formData, problem_statement_para_4: value})}
                fieldType="problem_statement_para"
                label="Paragraph 4"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.problem_statement_para_5 || ''}
                onChange={(value) => setFormData({...formData, problem_statement_para_5: value})}
                fieldType="problem_statement_para"
                label="Paragraph 5"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <ImageUpload
                value={formData.problem_statement_image || ''}
                onChange={(url) => setFormData({ ...formData, problem_statement_image: url })}
                label="Section Image (Right Column)"
                folder="problem-statement"
                defaultPromptProvider={aiProvider}
                defaultPromptModel={aiModel}
              />
            </div>
          </div>

          {/* Quiz CTA Section */}
          <div className="form-section">
            <h2 className="form-section-title">Quiz CTA (Right Side)</h2>
            
            <div className="form-group">
              <label htmlFor="quiz_steps">Number of Steps</label>
              <input
                type="text"
                id="quiz_steps"
                name="quiz_steps"
                value={formData.quiz_steps || '12'}
                onChange={handleChange}
                placeholder="12"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                The number displayed in the quiz badge (e.g., &quot;12 Steps&quot;)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="quiz_badge_text">Badge Text</label>
              <input
                type="text"
                id="quiz_badge_text"
                name="quiz_badge_text"
                value={formData.quiz_badge_text || 'Steps'}
                onChange={handleChange}
                placeholder="Steps"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                The text displayed next to the number in the badge (e.g., &quot;Steps&quot;, &quot;Questions&quot;, &quot;Minutes&quot;)
              </p>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.quiz_title || ''}
                onChange={(value) => setFormData({...formData, quiz_title: value})}
                fieldType="quiz_title"
                label="Quiz Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.quiz_description || ''}
                onChange={(value) => setFormData({...formData, quiz_description: value})}
                fieldType="quiz_description"
                label="Quiz Description"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quiz_cta_text">Quiz CTA Button Text</label>
                <input
                  type="text"
                  id="quiz_cta_text"
                  name="quiz_cta_text"
                  value={formData.quiz_cta_text || ''}
                  onChange={handleChange}
                  placeholder="Start Quiz"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quiz_cta_link">Quiz CTA Button Link</label>
                <input
                  type="text"
                  id="quiz_cta_link"
                  name="quiz_cta_link"
                  value={formData.quiz_cta_link || ''}
                  onChange={handleChange}
                  placeholder="/quiz"
                />
              </div>
            </div>
          </div>

          {/* Questions Discovery Section */}
          <div className="form-section">
            <h3>Questions Discovery (A/B Test Variant)</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              This content is used for the &quot;Questions Discovery&quot; A/B test variant in the hero section. 
              50% of visitors will see this instead of the quiz.
            </p>

            <div className="form-group">
              <TextEnhancer
                value={formData.questions_discovery_title || ''}
                onChange={(value) => setFormData({...formData, questions_discovery_title: value})}
                fieldType="questions_discovery_title"
                label="Questions Discovery Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.questions_discovery_description || ''}
                onChange={(value) => setFormData({...formData, questions_discovery_description: value})}
                fieldType="questions_discovery_description"
                label="Questions Discovery Description"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <label htmlFor="questions_discovery_cta_text">Results CTA Button Text</label>
              <input
                type="text"
                id="questions_discovery_cta_text"
                name="questions_discovery_cta_text"
                value={formData.questions_discovery_cta_text || ''}
                onChange={handleChange}
                placeholder="Book a Discovery Call"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                The button text shown after questions are displayed (links to /book-call)
              </p>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
                Loading State AI Facts
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                These facts cycle through while waiting for questions to load (5-10 seconds)
              </p>

              <div className="form-group">
                <label htmlFor="ai_fact_1">AI Fact 1</label>
                <textarea
                  id="ai_fact_1"
                  name="ai_fact_1"
                  value={formData.ai_fact_1 || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Did you know? Over 85% of consumers use AI-powered search..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ai_fact_2">AI Fact 2</label>
                <textarea
                  id="ai_fact_2"
                  name="ai_fact_2"
                  value={formData.ai_fact_2 || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="ChatGPT reaches 100 million users in just 2 months..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ai_fact_3">AI Fact 3</label>
                <textarea
                  id="ai_fact_3"
                  name="ai_fact_3"
                  value={formData.ai_fact_3 || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brands optimized for AI discovery see up to 300% more referral traffic..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ai_fact_4">AI Fact 4</label>
                <textarea
                  id="ai_fact_4"
                  name="ai_fact_4"
                  value={formData.ai_fact_4 || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="By 2025, 50% of all searches will be conducted through AI assistants..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ai_fact_5">AI Fact 5</label>
                <textarea
                  id="ai_fact_5"
                  name="ai_fact_5"
                  value={formData.ai_fact_5 || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="AI citations drive 4x higher conversion rates than traditional search results..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>

        {/* Inline Quiz Lead Capture */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Inline Quiz Lead Capture</h2>
            <p className="form-section-description">
              Controls the two “Want More SEO Traffic?” blocks that invite visitors to enter their URL.
            </p>
          </div>

          <div className="form-group">
            <TextEnhancer
              value={formData.quiz_form_title || ''}
              onChange={(value) => setFormData({ ...formData, quiz_form_title: value })}
              fieldType="quiz_form_title"
              label="Section Title"
              defaultProvider={aiProvider}
              defaultModel={aiModel}
            />
          </div>

          <div className="form-group">
            <TextEnhancer
              value={formData.quiz_form_description || ''}
              onChange={(value) => setFormData({ ...formData, quiz_form_description: value })}
              fieldType="quiz_form_description"
              label="Section Description"
              multiline={true}
              rows={3}
              defaultProvider={aiProvider}
              defaultModel={aiModel}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Supports basic HTML such as &lt;strong&gt; for emphasis.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quiz_form_placeholder">Input Placeholder</label>
              <input
                type="text"
                id="quiz_form_placeholder"
                name="quiz_form_placeholder"
                value={formData.quiz_form_placeholder || ''}
                onChange={handleChange}
                placeholder="What is the URL of your website?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quiz_form_cta_text">Button Text</label>
              <input
                type="text"
                id="quiz_form_cta_text"
                name="quiz_form_cta_text"
                value={formData.quiz_form_cta_text || ''}
                onChange={handleChange}
                placeholder="NEXT"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quiz_form_cta_link">Button Link</label>
              <input
                type="text"
                id="quiz_form_cta_link"
                name="quiz_form_cta_link"
                value={formData.quiz_form_cta_link || ''}
                onChange={handleChange}
                placeholder="/quiz"
              />
            </div>
          </div>
        </div>

        {/* Technology Carousel Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Technology Carousel</h2>
              <button type="button" onClick={addTechCarouselItem} className="btn btn-sm btn-primary">
                + Add Technology
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.tech_carousel_title || ''}
                  onChange={(value) => setFormData({...formData, tech_carousel_title: value})}
                  fieldType="tech_carousel_title"
                  label="Carousel Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tech_carousel_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="tech_carousel_bg_color"
                    value={formData.tech_carousel_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, tech_carousel_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.tech_carousel_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, tech_carousel_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Technology Tabs */}
            {(formData.tech_carousel_items || []).length > 0 && (
              <div className="tech-tabs-container">
                <div className="tech-tabs">
                  {(formData.tech_carousel_items || []).map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`tech-tab ${activeTechTab === index ? 'tech-tab-active' : ''}`}
                      onClick={() => setActiveTechTab(index)}
                    >
                      {item.name || `Technology ${index + 1}`}
                    </button>
                  ))}
                </div>

                {/* Active Tab Content */}
                {(formData.tech_carousel_items || [])[activeTechTab] && (
                  <div className="tech-tab-content">
                    <div className="tech-tab-header">
                      <h4>Technology {activeTechTab + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeTechCarouselItem(activeTechTab)} 
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Technology Name</label>
                        <input
                          type="text"
                          value={(formData.tech_carousel_items || [])[activeTechTab]?.name || ''}
                          onChange={(e) => handleTechCarouselItemChange(activeTechTab, 'name', e.target.value)}
                          placeholder="ChatGPT, Claude, Gemini, etc."
                        />
                      </div>

                      <div className="form-group">
                        <ImageUpload
                          value={(formData.tech_carousel_items || [])[activeTechTab]?.icon || ''}
                          onChange={(url) => handleTechCarouselItemChange(activeTechTab, 'icon', url)}
                          label="Icon/Logo"
                          folder="tech-icons"
                          defaultPromptProvider={aiProvider}
                          defaultPromptModel={aiModel}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How It Works Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">How It Works Section</h2>
              <button type="button" onClick={addHowItWorksStep} className="btn btn-sm btn-primary">
                + Add Step
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.how_it_works_title || ''}
                  onChange={(value) => setFormData({...formData, how_it_works_title: value})}
                  fieldType="how_it_works_title"
                  label="Section Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="how_it_works_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="how_it_works_bg_color"
                    value={formData.how_it_works_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, how_it_works_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.how_it_works_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, how_it_works_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="services-list">
              {(formData.how_it_works_steps || []).map((step, index) => (
                <div key={step.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Step {index + 1}</h4>
                    <button type="button" onClick={() => removeHowItWorksStep(index)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Step Number</label>
                      <input
                        type="text"
                        value={step.number}
                        onChange={(e) => handleHowItWorksStepChange(index, 'number', e.target.value)}
                        placeholder="01, 02, 03..."
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={step.title}
                      onChange={(value) => handleHowItWorksStepChange(index, 'title', value)}
                      fieldType="step_title"
                      label="Step Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={step.description}
                      onChange={(value) => handleHowItWorksStepChange(index, 'description', value)}
                      fieldType="step_description"
                      label="Step Description"
                      multiline={true}
                      rows={4}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <label>Step Image (AI)</label>
                    <ImageUpload
                      value={step.image || ''}
                      onChange={(url) => handleHowItWorksStepImageChange(index, url)}
                      label="Step Image"
                      folder="how-it-works"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Upload or generate an image for this step. Recommended: 1:1 aspect ratio (square).
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Link Text</label>
                      <input
                        type="text"
                        value={step.link_text || ''}
                        onChange={(e) => handleHowItWorksStepChange(index, 'link_text', e.target.value)}
                        placeholder="Discover More"
                      />
                    </div>
                    <div className="form-group">
                      <label>Link URL</label>
                      <input
                        type="text"
                        value={step.link_url || ''}
                        onChange={(e) => handleHowItWorksStepChange(index, 'link_url', e.target.value)}
                        placeholder="# or /page"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Work With Us Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Why Work With Us Section</h2>
              <button type="button" onClick={addWhyWorkWithUsItem} className="btn btn-sm btn-primary">
                + Add Item
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.why_work_with_us_title || ''}
                  onChange={(value) => setFormData({...formData, why_work_with_us_title: value})}
                  fieldType="why_work_with_us_title"
                  label="Section Label"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="why_work_with_us_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="why_work_with_us_bg_color"
                    value={formData.why_work_with_us_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, why_work_with_us_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.why_work_with_us_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, why_work_with_us_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.why_work_with_us_subtitle || ''}
                onChange={(value) => setFormData({...formData, why_work_with_us_subtitle: value})}
                fieldType="why_work_with_us_subtitle"
                label="Section Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.why_work_with_us_description || ''}
                onChange={(value) => setFormData({...formData, why_work_with_us_description: value})}
                fieldType="why_work_with_us_description"
                label="Section Description"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.why_work_with_us_items || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWhyWorkWithUsItem(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <ImageUpload
                      value={item.image || ''}
                      onChange={(url) => handleWhyWorkWithUsImageChange(index, url)}
                      label="Card Image"
                      folder="why-work-with-us"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.title}
                      onChange={(value) => handleWhyWorkWithUsChange(index, 'title', value)}
                      fieldType="why_work_with_us_item_title"
                      label="Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.description}
                      onChange={(value) => handleWhyWorkWithUsChange(index, 'description', value)}
                      fieldType="why_work_with_us_item_description"
                      label="Description"
                      multiline={true}
                      rows={2}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proof of Results Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Proof of Results Section</h2>
              <button type="button" onClick={addProofResult} className="btn btn-sm btn-primary">
                + Add Result
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.proof_results_title || ''}
                  onChange={(value) => setFormData({...formData, proof_results_title: value})}
                  fieldType="proof_results_title"
                  label="Section Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="proof_results_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="proof_results_bg_color"
                    value={formData.proof_results_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, proof_results_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.proof_results_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, proof_results_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.proof_results_subtitle || ''}
                onChange={(value) => setFormData({...formData, proof_results_subtitle: value})}
                fieldType="proof_results_subtitle"
                label="Section Subtitle"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.proof_results_items || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Result {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeProofResult(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <ImageUpload
                      value={item.image || ''}
                      onChange={(url) => handleProofResultImageChange(index, url)}
                      label="Result Image"
                      folder="proof-results"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.title}
                      onChange={(value) => handleProofResultChange(index, 'title', value)}
                      fieldType="proof_result_title"
                      label="Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.description}
                      onChange={(value) => handleProofResultChange(index, 'description', value)}
                      fieldType="proof_result_description"
                      label="Description"
                      multiline={true}
                      rows={3}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CTA Button Text</label>
                      <input
                        type="text"
                        value={item.cta_text}
                        onChange={(e) => handleProofResultChange(index, 'cta_text', e.target.value)}
                        placeholder="READ MORE"
                      />
                    </div>

                    <div className="form-group">
                      <label>CTA Link</label>
                      <input
                        type="text"
                        value={item.cta_link}
                        onChange={(e) => handleProofResultChange(index, 'cta_link', e.target.value)}
                        placeholder="/blog/article-slug or #"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">FAQ Section</h2>
              <button type="button" onClick={addFAQ} className="btn btn-sm btn-primary">
                + Add FAQ Item
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="faq_bg_color">Background Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  id="faq_bg_color"
                  value={formData.faq_bg_color || '#ffffff'}
                  onChange={(e) => setFormData({...formData, faq_bg_color: e.target.value})}
                  style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={formData.faq_bg_color || '#ffffff'}
                  onChange={(e) => setFormData({...formData, faq_bg_color: e.target.value})}
                  placeholder="#ffffff"
                  style={{ flex: 1, padding: '0.5rem' }}
                />
              </div>
            </div>

            <div className="services-list">
              {(formData.faq_items || []).map((faq, index) => (
                <div key={faq.id} className="service-item">
                  <div className="service-item-header">
                    <h4>FAQ Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={faq.question}
                      onChange={(value) => handleFAQChange(index, 'question', value)}
                      fieldType="faq_question"
                      label="Question"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={faq.answer}
                      onChange={(value) => handleFAQChange(index, 'answer', value)}
                      fieldType="faq_answer"
                      label="Answer"
                      multiline={true}
                      rows={4}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Visibility System (Solution) Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">AI Visibility System Section</h2>
            </div>

            <div className="form-group">
              <label htmlFor="solution_bg_color">Background Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  id="solution_bg_color"
                  value={formData.solution_bg_color || '#fafafa'}
                  onChange={(e) => setFormData({...formData, solution_bg_color: e.target.value})}
                  style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={formData.solution_bg_color || '#fafafa'}
                  onChange={(e) => setFormData({...formData, solution_bg_color: e.target.value})}
                  placeholder="#fafafa"
                  style={{ flex: 1, padding: '0.5rem' }}
                />
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Left Column - Narrative</h3>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_kicker || ''}
                onChange={(value) => setFormData({...formData, solution_kicker: value})}
                fieldType="solution_kicker"
                label="Kicker Text"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_headline || ''}
                onChange={(value) => setFormData({...formData, solution_headline: value})}
                fieldType="solution_headline"
                label="Headline"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_subtitle || ''}
                onChange={(value) => setFormData({...formData, solution_subtitle: value})}
                fieldType="solution_subtitle"
                label="Subtitle"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_body_para_1 || ''}
                onChange={(value) => setFormData({...formData, solution_body_para_1: value})}
                fieldType="solution_body_para_1"
                label="Body Paragraph 1"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_body_para_2 || ''}
                onChange={(value) => setFormData({...formData, solution_body_para_2: value})}
                fieldType="solution_body_para_2"
                label="Body Paragraph 2"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_body_para_3 || ''}
                onChange={(value) => setFormData({...formData, solution_body_para_3: value})}
                fieldType="solution_body_para_3"
                label="Body Paragraph 3 (Emphasis)"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_body_para_4 || ''}
                onChange={(value) => setFormData({...formData, solution_body_para_4: value})}
                fieldType="solution_body_para_4"
                label="Body Paragraph 4"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_body_para_5 || ''}
                onChange={(value) => setFormData({...formData, solution_body_para_5: value})}
                fieldType="solution_body_para_5"
                label="Body Paragraph 5"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CTA Button Text</label>
                <input
                  type="text"
                  value={formData.solution_cta_text || ''}
                  onChange={(e) => setFormData({...formData, solution_cta_text: e.target.value})}
                  placeholder="Apply to Work With Us"
                />
              </div>
              <div className="form-group">
                <label>CTA Button Link</label>
                <input
                  type="text"
                  value={formData.solution_cta_link || ''}
                  onChange={(e) => setFormData({...formData, solution_cta_link: e.target.value})}
                  placeholder="/guide"
                />
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_note || ''}
                onChange={(value) => setFormData({...formData, solution_note: value})}
                fieldType="solution_note"
                label="Note Text (below CTA)"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Testimonial</h3>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_testimonial_quote || ''}
                onChange={(value) => setFormData({...formData, solution_testimonial_quote: value})}
                fieldType="solution_testimonial_quote"
                label="Testimonial Quote"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Author Name</label>
                <input
                  type="text"
                  value={formData.solution_testimonial_author_name || ''}
                  onChange={(e) => setFormData({...formData, solution_testimonial_author_name: e.target.value})}
                  placeholder="James Neilson-Watt"
                />
              </div>
              <div className="form-group">
                <label>Author Company</label>
                <input
                  type="text"
                  value={formData.solution_testimonial_author_company || ''}
                  onChange={(e) => setFormData({...formData, solution_testimonial_author_company: e.target.value})}
                  placeholder="learnspark.io"
                />
              </div>
            </div>

            <div className="form-group">
              <ImageUpload
                value={formData.solution_testimonial_author_image || ''}
                onChange={(url) => setFormData({...formData, solution_testimonial_author_image: url})}
                label="Author Image"
                folder="testimonials"
                defaultPromptProvider={aiProvider}
                defaultPromptModel={aiModel}
              />
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Right Column - Pillars</h3>

            <div className="form-group">
              <TextEnhancer
                value={formData.solution_pillars_heading || ''}
                onChange={(value) => setFormData({...formData, solution_pillars_heading: value})}
                fieldType="solution_pillars_heading"
                label="Pillars Heading"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-section-header" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={addSolutionPillar} className="btn btn-sm btn-primary">
                + Add Pillar
              </button>
            </div>

            <div className="services-list">
              {(formData.solution_pillars || []).map((pillar, index) => (
                <div key={pillar.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Pillar {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSolutionPillar(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={pillar.title}
                      onChange={(value) => handleSolutionPillarChange(index, 'title', value)}
                      fieldType="solution_pillar_title"
                      label="Pillar Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={pillar.description}
                      onChange={(value) => handleSolutionPillarChange(index, 'description', value)}
                      fieldType="solution_pillar_description"
                      label="Pillar Description"
                      multiline={true}
                      rows={4}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Testimonials Section</h2>
              <button type="button" onClick={addTestimonial} className="btn btn-sm btn-primary">
                + Add Testimonial
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.testimonials_label || ''}
                  onChange={(value) => setFormData({...formData, testimonials_label: value})}
                  fieldType="testimonials_label"
                  label="Section Label"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="testimonials_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="testimonials_bg_color"
                    value={formData.testimonials_bg_color || '#f5f5f5'}
                    onChange={(e) => setFormData({...formData, testimonials_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.testimonials_bg_color || '#f5f5f5'}
                    onChange={(e) => setFormData({...formData, testimonials_bg_color: e.target.value})}
                    placeholder="#f5f5f5"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.testimonials_title || ''}
                onChange={(value) => setFormData({...formData, testimonials_title: value})}
                fieldType="testimonials_title"
                label="Section Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.testimonials_subtitle || ''}
                onChange={(value) => setFormData({...formData, testimonials_subtitle: value})}
                fieldType="testimonials_subtitle"
                label="Section Subtitle"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.testimonials_items || []).map((testimonial, index) => (
                <div key={testimonial.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Testimonial {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeTestimonial(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={testimonial.quote}
                      onChange={(value) => handleTestimonialChange(index, 'quote', value)}
                      fieldType={`testimonial_${index}_quote`}
                      label="Quote"
                      multiline={true}
                      rows={3}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rating (1-5)</label>
                      <select
                        value={testimonial.rating}
                        onChange={(e) => handleTestimonialChange(index, 'rating', parseInt(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <ImageUpload
                        value={testimonial.author_image || ''}
                        onChange={(url) => handleTestimonialImageChange(index, url)}
                        label="Author Image"
                        folder="testimonials"
                        defaultPromptProvider={aiProvider}
                        defaultPromptModel={aiModel}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Author Name</label>
                      <input
                        type="text"
                        value={testimonial.author_name}
                        onChange={(e) => handleTestimonialChange(index, 'author_name', e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>

                    <div className="form-group">
                      <label>Author Title</label>
                      <input
                        type="text"
                        value={testimonial.author_title}
                        onChange={(e) => handleTestimonialChange(index, 'author_title', e.target.value)}
                        placeholder="CEO, Founder, etc."
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={testimonial.author_company}
                      onChange={(e) => handleTestimonialChange(index, 'author_company', e.target.value)}
                      placeholder="Company Name"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Services Section</h2>
              <button type="button" onClick={addService} className="btn btn-sm btn-primary">
                + Add Service
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.services_section_title || ''}
                  onChange={(value) => setFormData({...formData, services_section_title: value})}
                  fieldType="services_section_title"
                  label="Section Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="services_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="services_bg_color"
                    value={formData.services_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, services_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.services_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, services_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.services_section_description || ''}
                onChange={(value) => setFormData({...formData, services_section_description: value})}
                fieldType="services_section_description"
                label="Section Description"
                multiline={true}
                rows={2}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.services_items || []).map((service, index) => (
                <div key={service.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Service {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={service.title}
                      onChange={(value) => handleServiceChange(index, 'title', value)}
                      fieldType={`service_${index}_title`}
                      label="Service Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <ImageUpload
                        value={service.image || ''}
                        onChange={(url) => handleServiceImageChange(index, url)}
                        label="Service Image"
                        folder="services"
                        defaultPromptProvider={aiProvider}
                        defaultPromptModel={aiModel}
                      />
                    </div>

                    <div className="form-group">
                      <label>Link URL</label>
                      <input
                        type="text"
                        value={service.link_url || ''}
                        onChange={(e) => handleServiceChange(index, 'link_url', e.target.value)}
                        placeholder="#"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Blog Section */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Blog Section</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={formData.blog_section_visible ?? true}
                onChange={(e) => setFormData({ ...formData, blog_section_visible: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Show Blog Section</span>
            </label>
          </div>

          <div className="form-group">
            <TextEnhancer
              value={formData.blog_grid_title || ''}
              onChange={(value) => setFormData({ ...formData, blog_grid_title: value })}
              fieldType="blog_grid_title"
              label="Section Title"
              defaultProvider={aiProvider}
              defaultModel={aiModel}
            />
          </div>
        </div>

          {/* Landing Pages */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Landing Pages</h2>
              <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Content for dedicated landing pages: /quiz and /find-questions
              </p>
            </div>

            {/* Quiz Landing Page */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
                Quiz Landing Page (/quiz)
              </h3>
              
              <div className="form-group">
                <TextEnhancer
                  value={formData.quiz_landing_title || ''}
                  onChange={(value) => setFormData({...formData, quiz_landing_title: value})}
                  fieldType="quiz_landing_title"
                  label="Page Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <TextEnhancer
                  value={formData.quiz_landing_description || ''}
                  onChange={(value) => setFormData({...formData, quiz_landing_description: value})}
                  fieldType="quiz_landing_description"
                  label="Page Description"
                  multiline={true}
                  rows={3}
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>
            </div>

            {/* Find Questions Landing Page */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
                Find Questions Landing Page (/find-questions)
              </h3>
              
              <div className="form-group">
                <TextEnhancer
                  value={formData.find_questions_title || ''}
                  onChange={(value) => setFormData({...formData, find_questions_title: value})}
                  fieldType="find_questions_title"
                  label="Page Title"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <TextEnhancer
                  value={formData.find_questions_description || ''}
                  onChange={(value) => setFormData({...formData, find_questions_description: value})}
                  fieldType="find_questions_description"
                  label="Page Description"
                  multiline={true}
                  rows={3}
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>
            </div>
          </div>

          {/* Additional Background Colors */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Additional Section Colors</h2>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quiz_cta_bg_color">Quiz CTA Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="quiz_cta_bg_color"
                    value={formData.quiz_cta_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, quiz_cta_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.quiz_cta_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, quiz_cta_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="blog_grid_bg_color">Blog Grid Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="blog_grid_bg_color"
                    value={formData.blog_grid_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, blog_grid_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.blog_grid_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, blog_grid_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Homepage Content'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function HomepageEditorPage() {
  return (
    <AdminAuthCheck>
      <HomepageEditorPageInner />
    </AdminAuthCheck>
  )
}

