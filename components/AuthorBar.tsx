import Image from 'next/image'

interface AuthorBarProps {
  name: string
  imageUrl?: string
  date: string
  readTime?: string
  avatarSize?: number
}

export default function AuthorBar({
  name,
  imageUrl,
  date,
  readTime,
  avatarSize = 20,
}: AuthorBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        lineHeight: 1.4,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={avatarSize}
          height={avatarSize}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <span
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            backgroundColor: 'var(--color-border)',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ fontWeight: 600, color: 'var(--color-text-body)' }}>{name}</span>
      <span style={{ color: 'var(--color-text-faint)' }}>{date}</span>
      {readTime && (
        <>
          <span style={{ color: 'var(--color-text-faint)' }}>·</span>
          <span style={{ color: 'var(--color-text-faint)' }}>{readTime}</span>
        </>
      )}
    </div>
  )
}
