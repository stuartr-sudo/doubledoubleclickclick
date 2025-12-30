'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface Post {
  id: string
  title: string
  slug: string | null
  meta_description: string | null
  featured_image: string | null
  created_date: string
  published_date?: string
  is_popular?: boolean
}

interface HomePageNewProps {
  latestPosts: Post[]
}

export default function HomePageNew({ latestPosts }: HomePageNewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="homepage-new">
      {/* Minimal Header: Logo + CTA only */}
      <header className="minimal-header">
        <div className="minimal-header-container">
          <Link href="/" className="minimal-logo">
            SEWO
          </Link>
          <Link href="#diagnostic" className="minimal-header-cta">
            Request Diagnostic
          </Link>
        </div>
      </header>

      <main>
        {/* SECTION 1 — HERO (Above the Fold) */}
        <section className="hero-new">
          <div className="hero-new-container">
            <div className="hero-new-grid">
              {/* Left Column (Primary Message) */}
              <div className="hero-new-left">
                <h1 className="hero-new-h1">
                  Make Your Brand the Answer AI Suggests
                </h1>
                <p className="hero-new-subheading">
                  AI is rewriting how customers discover brands.<br />
                  If it does not recommend you, you are losing ground every day.
                </p>
                <p className="hero-new-body">
                  We help brand owners understand why AI systems are not surfacing them and give them a clear plan to fix it.
                </p>
                <div className="hero-new-cta-block">
                  <Link href="#diagnostic" className="primary-cta-button">
                    Request an AI Visibility Diagnostic
                  </Link>
                  <p className="cta-subtext">One-off diagnostic · No retainers · No fluff</p>
                </div>
              </div>

              {/* Right Column (Context / Trust) */}
              <div className="hero-new-right">
                <ul className="trust-list">
                  <li>✔ Search + AI clarity (not AI SEO)</li>
                  <li>✔ Plain-English explanation</li>
                  <li>✔ Written report + 90-day roadmap</li>
                  <li>✔ For ecommerce, SaaS &amp; established coaches</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — CONTEXT SHIFT (Full Width) */}
        <section className="context-shift">
          <div className="context-shift-container">
            <h2 className="context-shift-h2">Search has changed. Discovery has changed.</h2>
            <p className="context-shift-p">
              Customers are no longer just Googling.<br />
              They are asking AI tools like ChatGPT what to buy, who to trust, and which brands to choose.<br />
              <br />
              AI does not rank pages — it recommends answers.
            </p>
          </div>
        </section>

        {/* SECTION 3 — THE PROBLEM (Two-Column) */}
        <section className="the-problem">
          <div className="the-problem-container">
            <div className="the-problem-grid">
              {/* Left Column — Pain Points */}
              <div className="problem-left">
                <h3>What most businesses are experiencing</h3>
                <ul>
                  <li>Publishing content, but results feel random</li>
                  <li>SEO advice feels generic or outdated</li>
                  <li>AI SEO sounds important, but unclear</li>
                  <li>Hearing about ChatGPT leads with no idea how</li>
                </ul>
              </div>

              {/* Right Column — Truth / Reframe */}
              <div className="problem-right">
                <h3>Why this is happening</h3>
                <p>
                  AI systems surface brands that are easy to understand, clearly relevant, and consistently trusted.
                  <br /><br />
                  Most websites do not signal that — even if their SEO looks fine.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — WHAT THIS IS / ISN'T (Contrast Section) */}
        <section className="contrast-section">
          <div className="contrast-container">
            <div className="contrast-grid">
              {/* Left Card — This IS */}
              <div className="contrast-card contrast-is">
                <h3>This IS</h3>
                <ul>
                  <li>A clarity-first AI visibility diagnostic</li>
                  <li>Focused on how AI & search systems interpret your business</li>
                  <li>Designed to stop guesswork</li>
                  <li>Built for decision-makers</li>
                </ul>
              </div>

              {/* Right Card — This is NOT */}
              <div className="contrast-card contrast-not">
                <h3>This is NOT</h3>
                <ul>
                  <li>An SEO retainer</li>
                  <li>A done-for-you service</li>
                  <li>A ranking guarantee</li>
                  <li>A generic audit full of jargon</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — THE OFFER (Core Section) */}
        <section className="the-offer" id="diagnostic">
          <div className="the-offer-container">
            <h2>AI Visibility Diagnostic</h2>
            <p className="offer-subheading">1-hour call + written report + 90-day roadmap</p>
            <p className="offer-intro">
              A one-time engagement designed to answer one question:
            </p>
            <blockquote className="offer-quote">
              Why is not our business being surfaced or recommended by AI — and what should we do next?
            </blockquote>

            {/* Deliverables */}
            <div className="deliverables">
              <div className="deliverable-item">
                <div className="deliverable-number">1</div>
                <div className="deliverable-content">
                  <h4>Pre-call review</h4>
                  <ul>
                    <li>Website & content</li>
                    <li>How AI + search interpret your brand</li>
                    <li>Where relevance or trust breaks down</li>
                  </ul>
                </div>
              </div>

              <div className="deliverable-item">
                <div className="deliverable-number">2</div>
                <div className="deliverable-content">
                  <h4>60-minute private Zoom</h4>
                  <ul>
                    <li>Plain-English explanation</li>
                    <li>What AI sees vs expectations</li>
                    <li>Why competitors get mentioned</li>
                    <li>Live prioritisation</li>
                  </ul>
                </div>
              </div>

              <div className="deliverable-item">
                <div className="deliverable-number">3</div>
                <div className="deliverable-content">
                  <h4>Written diagnostic report</h4>
                  <ul>
                    <li>Summary of issues</li>
                    <li>Visibility blockers</li>
                    <li>What to stop doing</li>
                    <li>What matters next</li>
                  </ul>
                </div>
              </div>

              <div className="deliverable-item">
                <div className="deliverable-number">4</div>
                <div className="deliverable-content">
                  <h4>90-day action roadmap</h4>
                  <ul>
                    <li>Now / Next / Later</li>
                    <li>Clear priorities</li>
                    <li>Executable without you</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 — WHO IT'S FOR (Audience Fit) */}
        <section className="audience-fit">
          <div className="audience-fit-container">
            <div className="audience-fit-grid">
              {/* Left — Good Fit */}
              <div className="fit-card good-fit">
                <h3>Good Fit</h3>
                <ul>
                  <li>Ecommerce brands</li>
                  <li>SaaS companies</li>
                  <li>Established coaches / educators</li>
                  <li>Already publishing content</li>
                  <li>Want clarity, not noise</li>
                </ul>
              </div>

              {/* Right — Not a Fit */}
              <div className="fit-card not-fit">
                <h3>Not a Fit</h3>
                <ul>
                  <li>Want guarantees</li>
                  <li>Want implementation</li>
                  <li>Want shortcuts</li>
                  <li>Are not ready to act</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — WHY NOW (Urgency Without Panic) */}
        <section className="why-now">
          <div className="why-now-container">
            <h2>AI is already shaping buying decisions</h2>
            <p>
              People ask AI what to buy and who to trust.<br />
              If your brand is not part of the answer, someone else is.
            </p>
          </div>
        </section>

        {/* SECTION 8 — PRICING (Simple, Calm) */}
        <section className="pricing-simple">
          <div className="pricing-simple-container">
            <div className="pricing-card-simple">
              <div className="price-amount">$997 USD</div>
              <div className="price-details">
                <p>One-time · No upsells · No obligation</p>
              </div>
              <p className="price-value">
                You are paying for clarity, prioritisation, and a plan you can execute.
              </p>
            </div>
          </div>
        </section>

        {/* BLOG SECTION — Latest from the blog */}
        {latestPosts && latestPosts.length > 0 && (
          <section className="blog-grid-section">
            <div className="blog-grid-container">
              <div className="blog-grid-header">
                <h2 className="blog-grid-title">Latest from the blog</h2>
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

        {/* SECTION 9 — FINAL CTA */}
        <section className="final-cta">
          <div className="final-cta-container">
            <Link href="#diagnostic" className="primary-cta-button">
              Request an AI Visibility Diagnostic
            </Link>
            <p className="final-cta-reassurance">
              Most clients arrive confused — and leave with clarity.
            </p>
          </div>
        </section>

        {/* SECTION 10 — FOOTER (Minimal Authority) */}
        <footer className="minimal-footer">
          <div className="minimal-footer-container">
            <p>Working at the intersection of AI, search, and content systems.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
