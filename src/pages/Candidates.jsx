import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Candidates.css'

export function Candidates() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    notes: '',
  })
  const [cvFile, setCvFile] = useState(null)
  const [saving, setSaving] = useState(false)
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

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setSaving(true)
    setError('')

    if (!cvFile || cvFile.type !== 'application/pdf') {
      setError('Choose a PDF file for the candidate CV.')
      setSaving(false)
      return
    }

    if (cvFile.size > 10 * 1024 * 1024) {
      setError('The CV must be smaller than 10 MB.')
      setSaving(false)
      return
    }

    const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const cvPath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`
    const { error: uploadError } = await supabase.storage
      .from('candidate-cvs')
      .upload(cvPath, cvFile, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      setError(uploadError.message)
      setSaving(false)
      return
    }

    const { data, error: createError } = await supabase
      .from('candidates')
      .insert({
        customer_id: user.id,
        name: form.name,
        email: form.email,
        linkedin_url: form.linkedin_url || null,
        cv_url: cvPath,
        notes: form.notes || null,
      })
      .select('id, name, email, linkedin_url, cv_url, notes, created_at')
      .single()

    if (createError) {
      await supabase.storage.from('candidate-cvs').remove([cvPath])
      setError(createError.message)
    } else {
      setCandidates((current) => [data, ...current])
      setForm({
        name: '',
        email: '',
        linkedin_url: '',
        notes: '',
      })
      setCvFile(null)
      formElement.reset()
    }

    setSaving(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleOpenCv(cvPath) {
    setError('')

    if (cvPath.startsWith('http://') || cvPath.startsWith('https://')) {
      window.open(cvPath, '_blank', 'noopener,noreferrer')
      return
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from('candidate-cvs')
      .createSignedUrl(cvPath, 60)

    if (signedUrlError) {
      setError(signedUrlError.message)
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

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

      <div className="candidates-layout">
        <div className="candidates-content">
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
                      <button type="button" onClick={() => handleOpenCv(candidate.cv_url)}>
                        View CV
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          ) : null}
        </div>

        <aside className="candidate-form-panel">
          <form className="candidate-form" onSubmit={handleSubmit}>
            <h2>Add candidate</h2>

            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              LinkedIn URL
              <input
                type="url"
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
              />
            </label>

            <label>
              CV (PDF)
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setCvFile(event.target.files[0] ?? null)}
                required
              />
              <span className="candidate-file-help">Maximum file size: 10 MB</span>
            </label>

            <label>
              Notes
              <textarea name="notes" value={form.notes} onChange={handleChange} />
            </label>

            <button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add candidate'}
            </button>
          </form>
        </aside>
      </div>
    </main>
  )
}
