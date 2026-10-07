'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Check, ArrowRight, Sparkles, Zap, Crown } from 'lucide-react'
import { getPlansForDisplay } from '../../../lib/plans'

// Derive plans from canonical config
const plans = getPlansForDisplay().map(config => ({
  id: config.id,
  name: config.name,
  price: config.price,
  period: config.period,
  icon: config.id === 'free' ? Sparkles : config.id === 'starter' ? Zap : Crown,
  features: getFeatureList(config.id),
  popular: config.id === 'starter'
}))

function getFeatureList(planId) {
  const features = {
    free: [
      'Up to 10 products',
      'Basic store customization',
      'WhatsApp order integration',
      'Store analytics',
      'Community support',
      'Platform branding',
    ],
    starter: [
      'Up to 50 products',
      'Basic store customization',
      'WhatsApp order integration',
      'Advanced analytics',
      'Priority support',
      'Remove branding',
      'Bulk product upload'
    ],
    pro: [
      'Unlimited products',
      'Advanced store customization',
      'WhatsApp order integration',
      'Advanced analytics + reports',
      'Priority support',
      'Remove branding',
      'Bulk product upload'
    ]
  }
  return features[planId]
}

const planOrder = ['free', 'starter', 'pro']

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isUpgrade, setIsUpgrade] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    setIsUpgrade(upgrade === 'true')
    
    // Fetch current subscription if upgrading
    if (upgrade === 'true') {
      fetchCurrentSubscription()
    }
  }, [searchParams])

  async function fetchCurrentSubscription() {
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

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', businessData.id)
        .maybeSingle()

      if (subData) {
        setCurrentPlan(subData.plan)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  async function handlePlanSelect(plan) {
    setSelectedPlan(plan)
    
    // If upgrading, check if it's actually an upgrade
    if (isUpgrade && currentPlan) {
      const currentIndex = planOrder.indexOf(currentPlan)
      const newIndex = planOrder.indexOf(plan.id)
      
      if (newIndex <= currentIndex) {
        setError('Please select a higher tier plan to upgrade')
        return
      }
    }
    
    if (plan.id === 'free') {
      // For free plan, proceed directly to setup
      router.push('/dashboard/setup?plan=free')
    } else {
      // For paid plans, initiate Paystack payment
      await initiatePayment(plan)
    }
  }

  async function initiatePayment(plan) {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user's email for payment
      const email = user.email

      // Initialize Paystack transaction
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: plan.price * 100, // Paystack expects amount in kobo
          plan: plan.id,
          userId: user.id,
          isUpgrade: isUpgrade
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed')
      }

      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-top">
        <a href="/" className="brand"><span className="brand-mark">s</span>shopmini</a>
        <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-welcome" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
          <span className="kicker">{isUpgrade ? 'UPGRADE YOUR PLAN' : 'CHOOSE YOUR PLAN'}</span>
          <h1>{isUpgrade ? 'Select a higher tier plan' : 'Select a subscription plan'}</h1>
          <p>{isUpgrade ? `You are currently on the ${currentPlan} plan. Upgrade to unlock more features.` : 'Start with our free plan or upgrade as you grow'}</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '40px' }}>
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlan === plan.id
            const isDowngrade = isUpgrade && currentPlan && planOrder.indexOf(plan.id) <= planOrder.indexOf(currentPlan)
            
            return (
              <div
                key={plan.id}
                className="product-card"
                style={{
                  padding: '32px',
                  cursor: isDowngrade ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  border: plan.popular ? '2px solid var(--green)' : isCurrentPlan ? '2px solid var(--muted)' : '1px solid var(--line)',
                  position: 'relative',
                  opacity: isDowngrade ? 0.6 : 1
                }}
                onClick={() => !loading && !isDowngrade && handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--green)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    MOST POPULAR
                  </div>
                )}
                {isCurrentPlan && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--muted)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    CURRENT PLAN
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--mint)', display: 'grid', placeItems: 'center', color: '#2d6d5e' }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{plan.name}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>{plan.period}</p>
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.05em' }}>
                    ₦{plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && <span style={{ color: 'var(--muted)', fontSize: '14px' }}>/{plan.period}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#69756f' }}>
                      <Check size={16} style={{ color: '#55977b', flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`button ${plan.popular ? 'button-dark' : 'button-outline'}`}
                  style={{ width: '100%', marginTop: '24px' }}
                  disabled={loading || isDowngrade || isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : isDowngrade ? 'Downgrade not available' : loading && selectedPlan?.id === plan.id ? 'Processing...' : plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
