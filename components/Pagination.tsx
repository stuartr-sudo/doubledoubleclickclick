import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  if (!pages.includes(total)) {
    pages.push(total)
  }

  return pages
}

function pageUrl(baseUrl: string, page: number): string {
  if (page === 1) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}page=${page}`
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  const boxStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    textDecoration: 'none',
    borderRadius: '2px',
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '24px 0',
      }}
    >
      {pages.map((page, i) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${i}`}
              style={{
                ...boxStyle,
                color: 'var(--color-text-muted)',
              }}
            >
              ...
            </span>
          )
        }

        const isActive = page === currentPage

        if (isActive) {
          return (
            <span
              key={page}
              style={{
                ...boxStyle,
                backgroundColor: '#1a1a1a',
                color: '#fff',
              }}
            >
              {page}
            </span>
          )
        }

        return (
          <Link
            key={page}
            href={pageUrl(baseUrl, page)}
            style={{
              ...boxStyle,
              color: 'var(--color-text)',
            }}
          >
            {page}
          </Link>
        )
      })}

      {currentPage < totalPages && (
        <Link
          href={pageUrl(baseUrl, currentPage + 1)}
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'var(--color-text)',
            textDecoration: 'none',
            marginLeft: '8px',
          }}
        >
          Next →
        </Link>
      )}
    </nav>
  )
}
