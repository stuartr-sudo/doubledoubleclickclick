import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for SEWO - Learn how we handle your data.',
  alternates: {
    canonical: 'https://www.sewo.io/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '56px 24px 64px',
        backgroundColor: '#020617',
        color: '#e5e7eb',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            marginBottom: '16px',
            fontWeight: 700,
            color: '#f9fafb',
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            marginBottom: '24px',
            fontSize: '0.98rem',
            lineHeight: 1.7,
            color: 'rgba(148, 163, 184, 0.9)',
          }}
        >
          We respect your privacy and only use your information to operate and improve SEWO&apos;s
          services. This page summarises how we handle data collected through this site.
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#f9fafb',
            }}
          >
            What we collect
          </h2>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.7 }}>
            When you contact us or submit a form, we may collect your name, email address, company,
            website and any other details you choose to share. We also collect basic analytics to
            understand how the site is used.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#f9fafb',
            }}
          >
            How we use your information
          </h2>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.7 }}>
            We use the information you provide to respond to enquiries, deliver agreed services and
            maintain our relationship with you. We do not sell your personal data.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#f9fafb',
            }}
          >
            Storage & third parties
          </h2>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.7 }}>
            Data is stored securely using our infrastructure providers (including Supabase and
            hosting providers). Where we use third‑party tools, we only share the minimum data
            required for them to perform their function.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#f9fafb',
            }}
          >
            Contact
          </h2>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.7 }}>
            If you have any questions about this policy or how your data is handled, please contact
            us at <a href="mailto:hello@sewo.io">hello@sewo.io</a>.
          </p>
        </section>
      </div>
    </main>
  )
}


