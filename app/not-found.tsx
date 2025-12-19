import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'Sorry, the page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main>
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginBottom: '2rem' }}>
          Page not found
        </p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </main>
  )
}

