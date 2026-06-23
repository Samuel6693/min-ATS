import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useWorkspace } from '../workspace/workspaceContext'
import './Candidates.css'

const APPLICATION_STAGES = [
  'new',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
]

export function Candidates() {
  const { role, session } = useAuth()
  const { workspaceCustomerId, selectedCustomer } = useWorkspace()
  const [form, setForm] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    notes: '',
  })
  const [cvFile, setCvFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedJobs, setSelectedJobs] = useState({})
  const [connectingCandidate, setConnectingCandidate] = useState(null)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    notes: '',
  })
  const [candidateAction, setCandidateAction] = useState(null)
  const [assessments, setAssessments] = useState({})
  const [assessmentErrors, setAssessmentErrors] = useState({})
  const [assessingApplication, setAssessingApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCandidates() {
      if (!workspaceCustomerId) {
        setCandidates([])
        setJobs([])
        setApplications([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [candidatesResult, jobsResult, applicationsResult] =
        await Promise.all([
          supabase
            .from('candidates')
            .select('id, name, email, linkedin_url, cv_url, notes, created_at')
            .eq('customer_id', workspaceCustomerId)
            .order('created_at', { ascending: false }),
          supabase
            .from('jobs')
            .select('id, title, description')
            .eq('customer_id', workspaceCustomerId)
            .eq('status', 'open')
            .order('title'),
          supabase
            .from('applications')
            .select('id, candidate_id, job_id, stage')
            .eq('customer_id', workspaceCustomerId),
        ])

      const loadError =
        candidatesResult.error || jobsResult.error || applicationsResult.error

      if (loadError) {
        setError(loadError.message)
      } else {
        setCandidates(candidatesResult.data)
        setJobs(jobsResult.data)
        setApplications(applicationsResult.data)
      }

      setLoading(false)
    }

    loadCandidates()
  }, [workspaceCustomerId])

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
    const cvPath = `${workspaceCustomerId}/${crypto.randomUUID()}-${safeFileName}`
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
        customer_id: workspaceCustomerId,
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

  async function handleConnect(candidateId) {
    const jobId = selectedJobs[candidateId]

    if (!jobId) {
      setError('Choose a job first.')
      return
    }

    setConnectingCandidate(candidateId)
    setError('')

    const { data, error: connectionError } = await supabase
      .from('applications')
      .insert({
        customer_id: workspaceCustomerId,
        candidate_id: candidateId,
        job_id: jobId,
        stage: 'new',
      })
      .select('id, candidate_id, job_id, stage')
      .single()

    if (connectionError) {
      setError(connectionError.message)
    } else {
      setApplications((current) => [...current, data])
      setSelectedJobs((current) => ({
        ...current,
        [candidateId]: '',
      }))
    }

    setConnectingCandidate(null)
  }

  function getCandidateApplications(candidateId) {
    return applications.filter(
      (application) => application.candidate_id === candidateId,
    )
  }

  function getAvailableJobs(candidateId) {
    const connectedJobIds = getCandidateApplications(candidateId).map(
      (application) => application.job_id,
    )

    return jobs.filter((job) => !connectedJobIds.includes(job.id))
  }

  function getJobTitle(jobId) {
    return jobs.find((job) => job.id === jobId)?.title ?? 'Unknown job'
  }

  async function handleAssessCandidate(candidate, application) {
    setAssessingApplication(application.id)
    setAssessmentErrors((current) => ({
      ...current,
      [application.id]: '',
    }))

    const response = await fetch('/api/assess-cv', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: candidate.id,
        jobId: application.job_id,
        customerId: workspaceCustomerId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setAssessmentErrors((current) => ({
        ...current,
        [application.id]: result.error || 'CV assessment failed',
      }))
    } else {
      setAssessments((current) => ({
        ...current,
        [application.id]: result.assessment,
      }))
    }

    setAssessingApplication(null)
  }

  function startEditing(candidate) {
    setEditingCandidate(candidate.id)
    setEditForm({
      name: candidate.name,
      email: candidate.email,
      linkedin_url: candidate.linkedin_url ?? '',
      notes: candidate.notes ?? '',
    })
    setError('')
  }

  function cancelEditing() {
    setEditingCandidate(null)
  }

  function handleEditChange(event) {
    const { name, value } = event.target

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleUpdateCandidate(event, candidateId) {
    event.preventDefault()
    setCandidateAction(`update-${candidateId}`)
    setError('')

    const { data, error: updateError } = await supabase
      .from('candidates')
      .update({
        name: editForm.name,
        email: editForm.email,
        linkedin_url: editForm.linkedin_url || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId)
      .eq('customer_id', workspaceCustomerId)
      .select('id, name, email, linkedin_url, cv_url, notes, created_at')
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === candidateId ? data : candidate,
        ),
      )
      setEditingCandidate(null)
    }

    setCandidateAction(null)
  }

  async function handleDisconnect(applicationId) {
    const confirmed = window.confirm(
      'Remove this candidate from the job?',
    )

    if (!confirmed) return

    setCandidateAction(`disconnect-${applicationId}`)
    setError('')

    const { error: disconnectError } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('customer_id', workspaceCustomerId)

    if (disconnectError) {
      setError(disconnectError.message)
    } else {
      setApplications((current) =>
        current.filter(
          (application) => application.id !== applicationId,
        ),
      )
    }

    setCandidateAction(null)
  }

  async function handleDeleteCandidate(candidate) {
    const confirmed = window.confirm(
      `Delete ${candidate.name} and all job connections?`,
    )

    if (!confirmed) return

    setCandidateAction(`delete-${candidate.id}`)
    setError('')

    const { error: applicationsError } = await supabase
      .from('applications')
      .delete()
      .eq('candidate_id', candidate.id)
      .eq('customer_id', workspaceCustomerId)

    if (applicationsError) {
      setError(applicationsError.message)
      setCandidateAction(null)
      return
    }

    const { error: candidateError } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidate.id)
      .eq('customer_id', workspaceCustomerId)

    if (candidateError) {
      setError(candidateError.message)
      setCandidateAction(null)
      return
    }

    if (
      candidate.cv_url &&
      !candidate.cv_url.startsWith('http://') &&
      !candidate.cv_url.startsWith('https://')
    ) {
      const { error: storageError } = await supabase.storage
        .from('candidate-cvs')
        .remove([candidate.cv_url])

      if (storageError) {
        setError(`Candidate deleted, but CV cleanup failed: ${storageError.message}`)
      }
    }

    setCandidates((current) =>
      current.filter((item) => item.id !== candidate.id),
    )
    setApplications((current) =>
      current.filter(
        (application) => application.candidate_id !== candidate.id,
      ),
    )
    setEditingCandidate(null)
    setCandidateAction(null)
  }

  async function handleStageChange(applicationId, stage) {
    setCandidateAction(`stage-${applicationId}`)
    setError('')

    const { data, error: stageError } = await supabase
      .from('applications')
      .update({
        stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('customer_id', workspaceCustomerId)
      .select('id, candidate_id, job_id, stage')
      .single()

    if (stageError) {
      setError(stageError.message)
    } else {
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? data : application,
        ),
      )
    }

    setCandidateAction(null)
  }

  return (
    <main className="candidates-page">
      <header className="candidates-header">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Candidates</h1>
          {role === 'admin' && selectedCustomer ? (
            <p>Acting as {selectedCustomer.full_name || selectedCustomer.email}</p>
          ) : null}
          <p className="candidates-intro">
            Review candidate details and open their professional documents.
          </p>
        </div>

        <Link to="/">Dashboard</Link>
      </header>

      {loading ? <p className="candidates-message">Loading candidates...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {!workspaceCustomerId ? (
        <p className="form-error">
          Select a customer workspace from the dashboard first.
        </p>
      ) : null}

      <div
        className={`candidates-layout${
          workspaceCustomerId ? '' : ' candidates-layout--single'
        }`}
      >
        <div className="candidates-content">
          {!loading && !error && workspaceCustomerId && candidates.length === 0 ? (
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
                    <button
                      type="button"
                      className="candidate-edit-button"
                      onClick={() => startEditing(candidate)}
                      disabled={candidateAction !== null}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="candidate-delete-button"
                      onClick={() => handleDeleteCandidate(candidate)}
                      disabled={candidateAction !== null}
                    >
                      {candidateAction === `delete-${candidate.id}`
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                  {editingCandidate === candidate.id ? (
                    <form
                      className="candidate-edit-form"
                      onSubmit={(event) =>
                        handleUpdateCandidate(event, candidate.id)
                      }
                    >
                      <label>
                        Name
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          required
                        />
                      </label>

                      <label>
                        Email
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                          required
                        />
                      </label>

                      <label>
                        LinkedIn URL
                        <input
                          type="url"
                          name="linkedin_url"
                          value={editForm.linkedin_url}
                          onChange={handleEditChange}
                        />
                      </label>

                      <label>
                        Notes
                        <textarea
                          name="notes"
                          value={editForm.notes}
                          onChange={handleEditChange}
                        />
                      </label>

                      <div className="candidate-edit-actions">
                        <button
                          type="submit"
                          disabled={candidateAction === `update-${candidate.id}`}
                        >
                          {candidateAction === `update-${candidate.id}`
                            ? 'Saving...'
                            : 'Save'}
                        </button>

                        <button type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <div className="candidate-applications">
                    <h3>Connected jobs</h3>

                    {getCandidateApplications(candidate.id).length === 0 ? (
                      <p>Not connected to a job yet.</p>
                    ) : (
                      <ul>
                        {getCandidateApplications(candidate.id).map((application) => (
                          <li key={application.id}>
                            <div className="candidate-application-info">
                              <span>{getJobTitle(application.job_id)}</span>
                              <select
                                className={`candidate-stage candidate-stage--${application.stage}`}
                                value={application.stage}
                                onChange={(event) =>
                                  handleStageChange(application.id, event.target.value)
                                }
                                disabled={candidateAction === `stage-${application.id}`}
                                aria-label={`Stage for ${getJobTitle(application.job_id)}`}
                              >
                                {APPLICATION_STAGES.map((stage) => (
                                  <option key={stage} value={stage}>
                                    {stage}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="candidate-application-actions">
                              <button
                                type="button"
                                className="candidate-assess-button"
                                onClick={() => handleAssessCandidate(candidate, application)}
                                disabled={
                                  assessingApplication === application.id ||
                                  !candidate.cv_url
                                }
                              >
                                {assessingApplication === application.id
                                  ? 'Assessing...'
                                  : 'Assess CV'}
                              </button>

                              <button
                                type="button"
                                className="candidate-disconnect-button"
                                onClick={() => handleDisconnect(application.id)}
                                disabled={
                                  candidateAction === `disconnect-${application.id}`
                                }
                              >
                                {candidateAction === `disconnect-${application.id}`
                                  ? 'Removing...'
                                  : 'Remove'}
                              </button>
                            </div>

                            {assessmentErrors[application.id] ? (
                              <p className="candidate-assessment-error">
                                {assessmentErrors[application.id]}
                              </p>
                            ) : null}

                            {assessments[application.id] ? (
                              <div className="candidate-assessment">
                                <div className="candidate-assessment-header">
                                  <span>AI match</span>
                                  <strong>{assessments[application.id].score}/100</strong>
                                </div>

                                <p>{assessments[application.id].summary}</p>

                                <div className="candidate-assessment-grid">
                                  <div>
                                    <h4>Strengths</h4>
                                    <ul>
                                      {assessments[application.id].strengths.map(
                                        (strength) => (
                                          <li key={strength}>{strength}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4>Concerns</h4>
                                    <ul>
                                      {assessments[application.id].concerns.map(
                                        (concern) => (
                                          <li key={concern}>{concern}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                </div>

                                <span className="candidate-recommendation">
                                  {assessments[application.id].recommendation.replace(
                                    '_',
                                    ' ',
                                  )}
                                </span>
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}

                    {getAvailableJobs(candidate.id).length > 0 ? (
                      <div className="candidate-connect">
                        <select
                          value={selectedJobs[candidate.id] ?? ''}
                          onChange={(event) =>
                            setSelectedJobs((current) => ({
                              ...current,
                              [candidate.id]: event.target.value,
                            }))
                          }
                          aria-label={`Choose job for ${candidate.name}`}
                        >
                          <option value="">Choose job</option>

                          {getAvailableJobs(candidate.id).map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.title}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleConnect(candidate.id)}
                          disabled={connectingCandidate === candidate.id}
                        >
                          {connectingCandidate === candidate.id
                            ? 'Connecting...'
                            : 'Connect'}
                        </button>
                      </div>
                    ) : (
                      <p>All open jobs are already connected.</p>
                    )}
                  </div>

                </article>
              ))}
            </section>
          ) : null}
        </div>

        {workspaceCustomerId ? <aside className="candidate-form-panel">
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
        </aside> : null}
      </div>
    </main>
  )
}
