'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { BarChart3, Eye, ShoppingBag, MessageCircle, TrendingUp, Calendar, Lock, ArrowRight } from 'lucide-react'
import { UpgradePrompt } from '../../../components/UpgradePrompt'

export default function AnalyticsPage() {
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d
  const [hasReports, setHasReports] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  async function loadAnalyticsData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!businessData) {
        router.push('/dashboard/setup')
        return
      }

      setBusiness(businessData)

      // Fetch subscription
      const response = await fetch(`/api/subscription/get?businessId=${businessData.id}`)
      const subData = await response.json()
      setSubscription(subData || { plan: 'free' })
      setHasReports(subData?.plan === 'pro')

      // Fetch analytics if allowed
      if (subData?.plan === 'starter' || subData?.plan === 'pro') {
        const { data: analyticsData } = await supabase
          .from('analytics')
          .select('*')
          .eq('business_id', businessData.id)
          .gte('created_at', getDateRange(timeRange))
          .order('created_at', { ascending: false })

        setAnalytics(analyticsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setLoading(false)
    }
  }

  function getDateRange(range) {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const date = new Date(now.setDate(now.getDate() - days))
    return date.toISOString()
  }

  // Calculate analytics metrics
  const metrics = {
    totalViews: analytics.filter(a => a.type === 'view').length,
    productViews: analytics.filter(a => a.type === 'product_view').length,
    whatsappClicks: analytics.filter(a => a.type === 'whatsapp_click').length,
    orders: analytics.filter(a => a.type === 'order').length,
  }

  // Get most viewed products
  const productViewCounts = analytics
    .filter(a => a.type === 'product_view' && a.product_id)
    .reduce((acc, curr) => {
      acc[curr.product_id] = (acc[curr.product_id] || 0) + 1
      return acc
    }, {})

  const mostViewedProducts = Object.entries(productViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate daily views for Pro plan
  const dailyViews = analytics
    .filter(a => a.type === 'view')
    .reduce((acc, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

  const sortedDailyViews = Object.entries(dailyViews)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7) // Last 7 days

  // Calculate growth
  const todayViews = dailyViews[new Date().toLocaleDateString()] || 0
  const yesterdayViews = dailyViews[new Date(Date.now() - 86400000).toLocaleDateString()] || 0
  const growth = yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews * 100).toFixed(1) : 0

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-loading">Loading...</div>
      </main>
    )
  }

  const hasAnalytics = subscription?.plan === 'starter' || subscription?.plan === 'pro'

  return (
    <main className="dashboard-shell">
      <header className="dashboard-top">
        <a href="/" className="brand"><span className="brand-mark">s</span>Shopmini</a>
        <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Analytics</h1>
            <p>Track your store performance</p>
          </div>
          <div className="dashboard-nav">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            {business && <a href={`/store/${business.slug}`} className="nav-link" target="_blank">View Store <ArrowRight size={14} /></a>}
          </div>
        </div>

        {!hasAnalytics && (
          <UpgradePrompt
            featureName="Advanced Analytics"
            currentPlan={subscription?.plan || 'free'}
            requiredPlan="starter"
            message="Get detailed insights into your store views, product performance, and customer engagement."
          />
        )}

        {hasAnalytics && (
          <>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
              {['7d', '30d', '90d'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: timeRange === range ? '#10b981' : 'white',
                    color: timeRange === range ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Eye size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Store Views</span>
                </div>
                <strong style={{ fontSize: '28px', color: '#111827' }}>{metrics.totalViews}</strong>
                {hasReports && (
                  <div style={{ fontSize: '12px', color: parseFloat(growth) >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                    {parseFloat(growth) >= 0 ? '+' : ''}{growth}% vs yesterday
                  </div>
                )}
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShoppingBag size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Product Views</span>
                </div>
                <strong style={{ fontSize: '28px', color: '#111827' }}>{metrics.productViews}</strong>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MessageCircle size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>WhatsApp Clicks</span>
                </div>
                <strong style={{ fontSize: '28px', color: '#111827' }}>{metrics.whatsappClicks}</strong>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Orders</span>
                </div>
                <strong style={{ fontSize: '28px', color: '#111827' }}>{metrics.orders}</strong>
              </div>
            </div>

            {/* Pro-only features: Graph and detailed stats */}
            {hasReports && sortedDailyViews.length > 0 && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} style={{ color: '#10b981' }} />
                  Store Views Over Time
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '150px', padding: '20px 0' }}>
                  {sortedDailyViews.map(([date, count]) => {
                    const maxCount = Math.max(...sortedDailyViews.map(([, c]) => c))
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '100%',
                          height: `${height}%`,
                          background: '#10b981',
                          borderRadius: '4px 4px 0 0',
                          minHeight: '4px',
                          transition: 'height 0.3s'
                        }} />
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {hasReports && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} style={{ color: '#10b981' }} />
                  Detailed Statistics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Views Today</span>
                    <strong style={{ fontSize: '18px', color: '#111827' }}>{todayViews}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Views This Week</span>
                    <strong style={{ fontSize: '18px', color: '#111827' }}>{sortedDailyViews.reduce((sum, [, count]) => sum + count, 0)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Views This Month</span>
                    <strong style={{ fontSize: '18px', color: '#111827' }}>{metrics.totalViews}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Growth</span>
                    <strong style={{ fontSize: '18px', color: parseFloat(growth) >= 0 ? '#10b981' : '#ef4444' }}>
                      {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {mostViewedProducts.length > 0 && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#10b981' }} />
                  Most Viewed Products
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mostViewedProducts.map(([productId, count]) => (
                    <div key={productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                      <span style={{ color: '#374151' }}>Product ID: {productId.slice(0, 8)}...</span>
                      <strong style={{ color: '#10b981' }}>{count} views</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
