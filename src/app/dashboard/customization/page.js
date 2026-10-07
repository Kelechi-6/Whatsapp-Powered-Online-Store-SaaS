'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Palette, Layout, Lock, ArrowRight, Save } from 'lucide-react'
import { UpgradePrompt } from '../../../components/UpgradePrompt'

export default function CustomizationPage() {
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [products, setProducts] = useState([])

  const [customization, setCustomization] = useState({
    theme: 'default',
    primaryColor: '#10b981',
    showFeaturedProducts: true,
    showNewArrivals: true,
    showAboutSection: true,
    showContactSection: true,
    featuredProductIds: [],
    newArrivalProductIds: [],
  })

  useEffect(() => {
    loadCustomizationData()
  }, [])

  async function loadCustomizationData() {
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

      // Load existing customization settings if any
      if (businessData.customization_settings) {
        setCustomization(businessData.customization_settings)
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])

      setLoading(false)
    } catch (error) {
      console.error('Error loading customization:', error)
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('businesses')
        .update({ customization_settings: customization })
        .eq('id', business.id)

      if (error) {
        console.error('Database update error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      setSuccess('Customization settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving customization:', error)
      alert(`Error: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-loading">Loading...</div>
      </main>
    )
  }

  const hasAdvancedCustomization = subscription?.plan === 'pro'

  return (
    <main className="dashboard-shell">
      <header className="dashboard-top">
        <a href="/" className="brand"><span className="brand-mark">s</span>shopmini</a>
        <form action="/auth/sign-out" method="post"><button className="auth-reset">Log out</button></form>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Store Customization</h1>
            <p>Customize your storefront appearance and layout</p>
          </div>
          <div className="dashboard-nav">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            {business && <a href={`/store/${business.slug}`} className="nav-link" target="_blank">View Store <ArrowRight size={14} /></a>}
          </div>
        </div>

        {!hasAdvancedCustomization && (
          <UpgradePrompt
            featureName="Advanced Store Customization"
            currentPlan={subscription?.plan || 'free'}
            requiredPlan="pro"
            message="Get full control over your store's theme, colors, layout, and sections. Create a unique storefront that matches your brand."
          />
        )}

        {hasAdvancedCustomization && (
          <>
            {success && (
              <div style={{
                background: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#065f46'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Theme Selection */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette size={20} style={{ color: '#10b981' }} />
                  Theme & Colors
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Theme
                    </label>
                    <select
                      value={customization.theme}
                      onChange={(e) => setCustomization({ ...customization, theme: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="default">Default</option>
                      <option value="modern">Modern</option>
                      <option value="minimal">Minimal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Primary Color
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={customization.primaryColor}
                        onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                        style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={customization.primaryColor}
                        onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Products Selection */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={20} style={{ color: '#10b981' }} />
                  Featured Products
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  Select up to 4 products to feature on your store
                </p>
                {products.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No products available. Add products first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {products.map(product => (
                      <label key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px', background: customization.featuredProductIds?.includes(product.id) ? '#f0fdf4' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={customization.featuredProductIds?.includes(product.id) || false}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(customization.featuredProductIds || []), product.id].slice(0, 4)
                              : (customization.featuredProductIds || []).filter(id => id !== product.id)
                            setCustomization({ ...customization, featuredProductIds: newIds })
                          }}
                          disabled={!customization.featuredProductIds?.includes(product.id) && (customization.featuredProductIds?.length || 0) >= 4}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', flex: 1 }}>{product.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>₦{product.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* New Arrivals Selection */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={20} style={{ color: '#10b981' }} />
                  New Arrivals
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  Select up to 3 products to show as new arrivals
                </p>
                {products.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No products available. Add products first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {products.map(product => (
                      <label key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px', background: customization.newArrivalProductIds?.includes(product.id) ? '#f0fdf4' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={customization.newArrivalProductIds?.includes(product.id) || false}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(customization.newArrivalProductIds || []), product.id].slice(0, 3)
                              : (customization.newArrivalProductIds || []).filter(id => id !== product.id)
                            setCustomization({ ...customization, newArrivalProductIds: newIds })
                          }}
                          disabled={!customization.newArrivalProductIds?.includes(product.id) && (customization.newArrivalProductIds?.length || 0) >= 3}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', flex: 1 }}>{product.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>₦{product.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Section Visibility */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={20} style={{ color: '#10b981' }} />
                  Section Visibility
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { key: 'showFeaturedProducts', label: 'Featured Products Section' },
                    { key: 'showNewArrivals', label: 'New Arrivals Section' },
                    { key: 'showAboutSection', label: 'About Our Business Section' },
                    { key: 'showContactSection', label: 'Contact / WhatsApp Section' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={customization[key]}
                        onChange={(e) => setCustomization({ ...customization, [key]: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '14px' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="button button-dark"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: 'fit-content' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
