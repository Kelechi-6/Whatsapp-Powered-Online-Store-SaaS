'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { MessageCircle, Mail, Phone, ArrowRight, Lock, Star, Clock } from 'lucide-react'
import { UpgradePrompt } from '../../../components/UpgradePrompt'

export default function SupportPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!businessData) {
        router.push('/dashboard/setup')
        return
      }

      const response = await fetch(`/api/subscription/get?businessId=${businessData.id}`)
      const subData = await response.json()
      setSubscription(subData || { plan: 'free' })

      setLoading(false)
    } catch (error) {
      console.error('Error loading subscription:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-loading">Loading...</div>
      </main>
    )
  }

  const hasPrioritySupport = subscription?.plan === 'starter' || subscription?.plan === 'pro'

  return (
    <main className="dashboard-shell">
      <header className="dashboard-top">
        <a href="/" className="brand"><span className="brand-mark">s</span>shopmini</a>
        <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Support</h1>
            <p>Get help with your store</p>
          </div>
          <div className="dashboard-nav">
            <a href="/dashboard" className="nav-link">Dashboard</a>
          </div>
        </div>

        {!hasPrioritySupport && (
          <UpgradePrompt
            featureName="Priority Support"
            currentPlan={subscription?.plan || 'free'}
            requiredPlan="starter"
            message="Get faster response times and dedicated support to help you grow your business."
          />
        )}

        {hasPrioritySupport && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Star size={24} fill="white" />
                <h2 style={{ margin: 0, fontSize: '20px' }}>Priority Support Active</h2>
              </div>
              <p style={{ margin: 0, opacity: 0.9 }}>
                You're on the {subscription?.plan} plan with priority support. Expect faster response times and dedicated assistance.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => window.location.href = 'mailto:support@shopmini.co'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mail size={24} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Email Support</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>support@shopmini.co</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                  Send us an email and get a response within 24 hours.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  Contact us <ArrowRight size={14} />
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => window.location.href = 'https://wa.me/2348000000000'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageCircle size={24} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>WhatsApp Support</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>+234 800 000 0000</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                  Chat with us on WhatsApp for instant support.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  Chat now <ArrowRight size={14} />
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Clock size={24} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Response Time</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Priority Plan</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                  As a {subscription?.plan} plan member, you get priority responses within 12 hours.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  <Star size={14} fill="#10b981" /> Priority
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginTop: '24px'
            }}>
              <h3 style={{ marginBottom: '16px' }}>Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>How do I upgrade my plan?</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Go to your dashboard and click "Upgrade" next to your current plan, or visit the subscription page.
                  </p>
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>How do I add products?</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Navigate to the Products page and click "Add Product". You can also use bulk upload if on Starter or Pro plan.
                  </p>
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>How do I customize my store?</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Go to the Setup page to update your store name, description, category, and location.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!hasPrioritySupport && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginTop: '24px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Community Support</h3>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              As a free plan user, you can access our community resources:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', textDecoration: 'none' }}>
                <MessageCircle size={16} /> Join our WhatsApp community
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', textDecoration: 'none' }}>
                <Mail size={16} /> Browse our help articles
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
