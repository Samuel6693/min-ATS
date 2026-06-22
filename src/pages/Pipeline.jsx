import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Pipeline.css'

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

export function Pipeline() {
  const [applications, setApplications] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPipeline() {
      const [applicationsResult, candidatesResult, jobsResult] =
        await Promise.all([
          supabase
            .from('applications')
            .select('id, candidate_id, job_id, stage, created_at'),
          supabase
            .from('candidates')
            .select('id, name, email, notes'),
          supabase
            .from('jobs')
            .select('id, title'),
        ])

      const loadError =
        applicationsResult.error ||
        candidatesResult.error ||
        jobsResult.error

      if (loadError) {
        setError(loadError.message)
      } else {
        setApplications(applicationsResult.data)
        setCandidates(candidatesResult.data)
        setJobs(jobsResult.data)
      }

      setLoading(false)
    }

    loadPipeline()
  }, [])

  function getCandidate(candidateId) {
    return candidates.find((candidate) => candidate.id === candidateId)
  }

  function getJob(jobId) {
    return jobs.find((job) => job.id === jobId)
  }

  function getStageApplications(stage) {
    return applications.filter((application) => application.stage === stage)
  }

  return (
    <main className="pipeline-page">
      <header className="pipeline-header">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Pipeline</h1>
        </div>

        <Link to="/">Dashboard</Link>
      </header>

      {loading ? <p>Loading pipeline...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!loading && !error ? (
        <section className="pipeline-board" aria-label="Candidate pipeline">
          {STAGES.map((stage) => {
            const stageApplications = getStageApplications(stage.value)

            return (
              <section
                className={`pipeline-column pipeline-column--${stage.value}`}
                key={stage.value}
              >
                <header className="pipeline-column-header">
                  <h2>{stage.label}</h2>
                  <span>{stageApplications.length}</span>
                </header>

                <div className="pipeline-cards">
                  {stageApplications.length === 0 ? (
                    <p className="pipeline-empty">No candidates</p>
                  ) : null}

                  {stageApplications.map((application) => {
                    const candidate = getCandidate(application.candidate_id)
                    const job = getJob(application.job_id)

                    return (
                      <article className="pipeline-card" key={application.id}>
                        <div className="pipeline-card-heading">
                          <span aria-hidden="true">
                            {candidate?.name?.charAt(0).toUpperCase() ?? '?'}
                          </span>
                          <h3>{candidate?.name ?? 'Unknown candidate'}</h3>
                        </div>

                        <p className="pipeline-job">
                          {job?.title ?? 'Unknown job'}
                        </p>

                        {candidate?.email ? (
                          <a href={`mailto:${candidate.email}`}>
                            {candidate.email}
                          </a>
                        ) : null}

                        {candidate?.notes ? (
                          <p className="pipeline-note">{candidate.notes}</p>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </section>
      ) : null}
    </main>
  )
}
