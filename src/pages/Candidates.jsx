import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Candidates.css'

export function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCandidates() {
      const { data, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, name, email, linkedin_url, cv_url, notes, created_at')
        .order('created_at', { ascending: false })

      if (candidatesError) {
        setError(candidatesError.message)
      } else {
        setCandidates(data)
      }

      setLoading(false)
    }

    loadCandidates()
  }, [])

  return (
    <main className="candidates-page">
      <header className="candidates-header">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Candidates</h1>
          <p className="candidates-intro">
            Review candidate details and open their professional documents.
          </p>
        </div>

        <Link to="/">Dashboard</Link>
      </header>

      {loading ? <p className="candidates-message">Loading candidates...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!loading && !error && candidates.length === 0 ? (
        <section className="candidates-empty">
          <h2>No candidates yet</h2>
          <p>Candidate profiles will appear here after they are added.</p>
        </section>
      ) : null}

      {candidates.length > 0 ? (
        <section className="candidates-list" aria-label="Candidates">
          {candidates.map((candidate) => (
            <article className="candidate-item" key={candidate.id}>
              <div className="candidate-avatar" aria-hidden="true">
                {candidate.name.charAt(0).toUpperCase()}
              </div>

              <div className="candidate-details">
                <h2>{candidate.name}</h2>
                <a className="candidate-email" href={`mailto:${candidate.email}`}>
                  {candidate.email}
                </a>
                {candidate.notes ? <p>{candidate.notes}</p> : null}
              </div>

              <div className="candidate-links">
                {candidate.linkedin_url ? (
                  <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                ) : null}

                {candidate.cv_url ? (
                  <a href={candidate.cv_url} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
