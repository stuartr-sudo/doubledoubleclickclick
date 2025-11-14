import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface LeadCapture {
  id: string
  name: string
  email: string
  company: string | null
  website: string | null
  message: string | null
  plan_type: string | null
  source: string | null
  created_at: string
}

export default async function LeadsAdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_captures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const leads = (data || []) as LeadCapture[]

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div className="admin-container">
          <div className="admin-header-content">
            <h1>Lead Captures</h1>
          </div>
        </div>
      </div>

      <div className="admin-container">
        {error && (
          <div className="empty-state">
            <p>Failed to load leads. Check Supabase configuration.</p>
          </div>
        )}

        {!error && leads.length === 0 && (
          <div className="empty-state">
            <p>No leads captured yet.</p>
          </div>
        )}

        {!error && leads.length > 0 && (
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Website</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </td>
                    <td>{lead.plan_type || '—'}</td>
                    <td>{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.company || '—'}</td>
                    <td>{lead.website || '—'}</td>
                    <td>
                      <pre className="leads-message">{lead.message || '—'}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}


