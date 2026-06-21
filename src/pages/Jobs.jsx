import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Jobs.css'

export function Jobs() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { user, role } = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('open')
    const [submitting, setSubmitting] = useState(false)
    const [createError, setCreateError] = useState('')
    const [updatingJobId, setUpdatingJobId] = useState(null)
    const [actionError, setActionError] = useState('')

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
    async function handleCreateJob(event) {
        event.preventDefault()
        setCreateError('')
        setSubmitting(true)

        const { data, error: insertError } = await supabase
            .from('jobs')
            .insert({
                customer_id: user.id,
                title: title.trim(),
                description: description.trim() || null,
                status,
            })
            .select('id, title, description, status, created_at')
            .single()

        if (insertError) {
            setCreateError(insertError.message)
            setSubmitting(false)
            return
        }

        setJobs((currentJobs) => [data, ...currentJobs])
        setTitle('')
        setDescription('')
        setStatus('open')
        setSubmitting(false)
    }

    async function handleStatusChange(jobId, nextStatus) {
        setActionError('')
        setUpdatingJobId(jobId)

        const { data, error: updateError } = await supabase
            .from('jobs')
            .update({ status: nextStatus })
            .eq('id', jobId)
            .select('id, title, description, status, created_at')
            .single()

        if (updateError) {
            setActionError(updateError.message)
        } else {
            setJobs((currentJobs) =>
                currentJobs.map((job) => (job.id === jobId ? data : job)),
            )
        }

        setUpdatingJobId(null)
    }

    return (
        <main className="jobs-page">
            <header className="jobs-header">
                <div>
                    <p className="eyebrow">Recruitment</p>
                    <h1>Jobs</h1>
                </div>

                <Link to="/">Dashboard</Link>
            </header>

            <section className={`jobs-layout${role === 'customer' ? '' : ' jobs-layout--single'}`}>
                <section className="jobs-content">
                    {loading ? <p>Loading jobs...</p> : null}
                    {error ? <p className="form-error">{error}</p> : null}

                    {!loading && !error && jobs.length === 0 ? (
                        <p>No jobs created yet.</p>
                    ) : null}

                    {actionError ? <p className="form-error">{actionError}</p> : null}

                    <section className="jobs-list">
                        {jobs.map((job) => (
                            <article className="job-item" key={job.id}>
                                <div>
                                    <h2>{job.title}</h2>
                                    <p>{job.description || 'No description.'}</p>
                                </div>

                                {role === 'customer' ? (
                                    <select
                                        className={`job-status-select job-status--${job.status}`}
                                        value={job.status}
                                        disabled={updatingJobId === job.id}
                                        onChange={(event) =>
                                            handleStatusChange(job.id, event.target.value)
                                        }
                                        aria-label={`Change status for ${job.title}`}
                                    >
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                ) : (
                                    <span className={`job-status job-status--${job.status}`}>
                                        {job.status}
                                    </span>
                                )}
                            </article>
                        ))}
                    </section>
                </section>

                {role === 'customer' ? (
                    <aside className="jobs-form-panel">
                        <form className="job-form" onSubmit={handleCreateJob}>
                            <h2>Create job</h2>

                            <label>
                                Title
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Description
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                />
                            </label>

                            <label>
                                Status
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </label>

                            {createError ? <p className="form-error">{createError}</p> : null}

                            <button type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create job'}
                            </button>
                        </form>
                    </aside>
                ) : null}
            </section>
        </main>
    )
}
