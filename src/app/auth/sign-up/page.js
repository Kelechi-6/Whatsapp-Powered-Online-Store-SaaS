'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, formatAuthError, getAuthRedirectUrl } from '../../lib/supabase/client'
import { FadeIn, ScaleIn } from '../../../components/ScrollAnimation'

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

    // Format phone number with +234 country code
    let formattedPhone = form.phone.trim().replace(/\D/g, '') // Remove all non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1) // Remove leading 0
    }
    formattedPhone = `+234${formattedPhone}` // Add country code

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { emailRedirectTo: getAuthRedirectUrl(), data: { business_name: form.businessName.trim(), owner_name: form.ownerName.trim(), phone: formattedPhone, category: form.category, selected_plan: selectedPlan } },
    })
    if (error) return setStatus({ error: formatAuthError(error), loading: false, success: false })
    if (data.session) {
      // Create subscription with null business_id (will be updated after business creation)
      try {
        const response = await fetch('/api/subscription/create-without-business', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            plan: selectedPlan || 'free'
          }),
        })
        if (!response.ok) {
          console.error('Failed to create subscription:', await response.json())
        }
      } catch (error) {
        console.error('Error creating subscription:', error)
      }

      if (selectedPlan) {
        router.push(`/dashboard/setup?plan=${selectedPlan}`)
      } else {
        router.push('/dashboard/subscription')
      }
    }
    else setStatus({ error: '', loading: false, success: true })
  }
  return (
    <main className="auth-shell">
      <ScaleIn>
        <section className="auth-card">
          <FadeIn>
            <Link href="/" className="brand"><span className="brand-mark">s</span>Shopmini</Link>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="auth-heading"><span className="kicker">START SELLING ONLINE</span><h1>Create your store.</h1><p>Set up your shopmini account and get a shareable storefront in minutes.</p></div>
          </FadeIn>
          {status.success ? (
            <FadeIn>
              <div className="auth-success"><h2>Check your email.</h2><p>We sent a confirmation link to <strong>{form.email}</strong>. Confirm it to finish creating your store.</p><Link className="button button-dark" href="/auth/login">Go to login</Link></div>
            </FadeIn>
          ) : (
            <FadeIn delay={200}>
              <form onSubmit={submit} className="auth-form"><label>Business name<input name="businessName" value={form.businessName} onChange={update} placeholder="e.g. Kelly&apos;s Fashion" required /></label><label>Owner name<input name="ownerName" value={form.ownerName} onChange={update} placeholder="Your full name" required /></label><div className="auth-two"><label>Email<input type="email" name="email" value={form.email} onChange={update} placeholder="you@business.com" required /></label><label>Phone number<input name="phone" value={form.phone} onChange={update} placeholder="080 1234 5678" required /></label></div><label>Business category<select name="category" value={form.category} onChange={update}>{['Fashion', 'Shoes', 'Beauty & cosmetics', 'Food', 'Accessories', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Password<input type="password" name="password" value={form.password} onChange={update} minLength={8} placeholder="At least 8 characters" required /></label>{status.error && <p className="auth-error" role="alert">{status.error}</p>}<button className="button button-dark auth-submit" disabled={status.loading}>{status.loading ? 'Creating your store…' : 'Create my store'}</button><p className="auth-foot">Already have an account? <Link href="/auth/login">Log in</Link></p></form>
            </FadeIn>
          )}
        </section>
      </ScaleIn>
    </main>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-shell"><section className="auth-card"><p>Loading...</p></section></div>}>
      <SignUpContent />
    </Suspense>
  )
}
