import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useWorkspace } from '../workspace/workspaceContext'
import './Dashboard.css'

export function Dashboard() {
  const { profile, role, signOut } = useAuth()
  const {
    customers,
    selectedCustomer,
    selectedCustomerId,
    selectCustomer,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace()

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
            <h1>Build the hiring flow from a clean base.</h1>
          </div>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </header>

        <section className="summary-grid" aria-label="Project status">
          <article>
            <span>1</span>
            <p>Supabase project connected</p>
          </article>
          <article>
            <span>4</span>
            <p>Core tables prepared</p>
          </article>
          <article>
            <span>0</span>
            <p>Demo candidates loaded</p>
          </article>
        </section>

        <section className="panel" id="dashboard">
          <div>
            <p className="eyebrow">Signed in</p>
            <h2>
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h2>
            <p>
              Your account is connected. Next we will build the jobs,
              candidates, and pipeline screens.
            </p>
          </div>

          <ul>
            <li>Customer login</li>
            <li>Admin/customer profile roles</li>
            <li>Route guards for private screens</li>
          </ul>
        </section>
      </section>
    </main>
  )
}
