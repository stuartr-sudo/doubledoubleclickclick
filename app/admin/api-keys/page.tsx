import { createServiceClient } from '@/lib/supabase/service'
import ApiKeyManager from './ApiKeyManager'
import type { Metadata } from 'next'
import type { ClientApiKey } from '@/lib/draft-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'API Key Management',
  robots: 'noindex, nofollow',
}

export default async function AdminApiKeysPage() {
  const supabase = createServiceClient()
  const { data: keys } = await supabase
    .from('client_api_keys')
    .select('id, client_name, contact_email, key_prefix, created_at, revoked_at')
    .order('created_at', { ascending: false })

  return <ApiKeyManager initialKeys={(keys as ClientApiKey[]) || []} />
}
