import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

export function Login() {
    const { user, loading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formError, setFormError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    if (!loading && user) {
        return <Navigate to="/" replace />
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setFormError('')
        setSubmitting(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setFormError(error.message)
        }

        setSubmitting(false)
    }

    return (
        <main className="auth-page">
            <section className="auth-panel">
                <div>
                    <p className="eyebrow">Mini ATS</p>
                    <h1>Sign in to your recruiting workspace.</h1>
                    <p className="auth-copy">
                        Use your customer or admin account to manage jobs, candidates, and
                        pipeline stages.
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
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
                        <span className="password-field">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                autoComplete="current-password"
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((current) => !current)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </span>
                    </label>

                    {formError ? <p className="form-error">{formError}</p> : null}

                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>

                    <p className="demo-note">
                        Demo project — login required.{' '}
                        <a href="mailto:samuel.soumi@toby.audio">Contact me</a> if you'd like to explore it.
                    </p>
                </form>
            </section>
        </main>
    )
}
