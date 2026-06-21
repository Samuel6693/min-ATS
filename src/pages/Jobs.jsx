import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Jobs.css'

export function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadJobs() {
      const { data, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, description, status, created_at')
        .order('created_at', { ascending: false })

      if (jobsError) {
        setError(jobsError.message)
      } else {
        setJobs(data)
      }

      setLoading(false)
    }

    loadJobs()
  }, [])

  return (
    <main className="jobs-page">
      <header className="jobs-header">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Jobs</h1>
        </div>

        <Link to="/">Dashboard</Link>
      </header>

      {loading ? <p>Loading jobs...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!loading && !error && jobs.length === 0 ? (
        <p>No jobs created yet.</p>
      ) : null}

      <section className="jobs-list">
        {jobs.map((job) => (
          <article className="job-item" key={job.id}>
            <div>
              <h2>{job.title}</h2>
              <p>{job.description || 'No description.'}</p>
            </div>

            <span className={`job-status job-status--${job.status}`}>
              {job.status}
            </span>
          </article>
        ))}
      </section>
    </main>
  )
}