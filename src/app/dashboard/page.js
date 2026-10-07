'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { Copy, Check, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [business, setBusiness] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [products, setProducts] = useState(0)
  const [orders, setOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const supabase = createClient()
      const { data: { user: userData } } = await supabase.auth.getUser()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)

      const { data: businessData } = await supabase
        .from('businesses')
        .select('id,name,slug,category,whatsapp_number,is_active,views')
        .eq('owner_id', userData.id)
        .maybeSingle()

      // If user has no business, check if they need subscription or setup
      if (!businessData) {
        // Check if user has any subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .maybeSingle()

        if (!subscriptionData) {
          router.push('/dashboard/subscription')
        } else {
          router.push('/dashboard/setup')
        }
        return
      }

      setBusiness(businessData)

      // Fetch subscription data using API route with admin privileges
      if (businessData) {
        try {
          const response = await fetch(`/api/subscription/get?businessId=${businessData.id}`)
          const subData = await response.json()

          console.log('Subscription data from API:', subData)
          // Set subscription data, or default to free if none exists
          setSubscription(subData || { plan: 'free', status: 'active' })
        } catch (error) {
          console.error('Error fetching subscription:', error)
          // Set default free subscription if fetch fails
          setSubscription({ plan: 'free', status: 'active' })
        }
      }

      if (businessData) {
        const { count: productsCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        const { count: ordersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        setProducts(productsCount || 0)
        setOrders(ordersCount || 0)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyStoreLink() {
    if (!business) return
    const storeUrl = `${window.location.origin}/store/${business.slug}`
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="dashboard-shell">
        <header className="dashboard-top">
          <a href="/" className="brand"><span className="brand-mark">s</span>shopmini</a>
          <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-loading">Loading...</div>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-top">
        <a href="/" className="brand"><span className="brand-mark">s</span>shopmini</a>
        <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.user_metadata?.owner_name || 'there'}</p>
          </div>
          <div className="dashboard-nav">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/dashboard/products" className="nav-link">Products</a>
            <a href="/dashboard/analytics" className="nav-link">Analytics</a>
            <a href="/dashboard/customization" className="nav-link">Customization</a>
            <a href="/dashboard/support" className="nav-link">Support</a>
            {business && <a href={`/store/${business.slug}`} className="nav-link" target="_blank">View Store <ArrowRight size={14} /></a>}
          </div>
        </div>

        <div className="dashboard-welcome">
          <div>
            <span className="kicker">YOUR STORE DASHBOARD</span>
            <h1>Good morning, {user?.user_metadata?.owner_name || 'there'}.</h1>
            <p>{business ? 'Here\'s how your store is doing.' : 'Your account is ready. Complete your store setup to start selling.'}</p>
            {subscription && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'var(--mint)',
                  color: '#2d6d5e',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {subscription.plan} Plan
                </div>
                <button
                  onClick={() => router.push('/dashboard/subscription?upgrade=true')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Upgrade
                </button>
              </div>
            )}
          </div>
          {business && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <a className="button button-dark" href={`/store/${business.slug}`}>View store</a>
              <button
                className="button button-outline"
                onClick={copyStoreLink}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}
        </div>

        {business ? (
          <>
            <div className="dashboard-stats">
              <div>
                <small>STORE VIEWS</small>
                <strong>{business?.views || 0}</strong>
                <span>Start sharing your link</span>
              </div>
              <a href="/dashboard/products" className="stat-clickable">
                <small>PRODUCTS</small>
                <strong>{products}</strong>
                <span>Manage your catalog</span>
              </a>
              <div>
                <small>ORDERS STARTED</small>
                <strong>{orders}</strong>
                <span>Through your storefront</span>
              </div>
              <div>
                <small>WHATSAPP ORDERS</small>
                <strong>0</strong>
                <span>Ready to follow up</span>
              </div>
            </div>

            <div className="dashboard-panel">
              <div>
                <span className="kicker">NEXT STEP</span>
                <h2>Add your products</h2>
                <p>Upload products, set your prices, and share your store link with customers.</p>
              </div>
              <a className="button button-outline" href="/dashboard/products">Add product</a>
            </div>
          </>
        ) : (
          <div className="dashboard-panel">
            <div>
              <span className="kicker">SETUP REQUIRED</span>
              <h2>Let's finish your store</h2>
              <p>Your account is created. Add your WhatsApp number and store details to publish your storefront.</p>
            </div>
            <a className="button button-dark" href="/dashboard/setup">Start setup</a>
          </div>
        )}
      </section>
    </main>
  )
}
