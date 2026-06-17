import './App.css'

function App() {
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
          <a href="#jobs">Jobs</a>
          <a href="#candidates">Candidates</a>
          <a href="#pipeline">Pipeline</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Setup in progress</p>
            <h1>Build the hiring flow from a clean base.</h1>
          </div>
          <button type="button">Sign in</button>
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
            <p className="eyebrow">Next implementation step</p>
            <h2>Auth, roles, and protected routes</h2>
            <p>
              The first real feature pass will connect Supabase Auth, load a
              user profile, and route customers and admins into the right views.
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

export default App
