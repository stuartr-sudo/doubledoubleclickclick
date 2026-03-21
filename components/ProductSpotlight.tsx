import Image from 'next/image'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  product_url: string
  category?: string
  price?: string
  is_affiliate?: boolean
}

async function getSpotlightProducts(): Promise<Product[]> {
  const config = getTenantConfig()
  if (!config.username) return []

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('promoted_products')
    .select('id, name, description, image_url, product_url, category, price, is_affiliate')
    .eq('user_name', config.username)
    .eq('status', 'active')
    .order('discovery_score', { ascending: false })
    .limit(2)

  return (data || []) as Product[]
}

export default async function ProductSpotlight() {
  const products = await getSpotlightProducts()
  if (products.length === 0) return null

  return (
    <div style={{ marginTop: '16px' }}>
      {products.map((product, i) => (
        <a
          key={product.id}
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{
            display: 'block',
            padding: '12px',
            marginBottom: i < products.length - 1 ? '10px' : '0',
            background: 'var(--color-bg-warm)',
            border: '1px solid var(--color-border-light)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* Sponsor label */}
          <span
            style={{
              fontSize: '7px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            {product.is_affiliate ? 'Partner Pick' : 'Recommended'}
          </span>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {product.image_url && (
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: '4px',
                  background: '#fff',
                }}
              >
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="48px"
                  style={{ objectFit: 'contain', padding: '2px' }}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  margin: '0 0 3px',
                  color: 'var(--color-text)',
                }}
              >
                {product.name}
              </h4>

              {product.description && (
                <p
                  style={{
                    fontSize: '9px',
                    lineHeight: 1.4,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {product.description}
                </p>
              )}

              {product.price && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                    marginTop: '3px',
                    display: 'block',
                  }}
                >
                  {product.price}
                </span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
