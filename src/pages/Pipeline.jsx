import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useWorkspace } from '../workspace/workspaceContext'
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
  const { role } = useAuth()
  const { workspaceCustomerId, selectedCustomer } = useWorkspace()
  const [applications, setApplications] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [movingApplication, setMovingApplication] = useState(null)
  const [draggingApplication, setDraggingApplication] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [jobFilter, setJobFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPipeline() {
      if (!workspaceCustomerId) {
        setApplications([])
        setCandidates([])
        setJobs([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [applicationsResult, candidatesResult, jobsResult] =
        await Promise.all([
          supabase
            .from('applications')
            .select('id, candidate_id, job_id, stage, created_at')
            .eq('customer_id', workspaceCustomerId),
          supabase
            .from('candidates')
            .select('id, name, email, notes')
            .eq('customer_id', workspaceCustomerId),
          supabase
            .from('jobs')
            .select('id, title')
            .eq('customer_id', workspaceCustomerId),
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
  }, [workspaceCustomerId])

  function getCandidate(candidateId) {
    return candidates.find((candidate) => candidate.id === candidateId)
  }

  function getJob(jobId) {
    return jobs.find((job) => job.id === jobId)
  }

  function getFilteredApplications() {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return applications.filter(
      (application) =>
        (jobFilter === 'all' || application.job_id === jobFilter) &&
        (!normalizedSearch ||
          getCandidate(application.candidate_id)
            ?.name.toLowerCase()
            .includes(normalizedSearch)),
    )
  }

  function getStageApplications(stage) {
    return getFilteredApplications().filter(
      (application) => application.stage === stage,
    )
  }

  async function updateApplicationStage(application, stage) {
    if (application.stage === stage) return

    const previousStage = application.stage
    setMovingApplication(application.id)
    setError('')
    setApplications((current) =>
      current.map((item) =>
        item.id === application.id ? { ...item, stage } : item,
      ),
    )

    const { data, error: moveError } = await supabase
      .from('applications')
      .update({
        stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id)
      .eq('customer_id', workspaceCustomerId)
      .select('id, candidate_id, job_id, stage, created_at')
      .single()

    if (moveError) {
      setError(moveError.message)
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? { ...item, stage: previousStage } : item,
        ),
      )
    } else {
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? data : item)),
      )
    }

    setMovingApplication(null)
  }

  function moveApplication(application, direction) {
    const currentIndex = STAGES.findIndex(
      (stage) => stage.value === application.stage,
    )
    const nextStage = STAGES[currentIndex + direction]

    if (nextStage) {
      updateApplicationStage(application, nextStage.value)
    }
  }

  function handleDragStart(event, application) {
    setDraggingApplication(application)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', application.id)
  }

  function handleDragOver(event, stage) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  function handleDrop(event, stage) {
    event.preventDefault()

    if (draggingApplication) {
      updateApplicationStage(draggingApplication, stage)
    }

    setDraggingApplication(null)
    setDragOverStage(null)
  }

  function handleDragEnd() {
    setDraggingApplication(null)
    setDragOverStage(null)
  }

  return (
    <main className="pipeline-page">
      <header className="pipeline-header">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Pipeline</h1>
          {role === 'admin' && selectedCustomer ? (
            <p>Acting as {selectedCustomer.full_name || selectedCustomer.email}</p>
          ) : null}
        </div>

        <Link to="/">Dashboard</Link>
      </header>

      {loading ? <p>Loading pipeline...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {!workspaceCustomerId ? (
        <p className="form-error">
          Select a customer workspace from the dashboard first.
        </p>
      ) : null}

      {!loading && !error && workspaceCustomerId ? (
        <>
          <section className="pipeline-toolbar" aria-label="Pipeline filters">
            <div className="pipeline-filters">
              <label>
                Job
                <select
                  value={jobFilter}
                  onChange={(event) => setJobFilter(event.target.value)}
                >
                  <option value="all">All jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Candidate
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name"
                />
              </label>
            </div>

            <p>
              {getFilteredApplications().length} applications
            </p>
          </section>

          <section className="pipeline-board" aria-label="Candidate pipeline">
            {STAGES.map((stage) => {
              const stageApplications = getStageApplications(stage.value)

              return (
                <section
                  className={`pipeline-column pipeline-column--${stage.value}${
                    dragOverStage === stage.value ? ' pipeline-column--drop' : ''
                  }`}
                  key={stage.value}
                  onDragOver={(event) => handleDragOver(event, stage.value)}
                  onDrop={(event) => handleDrop(event, stage.value)}
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
                      <article
                        className={`pipeline-card${
                          draggingApplication?.id === application.id
                            ? ' pipeline-card--dragging'
                            : ''
                        }`}
                        key={application.id}
                        draggable={movingApplication !== application.id}
                        onDragStart={(event) => handleDragStart(event, application)}
                        onDragEnd={handleDragEnd}
                        title="Drag to another stage"
                      >
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

                        <div className="pipeline-card-actions">
                          <button
                            type="button"
                            onClick={() => moveApplication(application, -1)}
                            disabled={
                              application.stage === STAGES[0].value ||
                              movingApplication === application.id
                            }
                            aria-label={`Move ${candidate?.name ?? 'candidate'} back`}
                            title="Move to previous stage"
                          >
                            &larr;
                          </button>

                          <span>
                            {movingApplication === application.id
                              ? 'Moving...'
                              : stage.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => moveApplication(application, 1)}
                            disabled={
                              application.stage === STAGES.at(-1).value ||
                              movingApplication === application.id
                            }
                            aria-label={`Move ${candidate?.name ?? 'candidate'} forward`}
                            title="Move to next stage"
                          >
                            &rarr;
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
                </section>
              )
            })}
          </section>
        </>
      ) : null}
    </main>
  )
}
