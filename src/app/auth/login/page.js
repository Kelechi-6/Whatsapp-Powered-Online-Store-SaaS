'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient, formatAuthError } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [state, setState] = useState({ error: '', loading: false })
  async function submit(event) { event.preventDefault(); setState({ error: '', loading: true }); const { error } = await createClient().auth.signInWithPassword(form); if (error) return setState({ error: formatAuthError(error), loading: false }); router.push('/dashboard') }
  async function reset() { if (!form.email) return setState({ error: 'Enter your email first, then request a reset link.', loading: false }); const { error } = await createClient().auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/auth/update-password` }); setState({ error: error ? formatAuthError(error) : 'Password reset link sent. Check your email.', loading: false }) }
  return <main className="auth-shell"><section className="auth-card auth-card-small"><Link href="/" className="brand"><span className="brand-mark">s</span>shopmini</Link><div className="auth-heading"><span className="kicker">WELCOME BACK</span><h1>Log in to your store.</h1><p>Manage products, share your storefront, and keep selling.</p></div><form onSubmit={submit} className="auth-form"><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="button button-dark auth-submit" disabled={state.loading}>{state.loading ? 'Signing in…' : 'Log in'}</button><button type="button" className="auth-reset" onClick={reset}>Forgot password?</button><p className="auth-foot">New to shopmini? <Link href="/auth/sign-up">Create your store</Link></p></form></section></main>
}
