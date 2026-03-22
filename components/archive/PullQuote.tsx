interface PullQuoteProps {
  quote: string
  attribution?: string
}

export default function PullQuote({ quote, attribution }: PullQuoteProps) {
  return (
    <blockquote
      style={{
        borderLeft: '3px solid #1a1a1a',
        margin: '24px 0',
        padding: '12px 0 12px 20px',
      }}
    >
      <p
        style={{
          fontSize: '16px',
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          lineHeight: 1.6,
          color: 'var(--color-text)',
          margin: 0,
        }}
      >
        {quote}
      </p>
      {attribution && (
        <footer
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-muted)',
            marginTop: '8px',
          }}
        >
          — {attribution}
        </footer>
      )}
    </blockquote>
  )
}
