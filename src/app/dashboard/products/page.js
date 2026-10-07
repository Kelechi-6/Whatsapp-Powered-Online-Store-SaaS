'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Plus, Edit, Trash2, Store, ArrowRight, X, Image as ImageIcon, Lock, Upload } from 'lucide-react'
import { canAddProduct, getRemainingProducts, hasFeature } from '../../../lib/plans'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [business, setBusiness] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [status, setStatus] = useState({ error: '', loading: true, success: '' })
  
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  useEffect(() => {
    loadBusinessAndProducts()
  }, [])

  async function loadBusinessAndProducts() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (businessError) throw businessError

      if (!businessData) {
        router.push('/dashboard/setup')
        return
      }

      setBusiness(businessData)

      // Fetch subscription
      const response = await fetch(`/api/subscription/get?businessId=${businessData.id}`)
      const subData = await response.json()
      setSubscription(subData || { plan: 'free' })

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      setProducts(productsData || [])
    } catch (error) {
      setStatus({ error: error.message, loading: false, success: '' })
    } finally {
      setStatus(prev => ({ ...prev, loading: false }))
    }
  }

  // Check if user can add more products
  const canAddMore = subscription ? canAddProduct(subscription.plan, products.length) : false
  const remainingProducts = subscription ? getRemainingProducts(subscription.plan, products.length) : 0
  const canBulkUpload = subscription ? hasFeature(subscription.plan, 'bulk_upload') : false

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ error: '', loading: true, success: '' })
    setUploading(true)

    try {
      const supabase = createClient()

      let imageUrl = form.imageUrl || null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrlData.publicUrl
      }

      const productData = {
        business_id: business.id,
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        image_url: imageUrl
      }

      let error
      if (editingProduct) {
        const result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        error = result.error
      } else {
        const result = await supabase
          .from('products')
          .insert(productData)
          .select()
        error = result.error
      }

      if (error) throw error

      setStatus({ error: '', loading: false, success: editingProduct ? 'Product updated successfully!' : 'Product added successfully!' })
      setShowForm(false)
      setEditingProduct(null)
      setForm({ name: '', price: '', description: '', category: '', imageUrl: '' })
      setImageFile(null)
      setUploading(false)
      loadBusinessAndProducts()

      setTimeout(() => setStatus(prev => ({ ...prev, success: '' })), 3000)
    } catch (error) {
      setStatus({ error: error.message, loading: false, success: '' })
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProducts(products.filter(p => p.id !== id))
      setStatus({ error: '', loading: false, success: 'Product deleted successfully!' })
      setTimeout(() => setStatus(prev => ({ ...prev, success: '' })), 3000)
    } catch (error) {
      setStatus({ error: error.message, loading: false, success: '' })
    }
  }

  function openEditForm(product) {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: product.price,
      description: product.description || '',
      imageUrl: product.image_url || ''
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
    setForm({ name: '', price: '', description: '', imageUrl: '' })
    setImageFile(null)
  }

  if (status.loading && !business) {
    return (
      <main className="dashboard-shell">
        <header className="dashboard-top">
          <a href="/" className="brand"><span className="brand-mark">s</span>Shopmini</a>
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
            <h1>Products</h1>
            <p>Manage your product catalog</p>
          </div>
          <div className="dashboard-nav">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            {business && <a href={`/store/${business.slug}`} className="nav-link" target="_blank">View Store <ArrowRight size={14} /></a>}
          </div>
        </div>

        {status.error && <p className="auth-error">{status.error}</p>}
        {status.success && <div className="auth-success"><p>{status.success}</p></div>}

        {!canAddMore && remainingProducts !== null && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Lock size={20} style={{ color: '#856404' }} />
            <div>
              <strong style={{ color: '#856404' }}>Product limit reached</strong>
              <p style={{ margin: '4px 0 0 0', color: '#856404', fontSize: '13px' }}>
                You've reached your {subscription?.plan || 'free'} plan's limit of {products.length} products. 
                <button 
                  onClick={() => router.push('/dashboard/subscription?upgrade=true')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0066cc',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: '4px'
                  }}
                >
                  Upgrade to add more
                </button>
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="button button-dark"
            onClick={() => setShowForm(true)}
            disabled={!canAddMore}
            style={{ opacity: !canAddMore ? 0.5 : 1, cursor: !canAddMore ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={16} /> Add Product
          </button>

          {canBulkUpload && (
            <button
              className="button button-outline"
              onClick={() => {/* TODO: Implement bulk upload modal */}}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload size={16} /> Bulk Upload
            </button>
          )}
        </div>

        {canAddMore && remainingProducts !== null && (
          <p style={{ fontSize: '12px', color: '#69756f', marginTop: '8px' }}>
            {remainingProducts} product{remainingProducts !== 1 ? 's' : ''} remaining on your {subscription?.plan || 'free'} plan
          </p>
        )}

        {products.length === 0 && !status.loading ? (
          <div className="dashboard-empty">
            <Store className="empty-icon" size={48} />
            <h2>No products yet</h2>
            <p>Add your first product to start selling</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                {product.image_url ? (
                  <div className="product-image" style={{ backgroundImage: `url(${product.image_url})` }} />
                ) : (
                  <div className="product-image placeholder">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-price">₦{product.price.toLocaleString()}</p>
                  {product.description && <p className="product-description">{product.description}</p>}
                </div>
                <div className="product-actions">
                  <button className="button-icon" onClick={() => openEditForm(product)} title="Edit">
                    <Edit size={16} />
                  </button>
                  <button className="button-icon danger" onClick={() => handleDelete(product.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-backdrop" onClick={closeForm}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeForm}><X size={16} /></button>
              <span className="modal-kicker">{editingProduct ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</span>
              <h2>{editingProduct ? 'Edit product' : 'Add new product'}</h2>
              <form onSubmit={handleSubmit}>
                <label>Product Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={update}
                    placeholder="e.g. Leather Handbag"
                    required
                  />
                </label>

                <label>Price (₦)
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={update}
                    placeholder="e.g. 18500"
                    step="0.01"
                    required
                  />
                </label>

                <label>Product Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                  {imageFile && <small style={{ marginTop: '6px', color: 'var(--muted)' }}>Selected: {imageFile.name}</small>}
                </label>

                <label>Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={update}
                    placeholder="Describe your product..."
                    rows={4}
                  />
                </label>

                <button type="submit" className="button button-dark modal-submit" disabled={status.loading || uploading}>
                  {uploading ? 'Uploading image...' : status.loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
