'use client'

import { useEffect, useMemo, useState } from 'react'

/* ── Types ────────────────────────────────────────────────── */

type RequirementItem = {
  key: string
  label: string
  present: boolean
  source?: 'env' | 'file'
}

type Option = { id: string; label: string; hint?: string }

/* ── Step 1 – Categories & Sub-niches ─────────────────────── */

type SubNiche = {
  id: string
  label: string
  targetMarket: string
  voice: string
  tagline: string
  description: string
  footerTagline: string
  brandSuggestions: { name: string; slug: string }[]
}

type Category = {
  id: string
  label: string
  icon: string
  subNiches: SubNiche[]
}

const categories: Category[] = [
  {
    id: 'health', label: 'Health & Wellness', icon: '💪',
    subNiches: [
      { id: 'longevity', label: 'Longevity & Healthy Aging', targetMarket: 'Health-conscious adults 30-60 interested in evidence-based longevity', voice: 'Authoritative yet approachable, evidence-based, no hype', tagline: 'Science-First Guide to Living Longer and Healthier', description: 'Practical, evidence-based guidance on supplements, routines, and healthspan decisions.', footerTagline: 'Evidence-based longevity guidance without hype.', brandSuggestions: [{ name: 'Modern Longevity', slug: 'modernlongevity' }, { name: 'Healthspan Hub', slug: 'healthspanhub' }, { name: 'Longevity Edge', slug: 'longevityedge' }] },
      { id: 'fitness', label: 'Fitness & Performance', targetMarket: 'Adults 20-50 who want sustainable fitness and recovery results', voice: 'Coaching-style, practical, motivating, science-aware', tagline: 'Practical Training and Recovery Guidance That Works', description: 'Actionable fitness content focused on strength, conditioning, and long-term consistency.', footerTagline: 'Evidence-informed fitness advice for real-world results.', brandSuggestions: [{ name: 'Peak Perform', slug: 'peakperform' }, { name: 'Strength Daily', slug: 'strengthdaily' }, { name: 'FitPath', slug: 'fitpath' }] },
      { id: 'nutrition', label: 'Nutrition & Metabolic Health', targetMarket: 'Adults 25-60 looking for practical nutrition and metabolic strategies', voice: 'Straightforward, educational, evidence-based', tagline: 'Nutrition Guidance You Can Actually Apply', description: 'Practical nutrition content on sustainable eating, metabolic health, and long-term outcomes.', footerTagline: 'Actionable nutrition advice rooted in evidence.', brandSuggestions: [{ name: 'Nourish Logic', slug: 'nourishlogic' }, { name: 'MetaFuel', slug: 'metafuel' }, { name: 'Eat Informed', slug: 'eatinformed' }] },
      { id: 'mentalwellness', label: 'Mental Wellness & Resilience', targetMarket: 'Adults seeking practical tools for stress, focus, and emotional wellbeing', voice: 'Calm, supportive, practical, credible', tagline: 'Practical Mental Wellness for Everyday Life', description: 'Strategies for resilience, stress management, sleep, and sustainable mental wellbeing.', footerTagline: 'Calm, practical mental wellness guidance.', brandSuggestions: [{ name: 'Calm Blueprint', slug: 'calmblueprint' }, { name: 'Mind Steady', slug: 'mindsteady' }, { name: 'Resilience Daily', slug: 'resiliencedaily' }] },
      { id: 'skincare', label: 'Skincare & Beauty Science', targetMarket: 'Adults 25-55 seeking evidence-led skincare and anti-aging routines', voice: 'Clear, educational, modern, science-first', tagline: 'Skincare Guidance Backed by Evidence, Not Hype', description: 'Trusted skincare recommendations, ingredient breakdowns, and routine guidance.', footerTagline: 'Skincare content grounded in evidence and clarity.', brandSuggestions: [{ name: 'Glow Science', slug: 'glowscience' }, { name: 'Skin Clarity', slug: 'skinclarity' }, { name: 'Derma Decoded', slug: 'dermadecoded' }] },
      { id: 'sleep', label: 'Sleep & Recovery', targetMarket: 'Adults struggling with sleep quality, recovery, and energy optimization', voice: 'Reassuring, science-backed, actionable', tagline: 'Better Sleep Starts With Better Information', description: 'Evidence-based guidance on sleep hygiene, recovery, and energy optimization.', footerTagline: 'Science-backed sleep and recovery guidance.', brandSuggestions: [{ name: 'Sleep Decoded', slug: 'sleepdecoded' }, { name: 'Rest Well Hub', slug: 'restwellhub' }, { name: 'Deep Rest', slug: 'deeprest' }] },
    ],
  },
  {
    id: 'tech', label: 'Technology', icon: '💻',
    subNiches: [
      { id: 'ai-ml', label: 'AI & Machine Learning', targetMarket: 'Tech professionals and enthusiasts interested in AI, ML, and automation trends', voice: 'Sharp, informed, forward-looking, practical', tagline: 'AI Explained for Builders and Decision-Makers', description: 'Clear breakdowns of AI tools, trends, and applications for professionals and curious minds.', footerTagline: 'AI insights you can actually apply.', brandSuggestions: [{ name: 'AI Decoded', slug: 'aidecoded' }, { name: 'Neural Edge', slug: 'neuraledge' }, { name: 'Machine Minded', slug: 'machineminded' }] },
      { id: 'cybersecurity', label: 'Cybersecurity & Privacy', targetMarket: 'IT professionals and privacy-conscious consumers', voice: 'Serious, trustworthy, technically credible, clear', tagline: 'Security Guidance That Cuts Through the Noise', description: 'Practical cybersecurity advice, threat intelligence, and privacy strategies.', footerTagline: 'Security insights grounded in real-world threats.', brandSuggestions: [{ name: 'Secure Stack', slug: 'securestack' }, { name: 'Threat Decoded', slug: 'threatdecoded' }, { name: 'Privacy Edge', slug: 'privacyedge' }] },
      { id: 'devtools', label: 'Developer Tools & SaaS', targetMarket: 'Software developers and technical decision-makers evaluating tools', voice: 'Technical, honest, comparison-focused, practical', tagline: 'Honest Reviews of the Tools Developers Actually Use', description: 'In-depth reviews, comparisons, and guides for developer tools, SaaS, and infrastructure.', footerTagline: 'Developer tool reviews without the hype.', brandSuggestions: [{ name: 'Dev Toolbox', slug: 'devtoolbox' }, { name: 'Stack Picker', slug: 'stackpicker' }, { name: 'Tool Lens', slug: 'toollens' }] },
      { id: 'gadgets', label: 'Consumer Tech & Gadgets', targetMarket: 'Tech-savvy consumers looking for honest product guidance', voice: 'Friendly, knowledgeable, review-focused, balanced', tagline: 'Tech Reviews You Can Trust', description: 'Honest gadget reviews, buying guides, and tech comparisons for everyday consumers.', footerTagline: 'Tech reviews without the affiliate bias.', brandSuggestions: [{ name: 'Gadget Guide', slug: 'gadgetguide' }, { name: 'Tech Decoded', slug: 'techdecoded' }, { name: 'Device Pick', slug: 'devicepick' }] },
      { id: 'nocode', label: 'No-Code & Automation', targetMarket: 'Entrepreneurs and professionals building with no-code and automation tools', voice: 'Empowering, clear, tutorial-style, practical', tagline: 'Build More With Less Code', description: 'Guides, tutorials, and tool reviews for the no-code and automation ecosystem.', footerTagline: 'No-code guidance for real builders.', brandSuggestions: [{ name: 'No-Code Lab', slug: 'nocodelab' }, { name: 'Automate This', slug: 'automatethis' }, { name: 'Build Zero', slug: 'buildzero' }] },
    ],
  },
  {
    id: 'finance', label: 'Money & Finance', icon: '💰',
    subNiches: [
      { id: 'personalfinance', label: 'Personal Finance & Budgeting', targetMarket: 'Adults 25-55 seeking practical financial independence guidance', voice: 'Clear, no-nonsense, trustworthy, data-aware', tagline: 'Financial Guidance Without the Jargon', description: 'Actionable personal finance content on budgeting, saving, and building wealth.', footerTagline: 'Financial clarity without the noise.', brandSuggestions: [{ name: 'Wealth Path', slug: 'wealthpath' }, { name: 'Money Clarity', slug: 'moneyrecoded' }, { name: 'Stack Smart', slug: 'stacksmart' }] },
      { id: 'investing', label: 'Investing & Markets', targetMarket: 'Self-directed investors seeking data-driven market analysis', voice: 'Analytical, measured, data-first, educational', tagline: 'Investment Insights Backed by Data', description: 'Market analysis, investment strategies, and portfolio guidance for self-directed investors.', footerTagline: 'Investing insight grounded in data.', brandSuggestions: [{ name: 'Market Lens', slug: 'marketlens' }, { name: 'Invest Decoded', slug: 'investdecoded' }, { name: 'Capital Edge', slug: 'capitaledge' }] },
      { id: 'crypto', label: 'Crypto & Web3', targetMarket: 'Crypto-curious to intermediate investors seeking clarity in a noisy space', voice: 'Transparent, analytical, cutting through hype', tagline: 'Crypto Clarity in a Noisy Market', description: 'Honest analysis, project reviews, and strategy for crypto and Web3 participants.', footerTagline: 'Crypto analysis without the shilling.', brandSuggestions: [{ name: 'Chain Clarity', slug: 'chainclarity' }, { name: 'Crypto Decoded', slug: 'cryptodecoded' }, { name: 'Block Signal', slug: 'blocksignal' }] },
      { id: 'realestate', label: 'Real Estate & Property', targetMarket: 'Aspiring and active property investors seeking practical guidance', voice: 'Practical, experienced, data-supported, action-oriented', tagline: 'Real Estate Guidance That Builds Wealth', description: 'Property investment strategies, market analysis, and practical buying/renting guidance.', footerTagline: 'Property guidance for real investors.', brandSuggestions: [{ name: 'Property Path', slug: 'propertypath' }, { name: 'Estate Logic', slug: 'estatelogic' }, { name: 'Invest Brick', slug: 'investbrick' }] },
    ],
  },
  {
    id: 'business', label: 'Business & Entrepreneurship', icon: '🚀',
    subNiches: [
      { id: 'startups', label: 'Startups & Founders', targetMarket: 'Early-stage founders and aspiring entrepreneurs', voice: 'Direct, experienced, practical, founder-to-founder', tagline: 'Startup Lessons From the Trenches', description: 'Practical startup advice on fundraising, product, growth, and founder challenges.', footerTagline: 'Startup wisdom without the buzzwords.', brandSuggestions: [{ name: 'Founder Edge', slug: 'founderedge' }, { name: 'Launch Logic', slug: 'launchlogic' }, { name: 'Startup Decoded', slug: 'startupdecoded' }] },
      { id: 'ecommerce', label: 'E-commerce & DTC', targetMarket: 'Online store owners and DTC brand operators', voice: 'Data-driven, practical, growth-focused', tagline: 'E-commerce Growth Strategies That Work', description: 'Actionable e-commerce guidance on conversion, marketing, operations, and scaling.', footerTagline: 'E-commerce advice built on real data.', brandSuggestions: [{ name: 'Store Scale', slug: 'storescale' }, { name: 'Cart Logic', slug: 'cartlogic' }, { name: 'DTC Playbook', slug: 'dtcplaybook' }] },
      { id: 'freelancing', label: 'Freelancing & Creator Economy', targetMarket: 'Freelancers, consultants, and content creators building independent income', voice: 'Empowering, relatable, practical, honest', tagline: 'Build Your Independent Career on Your Terms', description: 'Guides on client acquisition, pricing, portfolio building, and sustainable freelancing.', footerTagline: 'Freelance guidance from people who do it.', brandSuggestions: [{ name: 'Free Agent', slug: 'freeagent' }, { name: 'Solo Scale', slug: 'soloscale' }, { name: 'Creator Path', slug: 'creatorpath' }] },
      { id: 'marketing', label: 'Digital Marketing & SEO', targetMarket: 'Marketers and business owners seeking organic and paid growth strategies', voice: 'Strategic, data-aware, transparent, actionable', tagline: 'Marketing Strategies That Drive Real Growth', description: 'SEO, content marketing, paid ads, and conversion strategies for growth-focused marketers.', footerTagline: 'Marketing advice backed by results.', brandSuggestions: [{ name: 'Growth Decoded', slug: 'growthdecoded' }, { name: 'Rank Logic', slug: 'ranklogic' }, { name: 'Traffic Blueprint', slug: 'trafficblueprint' }] },
    ],
  },
  {
    id: 'lifestyle', label: 'Lifestyle & Home', icon: '🏡',
    subNiches: [
      { id: 'travel', label: 'Travel & Adventure', targetMarket: 'Travel enthusiasts and planners seeking authentic destination guidance', voice: 'Inspiring, personal, practical, visually driven', tagline: 'Travel Smarter, Experience More', description: 'Destination guides, itineraries, and travel strategies for meaningful experiences.', footerTagline: 'Travel guidance from real travelers.', brandSuggestions: [{ name: 'Wander Wise', slug: 'wanderwise' }, { name: 'Trip Decoded', slug: 'tripdecoded' }, { name: 'Explore Path', slug: 'explorepath' }] },
      { id: 'homeandgarden', label: 'Home & Garden', targetMarket: 'Homeowners and renters looking for practical home improvement guidance', voice: 'Friendly, practical, tutorial-style, visual', tagline: 'Make Your Home Work Better for You', description: 'DIY guides, product reviews, and inspiration for home improvement and gardening.', footerTagline: 'Practical home guidance you can use this weekend.', brandSuggestions: [{ name: 'Home Refined', slug: 'homerefined' }, { name: 'Garden Logic', slug: 'gardenlogic' }, { name: 'Nest Better', slug: 'nestbetter' }] },
      { id: 'cooking', label: 'Cooking & Recipes', targetMarket: 'Home cooks seeking reliable recipes and kitchen guidance', voice: 'Warm, approachable, tested, clear instructions', tagline: 'Recipes and Kitchen Guidance You Can Trust', description: 'Tested recipes, technique guides, and kitchen equipment reviews for home cooks.', footerTagline: 'Recipes that actually work, every time.', brandSuggestions: [{ name: 'Cook Tested', slug: 'cooktested' }, { name: 'Kitchen Clarity', slug: 'kitchenclarity' }, { name: 'Meal Logic', slug: 'meallogic' }] },
      { id: 'sustainability', label: 'Sustainability & Eco Living', targetMarket: 'Environmentally conscious consumers seeking practical eco-living guidance', voice: 'Positive, practical, science-aware, non-preachy', tagline: 'Sustainable Living That Actually Fits Your Life', description: 'Practical sustainability guidance, eco-product reviews, and lifestyle changes that make a difference.', footerTagline: 'Sustainability advice that works in the real world.', brandSuggestions: [{ name: 'Green Shift', slug: 'greenshift' }, { name: 'Eco Decoded', slug: 'ecodecoded' }, { name: 'Light Footprint', slug: 'lightfootprint' }] },
      { id: 'fashion', label: 'Fashion & Style', targetMarket: 'Style-conscious adults looking for practical wardrobe and fashion guidance', voice: 'Confident, editorial, accessible, trend-aware', tagline: 'Style Guidance That Works for Real Life', description: 'Wardrobe strategy, trend breakdowns, and product picks for everyday style.', footerTagline: 'Fashion advice grounded in real wardrobes.', brandSuggestions: [{ name: 'Style Decoded', slug: 'styledecoded' }, { name: 'Wardrobe Logic', slug: 'wardrobelogic' }, { name: 'Dress Sharp', slug: 'dresssharp' }] },
    ],
  },
  {
    id: 'education', label: 'Education & Career', icon: '📚',
    subNiches: [
      { id: 'productivity', label: 'Productivity & Deep Work', targetMarket: 'Professionals seeking focus, output, and time management strategies', voice: 'Focused, practical, evidence-aware, professional', tagline: 'Work Smarter With Evidence-Based Productivity', description: 'Strategies for deep work, focus, time management, and sustainable productivity.', footerTagline: 'Productivity advice that respects your time.', brandSuggestions: [{ name: 'Deep Output', slug: 'deepoutput' }, { name: 'Focus Stack', slug: 'focusstack' }, { name: 'Work Refined', slug: 'workrefinedd' }] },
      { id: 'career', label: 'Career Growth & Skills', targetMarket: 'Professionals 25-45 looking to advance their career and build new skills', voice: 'Encouraging, strategic, experienced, actionable', tagline: 'Career Advice That Gets You Ahead', description: 'Career strategies, interview guidance, salary negotiation, and skill-building content.', footerTagline: 'Career guidance from people who have been there.', brandSuggestions: [{ name: 'Career Decoded', slug: 'careerdecoded' }, { name: 'Level Up Pro', slug: 'leveluppro' }, { name: 'Skill Path', slug: 'skillpath' }] },
      { id: 'languages', label: 'Language Learning', targetMarket: 'Adults learning a new language for travel, work, or personal enrichment', voice: 'Encouraging, structured, practical, culturally aware', tagline: 'Learn Languages the Practical Way', description: 'Effective language learning strategies, tool reviews, and practice techniques.', footerTagline: 'Language learning that respects your time.', brandSuggestions: [{ name: 'Fluent Path', slug: 'fluentpath' }, { name: 'Lingua Logic', slug: 'lingualogic' }, { name: 'Speak Decoded', slug: 'speakdecoded' }] },
      { id: 'onlinelearning', label: 'Online Learning & Courses', targetMarket: 'Lifelong learners evaluating online courses and education platforms', voice: 'Honest, comparison-focused, student-perspective', tagline: 'Find the Right Course Before You Spend', description: 'Course reviews, platform comparisons, and learning path guidance for online education.', footerTagline: 'Online learning reviews from real students.', brandSuggestions: [{ name: 'Course Clarity', slug: 'courseclarity' }, { name: 'Learn Ranked', slug: 'learnranked' }, { name: 'Edu Lens', slug: 'edulens' }] },
    ],
  },
  {
    id: 'family', label: 'Family & Parenting', icon: '👨‍👩‍👧‍👦',
    subNiches: [
      { id: 'parenting', label: 'Parenting & Child Development', targetMarket: 'Parents 25-45 looking for research-backed parenting guidance', voice: 'Warm, relatable, evidence-informed, non-judgmental', tagline: 'Practical Parenting Backed by Research', description: 'Research-informed advice on child development, routines, and family wellness.', footerTagline: 'Parenting advice you can actually use.', brandSuggestions: [{ name: 'Raise Well', slug: 'raisewell' }, { name: 'Parent Path', slug: 'parentpath' }, { name: 'Family Blueprint', slug: 'familyblueprint' }] },
      { id: 'pregnancy', label: 'Pregnancy & New Parents', targetMarket: 'Expecting and new parents seeking trustworthy guidance', voice: 'Supportive, reassuring, medically aware, practical', tagline: 'Trusted Guidance for Growing Families', description: 'Evidence-based pregnancy, birth, and newborn content for expecting and new parents.', footerTagline: 'Trusted guidance for your growing family.', brandSuggestions: [{ name: 'Bump Guide', slug: 'bumpguide' }, { name: 'New Parent Hub', slug: 'newparenthub' }, { name: 'Little Start', slug: 'littlestart' }] },
      { id: 'pets', label: 'Pets & Animal Care', targetMarket: 'Pet owners seeking reliable health, training, and product guidance', voice: 'Caring, practical, vet-informed, relatable', tagline: 'Better Care for Your Best Friend', description: 'Pet health guides, training tips, product reviews, and nutrition advice.', footerTagline: 'Pet care guidance backed by real experience.', brandSuggestions: [{ name: 'Pet Decoded', slug: 'petdecoded' }, { name: 'Paw Logic', slug: 'pawlogic' }, { name: 'Happy Hound', slug: 'happyhound' }] },
    ],
  },
  {
    id: 'entertainment', label: 'Entertainment & Hobbies', icon: '🎮',
    subNiches: [
      { id: 'gaming', label: 'Gaming & Esports', targetMarket: 'Gamers seeking reviews, news, and strategy across platforms', voice: 'Knowledgeable, enthusiastic, honest, community-aware', tagline: 'Gaming Coverage That Respects Your Time', description: 'Game reviews, hardware guides, strategy content, and gaming industry analysis.', footerTagline: 'Gaming content from people who actually play.', brandSuggestions: [{ name: 'Game Decoded', slug: 'gamedecoded' }, { name: 'Play Logic', slug: 'playlogic' }, { name: 'Level Signal', slug: 'levelsignal' }] },
      { id: 'photography', label: 'Photography & Video', targetMarket: 'Hobbyist and semi-pro photographers and videographers', voice: 'Creative, technical, tutorial-focused, visual', tagline: 'Create Better Visual Content', description: 'Camera reviews, technique tutorials, editing guides, and creative inspiration.', footerTagline: 'Photography and video guidance that improves your work.', brandSuggestions: [{ name: 'Shutter Logic', slug: 'shutterlogic' }, { name: 'Frame Decoded', slug: 'framedecoded' }, { name: 'Visual Path', slug: 'visualpath' }] },
      { id: 'outdoors', label: 'Outdoors & Adventure Sports', targetMarket: 'Outdoor enthusiasts seeking gear reviews and adventure planning guidance', voice: 'Adventurous, practical, gear-savvy, experienced', tagline: 'Gear and Guidance for Your Next Adventure', description: 'Gear reviews, trip planning, and outdoor skills for hikers, campers, and adventurers.', footerTagline: 'Outdoor guidance from people who get out there.', brandSuggestions: [{ name: 'Trail Logic', slug: 'traillogic' }, { name: 'Gear Decoded', slug: 'geardecoded' }, { name: 'Wild Path', slug: 'wildpath' }] },
      { id: 'music', label: 'Music & Audio', targetMarket: 'Musicians, audio enthusiasts, and music lovers seeking gear and technique guidance', voice: 'Passionate, knowledgeable, honest, creative', tagline: 'Better Sound Starts With Better Gear', description: 'Instrument reviews, audio gear guides, production tutorials, and music discovery.', footerTagline: 'Music and audio guidance from real players.', brandSuggestions: [{ name: 'Sound Decoded', slug: 'sounddecoded' }, { name: 'Tone Logic', slug: 'tonelogic' }, { name: 'Audio Path', slug: 'audiopath' }] },
    ],
  },
  {
    id: 'auto', label: 'Automotive & Transport', icon: '🚗',
    subNiches: [
      { id: 'cars', label: 'Cars & Driving', targetMarket: 'Car buyers and enthusiasts seeking honest reviews and buying guidance', voice: 'Knowledgeable, balanced, data-supported, enthusiast', tagline: 'Car Buying Guidance You Can Trust', description: 'Car reviews, comparisons, buying strategies, and maintenance guidance.', footerTagline: 'Automotive guidance without the dealer spin.', brandSuggestions: [{ name: 'Drive Decoded', slug: 'drivedecoded' }, { name: 'Auto Logic', slug: 'autologic' }, { name: 'Car Clarity', slug: 'carclarity' }] },
      { id: 'ev', label: 'Electric Vehicles & Clean Transport', targetMarket: 'Consumers considering EVs and sustainable transport options', voice: 'Forward-looking, data-driven, practical, balanced', tagline: 'The Practical Guide to Electric Transport', description: 'EV reviews, charging infrastructure guides, and sustainable transport comparisons.', footerTagline: 'EV guidance grounded in real ownership.', brandSuggestions: [{ name: 'EV Decoded', slug: 'evdecoded' }, { name: 'Charge Logic', slug: 'chargelogic' }, { name: 'Electric Path', slug: 'electricpath' }] },
    ],
  },
]

/* ── Step 2 – Audience / Region / Monetization ────────────── */

const audienceOptions: Option[] = [
  { id: 'mass', label: 'Broad consumer audience', hint: 'General education and entry-level guidance' },
  { id: 'premium', label: 'Premium / high-intent buyers', hint: 'Decision-ready readers with higher spend capacity' },
  { id: 'beginners', label: 'Beginners / new to topic', hint: 'Simple explanations and first-step actions' },
  { id: 'intermediate', label: 'Intermediate enthusiasts', hint: 'Practical depth and comparisons' },
  { id: 'expert', label: 'Advanced / professional audience', hint: 'Technical detail and evidence quality' },
]

const regionOptions: Option[] = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
  { id: 'au', label: 'Australia' },
  { id: 'global', label: 'Global English' },
]

const monetizationOptions: Option[] = [
  { id: 'affiliate', label: 'Affiliate-first', hint: 'Product comparisons and buyer guides' },
  { id: 'ads', label: 'Ads / content network', hint: 'High-volume informational content' },
  { id: 'leadgen', label: 'Lead generation', hint: 'CTA-focused educational content' },
  { id: 'products', label: 'Own products / services', hint: 'Authority + conversion paths' },
  { id: 'hybrid', label: 'Hybrid', hint: 'Mix of affiliate, ads, and own offers' },
]

/* ── Wizard steps ─────────────────────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5 | 6

/* ── Styles ───────────────────────────────────────────────── */

const card: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 16,
  padding: '2.5rem 2rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
}
const stepLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#94a3b8',
  marginBottom: 6,
}
const heading: React.CSSProperties = { marginTop: 0, marginBottom: 4, fontSize: 22 }
const subtext: React.CSSProperties = { color: '#64748b', marginTop: 0, marginBottom: 24, fontSize: 14 }
const optionCard = (selected: boolean): React.CSSProperties => ({
  border: `2px solid ${selected ? '#2563eb' : '#e2e8f0'}`,
  borderRadius: 10,
  padding: '0.85rem 1rem',
  cursor: 'pointer',
  background: selected ? '#eff6ff' : '#fff',
  transition: 'all 0.15s',
})
const optionTitle: React.CSSProperties = { fontWeight: 600, fontSize: 15, margin: 0 }
const optionHint: React.CSSProperties = { fontSize: 12, color: '#64748b', margin: '4px 0 0' }
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  padding: '0.75rem 1.5rem',
  borderRadius: 8,
  border: 'none',
  background: disabled ? '#94a3b8' : '#2563eb',
  color: '#fff',
  fontWeight: 700,
  fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer',
})
const btnSecondary: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#334155',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
}
const progressBar = (pct: number): React.CSSProperties => ({
  height: 4,
  borderRadius: 4,
  background: '#e2e8f0',
  marginBottom: 28,
  overflow: 'hidden',
})
const progressFill = (pct: number): React.CSSProperties => ({
  height: '100%',
  width: `${pct}%`,
  background: '#2563eb',
  borderRadius: 4,
  transition: 'width 0.3s',
})

/* ── Component ────────────────────────────────────────────── */

export default function SetupAutoPage() {
  const [step, setStep] = useState<Step>(1)

  /* Step 1 */
  const [categoryId, setCategoryId] = useState('')
  const [nicheId, setNicheId] = useState('')

  /* Step 2 */
  const [audienceId, setAudienceId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [monetizationId, setMonetizationId] = useState('')

  /* Step 3 – brand direction (LLM-generated) */
  type BrandSuggestion = { name: string; slug: string; reason: string }
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([])
  const [brandLoading, setBrandLoading] = useState(false)
  const [brandError, setBrandError] = useState('')
  const [brandSlug, setBrandSlug] = useState('')

  /* Step 4 – domain (auto-searches, only shows available + affordable) */
  type DomainResult = { domain: string; estimatedAnnualCost: number }
  const [availableDomains, setAvailableDomains] = useState<DomainResult[]>([])
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainSearched, setDomainSearched] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState('')

  /* Step 5 – review & run */
  const [outputBase] = useState('/Users/stuarta/Documents/GitHub')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; output: string } | null>(null)

  /* Step 6 – post-clone: domain checklist + product + pipeline launch */
  const [domainPurchased, setDomainPurchased] = useState(false)
  const [dnsConfigured, setDnsConfigured] = useState(false)
  const [productName, setProductName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [affiliateLink, setAffiliateLink] = useState('')
  const [isAffiliate, setIsAffiliate] = useState(false)
  const [seedKeywords, setSeedKeywords] = useState('')
  const [competitorDomains, setCompetitorDomains] = useState('')
  const [articlesPerDay, setArticlesPerDay] = useState(10)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<{ success: boolean; message: string } | null>(null)

  /* Brand research (LLM-generated on Step 6 entry) */
  type BrandResearch = {
    brand_voice: string
    target_market_description: string
    brand_blurb: string
    seed_keywords: string[]
    competitor_domains: string[]
    default_author_name: string
  }
  const [research, setResearch] = useState<BrandResearch | null>(null)
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchError, setResearchError] = useState('')

  /* Requirements (checked once on mount) */
  const [requirements, setRequirements] = useState<RequirementItem[]>([])
  const [requirementsLoading, setRequirementsLoading] = useState(false)
  const [requirementsError, setRequirementsError] = useState('')

  useEffect(() => {
    ;(async () => {
      setRequirementsLoading(true)
      try {
        const res = await fetch('/api/setup/requirements')
        const json = await res.json()
        if (json?.success) setRequirements(json.requirements || [])
        else setRequirementsError(json?.error || 'Failed')
      } catch (e: any) {
        setRequirementsError(e?.message || 'Failed')
      } finally {
        setRequirementsLoading(false)
      }
    })()
  }, [])

  const missingRequirements = requirements.filter((r) => !r.present)

  /* Derived data */
  const category = categories.find((c) => c.id === categoryId)
  const niche = category?.subNiches.find((n) => n.id === nicheId)
  const audience = audienceOptions.find((a) => a.id === audienceId)
  const region = regionOptions.find((r) => r.id === regionId)
  const monetization = monetizationOptions.find((m) => m.id === monetizationId)

  const selectedBrand = brandSuggestions.find((b) => b.slug === brandSlug)
  const brandName = selectedBrand?.name || ''

  const generatedTargetMarket = useMemo(() => {
    if (!niche || !audience || !region) return ''
    const regionLabel = region.label === 'Global English' ? 'across global English markets' : `in ${region.label}`
    return `${niche.targetMarket}, primarily ${audience.label.toLowerCase()}, ${regionLabel}.`
  }, [niche, audience, region])

  const generatedVoice = useMemo(() => {
    if (!niche) return ''
    const toneMap: Record<string, string> = {
      affiliate: 'transparent with clear product-disclosure language',
      leadgen: 'conversion-aware with practical CTA language',
      ads: 'highly educational and reader-first',
      products: 'authority-building and trust-driven',
      hybrid: 'balanced across education and conversion',
    }
    return `${niche.voice}; ${toneMap[monetizationId] || toneMap.hybrid}.`
  }, [niche, monetizationId])

  /* ── Brand name generation via LLM ─────────────────────── */
  const generateBrandNames = async () => {
    if (!niche || !audience || !region || !monetization || !category) return
    setBrandLoading(true)
    setBrandError('')
    setBrandSlug('')
    try {
      const res = await fetch('/api/setup/brand-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.label,
          categoryLabel: category.label,
          audience: audience.label,
          region: region.label,
          monetization: monetization.label,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setBrandSuggestions(json.suggestions || [])
    } catch (e: any) {
      setBrandError(e?.message || 'Failed to generate brand names')
      setBrandSuggestions([])
    } finally {
      setBrandLoading(false)
    }
  }

  // Auto-generate brand names when entering Step 3
  useEffect(() => {
    if (step === 3 && brandSuggestions.length === 0 && !brandLoading) {
      generateBrandNames()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Domain search – auto-triggers on Step 4 entry ─────── */
  const searchDomains = async (slug: string) => {
    setDomainLoading(true)
    setDomainSearched(false)
    setSelectedDomain('')
    setAvailableDomains([])
    try {
      const res = await fetch(`/api/setup/domain-suggestions?base=${encodeURIComponent(slug)}&maxPrice=15`)
      const json = await res.json()
      const domains: DomainResult[] = json?.available || []
      setAvailableDomains(domains)
      if (domains.length > 0) setSelectedDomain(domains[0].domain)
    } catch {
      setAvailableDomains([])
    } finally {
      setDomainLoading(false)
      setDomainSearched(true)
    }
  }

  // Auto-search when step 4 is entered
  useEffect(() => {
    if (step === 4 && brandSlug && !domainSearched) {
      searchDomains(brandSlug)
    }
  }, [step, brandSlug, domainSearched]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Clone automation ──────────────────────────────────── */
  const runCloneAutomation = async () => {
    if (!niche || !selectedBrand || !audience || !region || !monetization) return
    setIsRunning(true)
    setResult(null)

    const emailDomain = selectedDomain || `${selectedBrand.slug}.com`
    const payload = {
      username: selectedBrand.slug,
      brandName: selectedBrand.name,
      domain: selectedDomain || `${selectedBrand.slug}.com`,
      email: `contact@${emailDomain}`,
      contactEmail: `contact@${emailDomain}`,
      privacyEmail: `privacy@${emailDomain}`,
      phone: '',
      tagline: niche.tagline,
      description: niche.description,
      footerTagline: niche.footerTagline,
      primaryColor: '#111827',
      accentColor: '#2563eb',
      outputBase,
      gaId: '',
      gtmId: '',
      _meta: {
        targetMarket: generatedTargetMarket,
        voice: generatedVoice,
        niche: niche.label,
        audience: audience.label,
        region: region.label,
        monetization: monetization.label,
      },
    }

    try {
      const res = await fetch('/api/setup/clone-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setResult({ success: Boolean(json.success), output: json.output || json.error || 'No output' })
    } catch (e: any) {
      setResult({ success: false, output: e?.message || 'Request failed' })
    } finally {
      setIsRunning(false)
    }
  }

  /* ── Run brand research via LLM when entering Step 6 ──── */
  const runBrandResearch = async () => {
    if (!niche || !selectedBrand) return
    setResearchLoading(true)
    setResearchError('')
    try {
      const res = await fetch('/api/setup/brand-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: selectedBrand.name,
          niche: niche.label,
          nicheDescription: niche.description,
          audience,
          region,
          monetization,
          categoryLabel: category?.label || '',
          domain: selectedDomain || '',
        }),
      })
      const json = await res.json()
      if (json.success && json.research) {
        setResearch(json.research)
        // Pre-fill fields from research
        if (json.research.seed_keywords?.length) {
          setSeedKeywords(json.research.seed_keywords.join(', '))
        }
        if (json.research.competitor_domains?.length) {
          setCompetitorDomains(json.research.competitor_domains.join(', '))
        }
      } else {
        setResearchError(json.error || 'Research failed')
      }
    } catch (e: any) {
      setResearchError(e?.message || 'Research request failed')
    } finally {
      setResearchLoading(false)
    }
  }

  // Trigger research when step 6 is entered (only once)
  useEffect(() => {
    if (step === 6 && !research && !researchLoading) {
      runBrandResearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  /* ── Launch content pipeline ────────────────────────────── */
  const launchPipeline = async () => {
    if (!niche || !selectedBrand || !audience || !region || !monetization) return
    setPipelineRunning(true)
    setPipelineResult(null)

    const blogUrl = `https://${selectedDomain}`
    const payload = {
      username: selectedBrand.slug,
      product: {
        name: productName || selectedBrand.name,
        url: productUrl || '',
        affiliate_link: affiliateLink || '',
        is_affiliate: isAffiliate,
        create_product_page: isAffiliate,
        niche_group: niche.id,
        additional_urls: [] as string[],
      },
      brand: {
        brand_blurb: research?.brand_blurb || niche.description,
        target_market_description: research?.target_market_description || generatedTargetMarket,
        brand_voice: research?.brand_voice || generatedVoice,
      },
      publishing: {
        blog_url: blogUrl,
        default_author: research?.default_author_name || selectedBrand.name,
        auto_create_categories: true,
      },
      config: {
        seed_keywords: seedKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        competitor_domains: competitorDomains
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
        articles_per_day: articlesPerDay,
        use_content_analysis: true,
        use_business_reviews: false,
        existing_content_check: true,
        skip_paa: false,
      },
      expand: false,
    }

    try {
      const res = await fetch('https://app.sewo.io/api/strategy/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 202 || res.ok) {
        setPipelineResult({ success: true, message: 'Pipeline launched. Content generation is running in the background. Monitor at app.sewo.io.' })
      } else {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || json?.message || `HTTP ${res.status}`)
      }
    } catch (e: any) {
      setPipelineResult({ success: false, message: e?.message || 'Failed to launch pipeline' })
    } finally {
      setPipelineRunning(false)
    }
  }

  /* Progress */
  const pct = ((step - 1) / 5) * 100

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={card}>
        {/* Progress bar */}
        <div style={progressBar(pct)}>
          <div style={progressFill(pct)} />
        </div>

        {/* ── STEP 1 : Pick category then sub-niche ────────── */}
        {step === 1 && (
          <>
            <p style={stepLabel}>Step 1 of 6</p>

            {!categoryId ? (
              <>
                <h2 style={heading}>What category is this blog in?</h2>
                <p style={subtext}>Pick the broad topic area first. You&apos;ll narrow it down next.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      style={{ ...optionCard(false), textAlign: 'center' as const, padding: '1.1rem 0.8rem' }}
                      onClick={() => { setCategoryId(c.id); setNicheId('') }}
                    >
                      <p style={{ fontSize: 28, margin: '0 0 6px' }}>{c.icon}</p>
                      <p style={{ ...optionTitle, fontSize: 14 }}>{c.label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={heading}>Pick a sub-niche in {category?.label}</h2>
                <p style={subtext}>This sets the default voice, audience, tagline, and starter content for the clone.</p>

                <div style={{ display: 'grid', gap: 10 }}>
                  {category?.subNiches.map((n) => (
                    <div key={n.id} style={optionCard(nicheId === n.id)} onClick={() => setNicheId(n.id)}>
                      <p style={optionTitle}>{n.label}</p>
                      <p style={optionHint}>{n.targetMarket}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                  <button style={btnSecondary} onClick={() => { setCategoryId(''); setNicheId('') }}>
                    Change category
                  </button>
                  <button style={btnPrimary(!nicheId)} disabled={!nicheId} onClick={() => setStep(2)}>
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STEP 2 : Audience / Region / Monetization ────── */}
        {step === 2 && (
          <>
            <p style={stepLabel}>Step 2 of 6</p>
            <h2 style={heading}>Who is the audience and how will it earn?</h2>
            <p style={subtext}>These shape the tone, content style, and CTA strategy.</p>

            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Audience</label>
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {audienceOptions.map((o) => (
                <div key={o.id} style={optionCard(audienceId === o.id)} onClick={() => setAudienceId(o.id)}>
                  <p style={optionTitle}>{o.label}</p>
                  {o.hint && <p style={optionHint}>{o.hint}</p>}
                </div>
              ))}
            </div>

            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Primary region</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {regionOptions.map((o) => (
                <div key={o.id} style={optionCard(regionId === o.id)} onClick={() => setRegionId(o.id)}>
                  <p style={optionTitle}>{o.label}</p>
                </div>
              ))}
            </div>

            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Monetization model</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {monetizationOptions.map((o) => (
                <div key={o.id} style={optionCard(monetizationId === o.id)} onClick={() => setMonetizationId(o.id)}>
                  <p style={optionTitle}>{o.label}</p>
                  {o.hint && <p style={optionHint}>{o.hint}</p>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(1)}>Back</button>
              <button
                style={btnPrimary(!audienceId || !regionId || !monetizationId)}
                disabled={!audienceId || !regionId || !monetizationId}
                onClick={() => setStep(3)}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3 : Brand direction (LLM-generated) ────── */}
        {step === 3 && niche && (
          <>
            <p style={stepLabel}>Step 3 of 6</p>
            <h2 style={heading}>Pick a brand direction</h2>
            <p style={subtext}>
              AI-generated brand name ideas for a <strong>{niche.label}</strong> blog. Pick the one you like — we&apos;ll find available domains for it next.
            </p>

            {brandLoading && (
              <div style={{ textAlign: 'center' as const, padding: '2.5rem 0' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Generating brand name ideas...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {brandError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
                <p style={{ color: '#991b1b', margin: 0, fontSize: 14 }}>{brandError}</p>
                <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 12 }}>
                  Make sure <code>GEMINI_API_KEY</code> is set in <code>.env.local</code> and restart the dev server.
                </p>
              </div>
            )}

            {!brandLoading && brandSuggestions.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {brandSuggestions.map((b) => (
                  <div key={b.slug} style={optionCard(brandSlug === b.slug)} onClick={() => setBrandSlug(b.slug)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={optionTitle}>{b.name}</p>
                        <p style={optionHint}>{b.reason}</p>
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, marginLeft: 12 }}>{b.slug}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'center' as const }}>
              <button
                onClick={() => { setBrandSuggestions([]); setBrandSlug(''); generateBrandNames() }}
                disabled={brandLoading}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: brandLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  color: '#475569',
                  fontSize: 14,
                }}
              >
                {brandLoading ? 'Generating...' : 'Generate new ideas'}
              </button>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(2)}>Back</button>
              <button
                style={btnPrimary(!brandSlug)}
                disabled={!brandSlug}
                onClick={() => { setDomainSearched(false); setAvailableDomains([]); setSelectedDomain(''); setStep(4) }}
              >
                Find available domains
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4 : Available domains (auto-searched) ──── */}
        {step === 4 && (
          <>
            <p style={stepLabel}>Step 4 of 6</p>
            <h2 style={heading}>Available domains for &ldquo;{brandName || brandSlug}&rdquo;</h2>
            <p style={subtext}>
              We searched for the exact name plus smart variations across multiple TLDs. Only available domains are shown.
            </p>

            {domainLoading && (
              <div style={{ textAlign: 'center' as const, padding: '2.5rem 0' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Checking domain availability for <strong>{brandSlug}</strong> and variations...</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '6px 0 0' }}>This checks 80+ domain combinations</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {domainSearched && !domainLoading && (
              <>
                {availableDomains.length === 0 ? (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
                    <p style={{ color: '#92400e', margin: 0, fontSize: 14 }}>
                      No available domains under $15/yr found for &ldquo;{brandSlug}&rdquo;. Try going back and picking a different brand direction.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {availableDomains.map((d) => (
                      <div
                        key={d.domain}
                        style={optionCard(selectedDomain === d.domain)}
                        onClick={() => setSelectedDomain(d.domain)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={optionTitle}>{d.domain}</p>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>~${d.estimatedAnnualCost}/yr</span>
                        </div>
                      </div>
                    ))}
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      All results under $15/yr. Prices are estimates — final cost confirmed at registrar.
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => { setDomainSearched(false); setStep(3) }}>
                Back to brand names
              </button>
              <button
                style={btnPrimary(!selectedDomain || domainLoading)}
                disabled={!selectedDomain || domainLoading}
                onClick={() => setStep(5)}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── STEP 5 : Review & Run ──────────────────────── */}
        {step === 5 && niche && selectedBrand && audience && region && monetization && (
          <>
            <p style={stepLabel}>Step 5 of 6</p>
            <h2 style={heading}>Review and launch</h2>
            <p style={subtext}>Everything below will be used to create and configure the new blog clone.</p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              {[
                ['Brand name', selectedBrand.name],
                ['Niche', niche.label],
                ['Domain', selectedDomain],
                ['Target market', generatedTargetMarket],
                ['Voice', generatedVoice],
                ['Audience', audience.label],
                ['Region', region.label],
                ['Monetization', monetization.label],
                ['Tagline', niche.tagline],
                ['Contact email', `contact@${selectedDomain}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ fontWeight: 600, minWidth: 140, color: '#475569', fontSize: 14 }}>{label}</span>
                  <span style={{ color: '#0f172a', fontSize: 14 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Requirements check */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 14 }}>Automation requirements</strong>
                {requirementsLoading && <span style={{ fontSize: 12, color: '#64748b' }}>Checking...</span>}
              </div>
              {requirementsError ? (
                <p style={{ color: '#b91c1c', fontSize: 13, margin: 0 }}>{requirementsError}</p>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {requirements.map((item) => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                      <span>{item.label}</span>
                      <strong style={{ color: item.present ? '#166534' : '#b45309' }}>
                        {item.present ? 'Ready' : 'Missing'}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
              {missingRequirements.length > 0 && (
                <p style={{ marginTop: 8, color: '#b45309', fontSize: 12, marginBottom: 0 }}>
                  Add missing keys to <code>.env.local</code>, restart the dev server, and reload this page.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(4)}>Back</button>
              <button
                style={btnPrimary(isRunning || missingRequirements.length > 0 || !selectedDomain)}
                disabled={isRunning || missingRequirements.length > 0 || !selectedDomain}
                onClick={runCloneAutomation}
              >
                {isRunning ? 'Creating clone...' : 'Create Blog Clone'}
              </button>
            </div>

            {result && (
              <div
                style={{
                  marginTop: 16,
                  padding: '1rem',
                  borderRadius: 10,
                  border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
                  background: result.success ? '#f0fdf4' : '#fef2f2',
                }}
              >
                <strong style={{ color: result.success ? '#166534' : '#991b1b' }}>
                  {result.success ? 'Clone created successfully' : 'Clone failed'}
                </strong>
                <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 12 }}>{result.output}</pre>
                {result.success && (
                  <button
                    style={{ ...btnPrimary(false), marginTop: 12 }}
                    onClick={() => setStep(6)}
                  >
                    Continue to content setup
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 6 : Post-clone — domain + product + pipeline ── */}
        {step === 6 && niche && selectedBrand && (
          <>
            <p style={stepLabel}>Step 6 of 6</p>
            <h2 style={heading}>Domain, product &amp; content pipeline</h2>
            <p style={subtext}>
              Complete the checklist below, review the AI-researched brand profile, then launch the content pipeline.
            </p>

            {/* ─ Brand research results (LLM-generated) ─ */}
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '1.25rem', border: '1px solid #bfdbfe', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1e40af' }}>AI-researched brand profile</h3>
                {research && !researchLoading && (
                  <button
                    style={{ ...btnSecondary, padding: '4px 14px', fontSize: 12 }}
                    onClick={() => { setResearch(null); runBrandResearch() }}
                  >
                    Re-research
                  </button>
                )}
              </div>

              {researchLoading && (
                <div style={{ textAlign: 'center' as const, padding: '2rem 0', color: '#475569' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Researching your niche...</p>
                  <p style={{ fontSize: 13 }}>Gemini is analysing the {niche.label} market to generate brand voice, target market, keywords, and competitors.</p>
                </div>
              )}

              {researchError && !researchLoading && (
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: '0.8rem', border: '1px solid #fca5a5', marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#991b1b' }}>Research failed: {researchError}</p>
                  <button
                    style={{ ...btnSecondary, marginTop: 8, padding: '4px 14px', fontSize: 12 }}
                    onClick={() => { setResearch(null); runBrandResearch() }}
                  >
                    Retry research
                  </button>
                </div>
              )}

              {research && !researchLoading && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Brand voice</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{research.brand_voice}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Target market</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{research.target_market_description}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Brand description</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{research.brand_blurb}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Author</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>{research.default_author_name}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Seed keywords (researched)</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                        {research.seed_keywords.map((kw: string) => (
                          <span key={kw} style={{ background: '#dbeafe', color: '#1e40af', fontSize: 12, padding: '2px 8px', borderRadius: 12 }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>Competitors (researched)</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                        {research.competitor_domains.map((d: string) => (
                          <span key={d} style={{ background: '#dbeafe', color: '#1e40af', fontSize: 12, padding: '2px 8px', borderRadius: 12 }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Domain checklist */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Domain setup</h3>

              <div style={{ background: '#fff', borderRadius: 8, padding: '0.9rem', border: '1px solid #e2e8f0', marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14 }}>Vercel DNS records</p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>Add these to your domain registrar for <strong>{selectedDomain}</strong>:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: '4px 16px', fontSize: 13, fontFamily: 'monospace', background: '#f1f5f9', borderRadius: 6, padding: '10px 12px', marginTop: 8 }}>
                  <span style={{ fontWeight: 600 }}>Type</span>
                  <span style={{ fontWeight: 600 }}>Name</span>
                  <span style={{ fontWeight: 600 }}>Value</span>
                  <span>A</span><span>@</span><span>76.76.21.21</span>
                  <span>CNAME</span><span>www</span><span>cname.vercel-dns.com</span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.7rem 0', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                <input type="checkbox" checked={domainPurchased} onChange={(e) => setDomainPurchased(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2563eb' }} />
                <span style={{ fontSize: 14 }}>I have purchased <strong>{selectedDomain}</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.7rem 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={dnsConfigured} onChange={(e) => setDnsConfigured(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2563eb' }} />
                <span style={{ fontSize: 14 }}>I have added the DNS records above to my domain registrar</span>
              </label>
            </div>

            {/* Product info */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Product / offer details</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                If you have a product or affiliate offer, add it here. Leave blank if content-only for now.
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Product name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={selectedBrand.name}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Product URL</label>
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' as const }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAffiliate} onChange={(e) => setIsAffiliate(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2563eb' }} />
                  <span style={{ fontSize: 14 }}>This is an affiliate product</span>
                </label>

                {isAffiliate && (
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Affiliate tracking link</label>
                    <input
                      type="url"
                      value={affiliateLink}
                      onChange={(e) => setAffiliateLink(e.target.value)}
                      placeholder="https://product.com?ref=yourcode"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' as const }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content config – pre-filled from research */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Content pipeline config</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                Pre-filled from AI research. Edit if you want to override.
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Seed keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={seedKeywords}
                    onChange={(e) => setSeedKeywords(e.target.value)}
                    placeholder={researchLoading ? 'Researching...' : `e.g. ${niche.label.toLowerCase()}`}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Competitor domains (comma-separated)</label>
                  <input
                    type="text"
                    value={competitorDomains}
                    onChange={(e) => setCompetitorDomains(e.target.value)}
                    placeholder={researchLoading ? 'Researching...' : 'competitor1.com, competitor2.com'}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Articles per day</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[5, 10, 15, 20].map((n) => (
                      <div
                        key={n}
                        style={optionCard(articlesPerDay === n)}
                        onClick={() => setArticlesPerDay(n)}
                      >
                        <p style={{ ...optionTitle, fontSize: 14, textAlign: 'center' as const }}>{n}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary of auto-populated info */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '1rem', border: '1px solid #86efac', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#166534' }}>Pipeline payload summary</h3>
              <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                {[
                  ['Brand', selectedBrand.name],
                  ['Username', selectedBrand.slug],
                  ['Blog URL', `https://${selectedDomain}`],
                  ['Author', research?.default_author_name || selectedBrand.name],
                  ['Niche group', niche.id],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 110, color: '#166534' }}>{label}</span>
                    <span style={{ color: '#334155' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch button */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(5)}>Back</button>
              <button
                style={btnPrimary(pipelineRunning || !domainPurchased || !dnsConfigured || researchLoading)}
                disabled={pipelineRunning || !domainPurchased || !dnsConfigured || researchLoading}
                onClick={launchPipeline}
              >
                {pipelineRunning ? 'Launching pipeline...' : researchLoading ? 'Waiting for research...' : 'Launch Content Pipeline'}
              </button>
            </div>
            {!domainPurchased && (
              <p style={{ marginTop: 8, fontSize: 13, color: '#b45309' }}>
                Confirm domain purchase and DNS setup before launching the pipeline.
              </p>
            )}

            {pipelineResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: '1rem',
                  borderRadius: 10,
                  border: `1px solid ${pipelineResult.success ? '#86efac' : '#fca5a5'}`,
                  background: pipelineResult.success ? '#f0fdf4' : '#fef2f2',
                }}
              >
                <strong style={{ color: pipelineResult.success ? '#166534' : '#991b1b' }}>
                  {pipelineResult.success ? 'Pipeline launched' : 'Pipeline failed'}
                </strong>
                <p style={{ marginTop: 6, fontSize: 13, color: '#334155' }}>{pipelineResult.message}</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

