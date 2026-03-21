import { createServiceClient } from '@/lib/supabase/service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const KEY_PREFIX = 'dc_live_'

export function generateApiKey(): { key: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('base64url')
  const key = `${KEY_PREFIX}${random}`
  const prefix = key.substring(0, 12)
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

export async function createApiKeyRecord(clientName: string, contactEmail: string): Promise<{ key: string; id: string }> {
  const { key, prefix } = generateApiKey()
  const hash = await hashApiKey(key)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('client_api_keys')
    .insert({
      client_name: clientName,
      contact_email: contactEmail,
      api_key_hash: hash,
      key_prefix: prefix,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create API key: ${error.message}`)
  return { key, id: data.id }
}

export async function validateApiKey(bearerToken: string): Promise<{ valid: boolean; keyRecord?: { id: string; client_name: string; contact_email: string } }> {
  if (!bearerToken || !bearerToken.startsWith(KEY_PREFIX)) {
    return { valid: false }
  }

  const prefix = bearerToken.substring(0, 12)
  const supabase = createServiceClient()

  const { data: keys, error } = await supabase
    .from('client_api_keys')
    .select('id, client_name, contact_email, api_key_hash')
    .eq('key_prefix', prefix)
    .is('revoked_at', null)

  if (error || !keys || keys.length === 0) {
    return { valid: false }
  }

  for (const keyRecord of keys) {
    const match = await bcrypt.compare(bearerToken, keyRecord.api_key_hash)
    if (match) {
      return {
        valid: true,
        keyRecord: {
          id: keyRecord.id,
          client_name: keyRecord.client_name,
          contact_email: keyRecord.contact_email,
        },
      }
    }
  }

  return { valid: false }
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('client_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)

  if (error) throw new Error(`Failed to revoke API key: ${error.message}`)
}
