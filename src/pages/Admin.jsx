import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './Admin.css'

export function Admin() {
    const { role } = useAuth()
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('')
    const [newRole, setNewRole] = useState('customer')
    const [message, setMessage] = useState('')
    const [formError, setFormError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (role !== 'admin') {
        return <Navigate to="/" replace />
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setMessage('')
        setFormError('')
        setSubmitting(true)

        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                fullName,
                role: newRole,
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            setFormError(result.error || 'Could not create user')
            setSubmitting(false)
            return
        }

        setMessage(`Created ${result.user.email} as ${result.user.role}`)
        setEmail('')
        setFullName('')
        setPassword('')
        setNewRole('customer')
        setSubmitting(false)
    }

    return (
        <section className="admin-panel">
            <div className="admin-intro">
                <p className="eyebrow">Admin</p>
                <h2>Create user account</h2>
                <p>
                    Add customer or admin accounts. The API route creates the Supabase
                    auth user and matching profile row.
                </p>
                <Link className="admin-back-link" to="/">
                    Back to dashboard
                </Link>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
                <label>
                    Full name
                    <input
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                    />
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        autoComplete="email"
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        autoComplete="new-password"
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Role
                    <select
                        value={newRole}
                        onChange={(event) => setNewRole(event.target.value)}
                    >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>

                {formError ? <p className="form-error">{formError}</p> : null}
                {message ? <p className="form-success">{message}</p> : null}

                <button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create account'}
                </button>
            </form>
        </section>
    )
}
