'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, formatAuthError, getAuthRedirectUrl } from '../../lib/supabase/client'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', phone: '', password: '', category: 'Fashion' })
  const [status, setStatus] = useState({ error: '', loading: false, success: false })

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) {
    event.preventDefault()
    setStatus({ error: '', loading: true, success: false })
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { emailRedirectTo: getAuthRedirectUrl(), data: { business_name: form.businessName.trim(), owner_name: form.ownerName.trim(), phone: form.phone.trim(), category: form.category, selected_plan: selectedPlan } },
    })
    if (error) return setStatus({ error: formatAuthError(error), loading: false, success: false })
    if (data.session) {
      if (selectedPlan) {
        router.push(`/dashboard/setup?plan=${selectedPlan}`)
      } else {
        router.push('/dashboard/subscription')
      }
    }
    else setStatus({ error: '', loading: false, success: true })
  }
  return <main className="auth-shell"><section className="auth-card"><Link href="/" className="brand"><span className="brand-mark">s</span>shopmini</Link><div className="auth-heading"><span className="kicker">START SELLING ONLINE</span><h1>Create your store.</h1><p>Set up your shopmini account and get a shareable storefront in minutes.</p></div>{status.success ? <div className="auth-success"><h2>Check your email.</h2><p>We sent a confirmation link to <strong>{form.email}</strong>. Confirm it to finish creating your store.</p><Link className="button button-dark" href="/auth/login">Go to login</Link></div> : <form onSubmit={submit} className="auth-form"><label>Business name<input name="businessName" value={form.businessName} onChange={update} placeholder="e.g. Kelly&apos;s Fashion" required /></label><label>Owner name<input name="ownerName" value={form.ownerName} onChange={update} placeholder="Your full name" required /></label><div className="auth-two"><label>Email<input type="email" name="email" value={form.email} onChange={update} placeholder="you@business.com" required /></label><label>Phone number<input name="phone" value={form.phone} onChange={update} placeholder="080 1234 5678" required /></label></div><label>Business category<select name="category" value={form.category} onChange={update}>{['Fashion', 'Shoes', 'Beauty & cosmetics', 'Food', 'Accessories', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Password<input type="password" name="password" value={form.password} onChange={update} minLength={8} placeholder="At least 8 characters" required /></label>{status.error && <p className="auth-error" role="alert">{status.error}</p>}<button className="button button-dark auth-submit" disabled={status.loading}>{status.loading ? 'Creating your store…' : 'Create my store'}</button><p className="auth-foot">Already have an account? <Link href="/auth/login">Log in</Link></p></form>}</section></main>
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-shell"><section className="auth-card"><p>Loading...</p></section></div>}>
      <SignUpContent />
    </Suspense>
  )
}
