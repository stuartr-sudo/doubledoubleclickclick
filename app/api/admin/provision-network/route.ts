import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface NetworkMember {
  username: string
  display_name: string
  niche: string
  domain?: string
  role: 'seed' | 'satellite'
  contact_email: string
  purchase_domain?: boolean
  domain_yearly_price?: { currencyCode: string; units: string; nanos?: number }
  domain_notices?: string[]
}

/**
 * POST /api/admin/provision-network
 *
 * Orchestrates parallel provisioning of an entire site network.
 * Creates DB records, then calls POST /api/provision for each member in parallel.
 * Each site gets network_partners context so DC can enable cross-linking.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      network_name,
      seed_niche,
      members,
      fly_region = 'syd',
      setup_google_analytics = false,
      setup_google_tag_manager = false,
      setup_search_console = false,
    } = body as {
      network_name: string
      seed_niche: string
      members: NetworkMember[]
      fly_region?: string
      setup_google_analytics?: boolean
      setup_google_tag_manager?: boolean
      setup_search_console?: boolean
    }

    if (!network_name?.trim()) {
      return NextResponse.json({ success: false, error: 'network_name is required' }, { status: 400 })
    }
    if (!seed_niche?.trim()) {
      return NextResponse.json({ success: false, error: 'seed_niche is required' }, { status: 400 })
    }
    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ success: false, error: 'members array is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const provisionSecret = process.env.PROVISION_SECRET

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
    }
    if (!provisionSecret) {
      return NextResponse.json({ success: false, error: 'PROVISION_SECRET not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // 1. Create network record
    const { data: network, error: networkErr } = await supabase
      .from('site_networks')
      .insert({
        name: network_name.trim(),
        seed_niche: seed_niche.trim(),
      })
      .select()
      .single()

    if (networkErr || !network) {
      return NextResponse.json(
        { success: false, error: `Failed to create network: ${networkErr?.message}` },
        { status: 500 }
      )
    }

    // 2. Insert member records
    const memberRecords = members.map((m) => ({
      network_id: network.id,
      username: m.username,
      display_name: m.display_name,
      niche: m.niche,
      domain: m.domain || null,
      role: m.role || 'satellite',
      provision_status: 'pending',
    }))

    const { error: membersErr } = await supabase
      .from('site_network_members')
      .insert(memberRecords)

    if (membersErr) {
      return NextResponse.json(
        { success: false, error: `Failed to create members: ${membersErr.message}` },
        { status: 500 }
      )
    }

    // 3. Build network_partners for each site (all OTHER members)
    const buildPartnersFor = (currentUsername: string) =>
      members
        .filter((m) => m.username !== currentUsername)
        .map((m) => ({
          domain: m.domain || `${m.username}-blog.fly.dev`,
          niche: m.niche,
          display_name: m.display_name,
        }))

    // 4. Provision each site in parallel via internal HTTP call
    const baseUrl = req.nextUrl.origin
    const results = await Promise.allSettled(
      members.map(async (member) => {
        // Mark as provisioning
        await supabase
          .from('site_network_members')
          .update({ provision_status: 'provisioning' })
          .eq('network_id', network.id)
          .eq('username', member.username)

        const provisionPayload = {
          username: member.username,
          display_name: member.display_name,
          contact_email: member.contact_email,
          niche: member.niche,
          domain: member.domain || undefined,
          fly_region,
          setup_google_analytics,
          setup_google_tag_manager,
          setup_search_console,
          purchase_domain: member.purchase_domain || false,
          domain_yearly_price: member.domain_yearly_price,
          domain_notices: member.domain_notices,
          network_partners: buildPartnersFor(member.username),
        }

        const res = await fetch(`${baseUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provisionSecret}`,
          },
          body: JSON.stringify(provisionPayload),
        })

        const data = await res.json()

        // Update member status
        await supabase
          .from('site_network_members')
          .update({
            provision_status: data.success ? 'done' : 'failed',
            provision_result: data,
          })
          .eq('network_id', network.id)
          .eq('username', member.username)

        return { username: member.username, ...data }
      })
    )

    // 5. Summarise results
    const summary = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return { username: members[i].username, success: r.value.success, status: r.value.success ? 'done' : 'failed' }
      }
      return { username: members[i].username, success: false, status: 'failed', error: r.reason?.message }
    })

    return NextResponse.json({
      success: true,
      network_id: network.id,
      network_name: network.name,
      members: summary,
    })
  } catch (err: any) {
    console.error('provision-network error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/admin/provision-network?network_id=...
 *
 * Returns the status of all members in a network.
 */
export async function GET(req: NextRequest) {
  try {
    const networkId = req.nextUrl.searchParams.get('network_id')
    if (!networkId) {
      return NextResponse.json({ success: false, error: 'network_id is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const { data: network } = await supabase
      .from('site_networks')
      .select('*')
      .eq('id', networkId)
      .single()

    if (!network) {
      return NextResponse.json({ success: false, error: 'Network not found' }, { status: 404 })
    }

    const { data: members } = await supabase
      .from('site_network_members')
      .select('*')
      .eq('network_id', networkId)
      .order('created_date', { ascending: true })

    return NextResponse.json({
      success: true,
      network,
      members: members || [],
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
