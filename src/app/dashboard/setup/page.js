'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Store, ArrowRight, Check, X } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState(null)
  
  const [form, setForm] = useState({
    whatsappNumber: '',
    storeName: '',
    category: 'Fashion',
    description: '',
    location: ''
  })
  const [status, setStatus] = useState({ error: '', loading: false, success: false })

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  async function submit(event) {
    event.preventDefault()
    setStatus({ error: '', loading: true, success: false })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus({ error: 'Please log in to continue', loading: false, success: false })
        return
      }

      // Generate slug from store name
      const slug = form.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substr(2, 9)

      // Check if business already exists
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (existingBusiness) {
        setStatus({ error: 'Your store is already set up', loading: false, success: false })
        return
      }

      // Insert business record
      const { data: businessData, error: insertError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name: form.storeName.trim(),
          slug: slug,
          category: form.category,
          whatsapp_number: form.whatsappNumber.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          is_active: true
        })
        .select()
        .single()

      if (insertError) {
        setStatus({ error: insertError.message || 'Failed to create store', loading: false, success: false })
        return
      }

      // Update or create subscription with business_id
      if (selectedPlan) {
        // Use API route to handle subscription with admin privileges
        try {
          const response = await fetch('/api/subscription/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: businessData.id,
              plan: selectedPlan
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to update subscription:', errorData.error)
          }
        } catch (error) {
          console.error('Error calling subscription API:', error)
        }
      } else {
        // If no plan selected, create default free subscription
        try {
          const response = await fetch('/api/subscription/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: businessData.id,
              plan: 'free'
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to create default subscription:', errorData.error)
          }
        } catch (error) {
          console.error('Error calling subscription API:', error)
        }
      }

      setStatus({ error: '', loading: false, success: true })
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      setStatus({ error: 'Something went wrong. Please try again.', loading: false, success: false })
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a href="/dashboard" className="brand">
          <span className="brand-mark"><Store size={18} /></span>shopmini
        </a>
        
        <div className="auth-heading">
          <span className="kicker">FINISH YOUR STORE</span>
          <h1>Set up your storefront.</h1>
          <p>Add your WhatsApp number and store details to start selling.</p>
        </div>

        {status.success ? (
          <div className="auth-success">
            <div className="success-icon"><Check size={32} /></div>
            <h2>Store created!</h2>
            <p>Your storefront is now live. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>Store name
              <input 
                name="storeName" 
                value={form.storeName} 
                onChange={update} 
                placeholder="e.g. Kelly's Fashion" 
                required 
              />
            </label>

            <label>WhatsApp number
              <input 
                name="whatsappNumber" 
                value={form.whatsappNumber} 
                onChange={update} 
                placeholder="080 1234 5678" 
                required 
              />
            </label>

            <label>Business category
              <select name="category" value={form.category} onChange={update}>
                {['Fashion', 'Shoes', 'Beauty & cosmetics', 'Food', 'Accessories', 'Other'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>Store description
              <textarea 
                name="description" 
                value={form.description} 
                onChange={update} 
                placeholder="Tell customers about your business..." 
                rows={3}
              />
            </label>

            <label>Location
              <input 
                name="location" 
                value={form.location} 
                onChange={update} 
                placeholder="e.g. Port Harcourt, Nigeria" 
              />
            </label>

            {status.error && <p className="auth-error" role="alert">{status.error}</p>}

            <button 
              className="button button-dark auth-submit" 
              disabled={status.loading}
            >
              {status.loading ? 'Creating store...' : 'Create my store'} <ArrowRight size={16} />
            </button>

            <p className="auth-foot">
              <a href="/dashboard">Cancel and go back</a>
            </p>
          </form>
        )}
      </section>
    </main>
  )
}
