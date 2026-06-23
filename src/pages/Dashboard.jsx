import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useWorkspace } from '../workspace/workspaceContext'
import './Dashboard.css'

export function Dashboard() {
  const { profile, role, signOut } = useAuth()
  const {
    customers,
    selectedCustomer,
    selectedCustomerId,
    workspaceCustomerId,
    selectCustomer,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace()
  const [stats, setStats] = useState({
    openJobs: 0,
    candidates: 0,
    activeApplications: 0,
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadStats() {
      if (!workspaceCustomerId) {
        setStats({ openJobs: 0, candidates: 0, activeApplications: 0 })
        setStatsError('')
        setStatsLoading(false)
        return
      }

      setStatsLoading(true)
      setStatsError('')

      const [jobsResult, candidatesResult, applicationsResult] =
        await Promise.all([
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', workspaceCustomerId)
            .eq('status', 'open'),
          supabase
            .from('candidates')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', workspaceCustomerId),
          supabase
            .from('applications')
            .select('stage')
            .eq('customer_id', workspaceCustomerId),
        ])

      if (ignore) return

      const loadError =
        jobsResult.error || candidatesResult.error || applicationsResult.error

      if (loadError) {
        setStatsError(loadError.message)
      } else {
        const activeApplications = applicationsResult.data.filter(
          (application) =>
            application.stage !== 'hired' && application.stage !== 'rejected',
        ).length

        setStats({
          openJobs: jobsResult.count ?? 0,
          candidates: candidatesResult.count ?? 0,
          activeApplications,
        })
      }

      setStatsLoading(false)
    }

    loadStats()

    return () => {
      ignore = true
    }
  }, [workspaceCustomerId])

  const workspaceName = selectedCustomer
    ? selectedCustomer.full_name || selectedCustomer.email
    : profile?.full_name || 'Your'

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark">ATS</span>
          <div>
            <strong>Mini ATS</strong>
            <span>Recruiting workspace</span>
          </div>
        </div>

        <nav>
          <a href="#dashboard" aria-current="page">Dashboard</a>
          <Link to="/jobs">Jobs</Link>
          <Link to="/candidates">Candidates</Link>
          <Link to="/pipeline">Pipeline</Link>
          {role === 'admin' ? <Link to="/admin">Admin</Link> : null}
        </nav>

        {role === 'admin' ? (
          <div className="workspace-switcher">
            <label htmlFor="customer-workspace">Customer workspace</label>
            <select
              id="customer-workspace"
              value={selectedCustomerId ?? ''}
              onChange={(event) => selectCustomer(event.target.value)}
              disabled={workspaceLoading}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name || customer.email}
                </option>
              ))}
            </select>
            {workspaceError ? <p>{workspaceError}</p> : null}
          </div>
        ) : null}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {selectedCustomer
                ? `${selectedCustomer.full_name || selectedCustomer.email} workspace`
                : role
                  ? `${role} workspace`
                  : 'Workspace'}
            </p>
            <h1>{workspaceName} recruitment overview</h1>
          </div>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </header>

        {!workspaceCustomerId ? (
          <p className="dashboard-notice">
            Select a customer workspace to view its recruitment overview.
          </p>
        ) : null}
        {statsError ? <p className="form-error">{statsError}</p> : null}

        <section className="summary-grid" aria-label="Recruitment overview">
          <article>
            <span>{statsLoading ? '-' : stats.openJobs}</span>
            <p>Open jobs</p>
          </article>
          <article>
            <span>{statsLoading ? '-' : stats.candidates}</span>
            <p>Candidates</p>
          </article>
          <article>
            <span>{statsLoading ? '-' : stats.activeApplications}</span>
            <p>Active applications</p>
          </article>
        </section>

        <section className="panel" id="dashboard">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h2>
            <p>
              Review the current hiring activity, then continue where attention
              is needed.
            </p>
          </div>

          <nav className="dashboard-actions" aria-label="Workspace actions">
            <Link to="/jobs">Manage jobs</Link>
            <Link to="/candidates">Manage candidates</Link>
            <Link to="/pipeline">Open pipeline</Link>
          </nav>
        </section>
      </section>
    </main>
  )
}
