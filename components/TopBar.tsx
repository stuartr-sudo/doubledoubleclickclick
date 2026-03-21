import Link from 'next/link'

export default function TopBar() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      style={{
        background: 'var(--color-bg-warm)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px var(--space-lg)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span>{today}</span>
        <Link
          href="/newsletter"
          style={{
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          Subscribe to our newsletter &rarr;
        </Link>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .topbar-hide { display: none !important; }
        }
      `}</style>
    </div>
  )
}
