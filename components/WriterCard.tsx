import Image from 'next/image'

interface WriterCardProps {
  name: string
  role?: string
  bio?: string
  imageUrl?: string
}

export default function WriterCard({ name, role, bio, imageUrl }: WriterCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: imageUrl ? 'transparent' : '#ccc',
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={52}
            height={52}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : null}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.3,
          }}
        >
          {name}
        </div>
        {role && (
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              color: 'var(--color-accent)',
              marginTop: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {role}
          </div>
        )}
        {bio && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              margin: '6px 0 0',
            }}
          >
            {bio}
          </p>
        )}
      </div>
    </div>
  )
}
