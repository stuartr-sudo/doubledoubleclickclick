import Image from 'next/image'

interface AffiliateBoxProps {
  name: string
  description: string
  rating: number
  reviewCount: number
  price: string
  imageUrl: string
  dealUrl: string
}

function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= Math.round(rating) ? '#daa520' : 'var(--color-border)',
          fontSize: '11px',
        }}
      >
        ★
      </span>
    )
  }
  return <span style={{ display: 'inline-flex', gap: '1px' }}>{stars}</span>
}

export default function AffiliateBox({
  name,
  description,
  rating,
  reviewCount,
  price,
  imageUrl,
  dealUrl,
}: AffiliateBoxProps) {
  return (
    <>
      <div
        className="affiliate-box"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-article)',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: '8px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--color-accent)',
            marginBottom: '10px',
          }}
        >
          Editor&apos;s Pick
        </div>

        {/* Desktop layout */}
        <div
          className="affiliate-box-inner"
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: '14px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                margin: '0 0 4px',
                color: 'var(--color-text)',
              }}
            >
              {name}
            </h4>
            <p
              style={{
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'var(--color-text-secondary)',
                margin: '0 0 6px',
              }}
            >
              {description}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <StarRating rating={rating} />
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)',
                }}
              >
                ({reviewCount.toLocaleString()} reviews)
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="70px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              {price}
            </span>
            <a
              href={dealUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                fontSize: '9px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backgroundColor: 'var(--color-footer-bg)',
                color: '#fff',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              VIEW DEAL →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .affiliate-box-inner {
            flex-direction: row !important;
          }
          .affiliate-box-inner > div:last-child {
            flex-direction: column !important;
          }
          .affiliate-box-inner > div:last-child > div:first-child {
            width: 60px !important;
            height: 60px !important;
          }
        }
      `}</style>
    </>
  )
}
