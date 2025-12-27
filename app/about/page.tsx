import Link from 'next/link'
import Image from 'next/image'
import SiteHeader from '@/components/SiteHeader'

const authors = [
  {
    name: 'Stuart Asta',
    role: 'Founder & CEO',
    bio: 'Expert in LLM ranking optimization and AI search strategy. Passionate about helping brands get discovered by AI assistants.',
    linkedin: 'https://www.linkedin.com/in/stuartasta/',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    slug: 'stuart-asta'
  },
  {
    name: 'Sarah Chen',
    role: 'Head of AI Research',
    bio: 'Specializing in prompt engineering and semantic search. Sarah leads our research into how different LLMs prioritize information.',
    linkedin: 'https://www.linkedin.com/in/sarahchen/',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop'
  },
  {
    name: 'Michael Ross',
    role: 'Content Strategy Lead',
    bio: 'Bridging the gap between traditional SEO and AI-native content optimization. Michael ensures our clients\' content is AI-ready.',
    linkedin: 'https://www.linkedin.com/in/michaelross/',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop'
  }
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="about-hero">
          <div className="container">
            <h1 className="about-title">About SEWO</h1>
            <p className="about-subtitle">
              We help brands navigate the new era of AI-powered search.
            </p>
          </div>
        </section>

        <section className="about-content">
          <div className="container">
            <div className="about-text-grid">
              <div className="about-text-main">
                <h2>Our Mission</h2>
                <p>
                  In a world where consumers increasingly turn to AI assistants like ChatGPT, Claude, and Gemini for answers, being &quot;found&quot; has a new meaning. Traditional SEO is no longer enough.
                </p>
                <p>
                  At SEWO, our mission is to ensure your brand is the answer AI suggests. We leverage deep research into LLM behavior and semantic search to optimize your visibility where it matters most.
                </p>
              </div>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">LLM</span>
                  <span className="stat-label">Ranking Experts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">AI</span>
                  <span className="stat-label">Search Pioneers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="authors-section">
          <div className="container">
            <h2 className="section-title">Meet Our Authors</h2>
            <p className="section-description">
              The experts behind our insights and strategies.
            </p>
            
            <div className="authors-grid">
              {authors.map((author, index) => (
                <div key={index} className="author-card">
                  <div className="author-image">
                    <Image 
                      src={author.image} 
                      alt={author.name} 
                      width={400} 
                      height={250} 
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                  <div className="author-info">
                    <h3 className="author-name">
                      {author.slug ? (
                        <Link href={`/author/${author.slug}`}>{author.name}</Link>
                      ) : (
                        author.name
                      )}
                    </h3>
                    <p className="author-role">{author.role}</p>
                    <p className="author-bio">{author.bio}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <a 
                        href={author.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="linkedin-link"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </a>
                      {author.slug && (
                        <Link href={`/author/${author.slug}`} className="linkedin-link" style={{ color: 'var(--color-primary)' }}>
                          View Profile →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
