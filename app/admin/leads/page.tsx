import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AdminProtected } from '@/components/AdminProtected'

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
  topic: string | null
  created_at: string
}

async function LeadsAdminPageInner() {
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
            <div className="admin-toolbar">
              <Link href="/admin" className="btn btn-secondary">
                Blog Admin
              </Link>
              <Link href="/admin/homepage" className="btn btn-secondary">
                Edit Homepage
              </Link>
              <Link href="/" className="btn btn-secondary">
                View Site
              </Link>
            </div>
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
          <>
            {/* Desktop Table View */}
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
                    <th>Topic</th>
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
                      <td>{lead.plan_type || '-'}</td>
                      <td>{lead.name}</td>
                      <td>{lead.email}</td>
                      <td>{lead.company || '-'}</td>
                      <td>{lead.website || '-'}</td>
                      <td>{lead.topic || '-'}</td>
                      <td>
                        <pre className="leads-message">{lead.message || '-'}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="leads-cards-wrapper">
              {leads.map((lead) => (
                <div key={lead.id} className="lead-card">
                  <div className="lead-card-header">
                    <div className="lead-card-date">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {lead.plan_type && (
                      <span className="lead-card-badge">{lead.plan_type}</span>
                    )}
                  </div>
                  <div className="lead-card-body">
                    <div className="lead-card-field">
                      <span className="lead-card-label">Name:</span>
                      <span className="lead-card-value">{lead.name}</span>
                    </div>
                    <div className="lead-card-field">
                      <span className="lead-card-label">Email:</span>
                      <a href={`mailto:${lead.email}`} className="lead-card-value lead-card-link">
                        {lead.email}
                      </a>
                    </div>
                    {lead.company && (
                      <div className="lead-card-field">
                        <span className="lead-card-label">Company:</span>
                        <span className="lead-card-value">{lead.company}</span>
                      </div>
                    )}
                    {lead.website && (
                      <div className="lead-card-field">
                        <span className="lead-card-label">Website:</span>
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lead-card-value lead-card-link"
                        >
                          {lead.website}
                        </a>
                      </div>
                    )}
                    {lead.topic && (
                      <div className="lead-card-field">
                        <span className="lead-card-label">Topic:</span>
                        <span className="lead-card-value">{lead.topic}</span>
                      </div>
                    )}
                    {lead.message && (
                      <div className="lead-card-field lead-card-field--full">
                        <span className="lead-card-label">Details:</span>
                        <pre className="leads-message leads-message--card">{lead.message}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default async function LeadsAdminPage() {
  return (
    <AdminProtected>
      {await LeadsAdminPageInner()}
    </AdminProtected>
  )
}


