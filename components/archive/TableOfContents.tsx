'use client'

import { useEffect, useState, useRef } from 'react'

interface TableOfContentsProps {
  htmlContent: string
}

interface HeadingItem {
  id: string
  text: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractH2s(html: string): HeadingItem[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const headings: HeadingItem[] = []
  let match

  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim()
    if (text) {
      headings.push({
        id: slugify(text),
        text,
      })
    }
  }

  return headings
}

export default function TableOfContents({ htmlContent }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const items = extractH2s(htmlContent)
    setHeadings(items)
  }, [htmlContent])

  useEffect(() => {
    if (headings.length === 0) return

    // Add IDs to headings in the DOM
    const h2Elements = document.querySelectorAll('.article-body-content h2')
    h2Elements.forEach((el) => {
      const text = el.textContent?.trim() || ''
      const id = slugify(text)
      el.setAttribute('id', id)
    })

    // IntersectionObserver for scroll tracking
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    )

    h2Elements.forEach((el) => {
      observerRef.current?.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [headings])

  if (headings.length === 0) return null

  const linkList = (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            onClick={() => setIsExpanded(false)}
            style={{
              display: 'block',
              padding: '8px 0',
              borderBottom: '1px solid var(--color-border-light)',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.4,
              textDecoration: 'none',
              fontWeight: activeId === h.id ? 700 : 400,
              color:
                activeId === h.id
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              transition: 'color 0.2s ease',
            }}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav
        className="toc-desktop"
        style={{
          position: 'sticky',
          top: '80px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--color-text)',
            marginBottom: '4px',
          }}
        >
          In This Article
        </div>
        {linkList}
      </nav>

      {/* Mobile: collapsible box */}
      <div className="toc-mobile">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-warm)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text)',
          }}
        >
          <span>In This Article</span>
          <span
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </span>
        </button>
        {isExpanded && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-bg-warm)',
              borderLeft: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {linkList}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 769px) {
          .toc-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .toc-desktop { display: none !important; }
        }
      `}</style>
    </>
  )
}
