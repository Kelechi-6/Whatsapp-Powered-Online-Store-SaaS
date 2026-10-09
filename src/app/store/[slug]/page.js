'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  MessageCircle,
  ArrowRight,
  Store,
  Trash2,
  Plus,
  Minus
} from 'lucide-react'

export default function StorePage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [canRemoveBranding, setCanRemoveBranding] = useState(false)
  const [hasAnalytics, setHasAnalytics] = useState(false)
  const [customization, setCustomization] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [modalQuantity, setModalQuantity] = useState(1)

  useEffect(() => {
    loadStoreData()
  }, [params.slug])

  async function loadStoreData() {
    try {
      const supabase = createClient()

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single()

      if (!businessData) {
        setLoading(false)
        return
      }

      setBusiness(businessData)

      // Load customization settings
      if (businessData.customization_settings) {
        setCustomization(businessData.customization_settings)
      }

      // Fetch subscription to check if branding can be removed and analytics is enabled
      try {
        const response = await fetch(`/api/subscription/get?businessId=${businessData.id}`)
        const subData = await response.json()
        const plan = subData?.plan || 'free'
        setCanRemoveBranding(plan === 'starter' || plan === 'pro')
        setHasAnalytics(plan === 'starter' || plan === 'pro')
        console.log('Store subscription plan:', plan, 'canRemoveBranding:', plan === 'starter' || plan === 'pro')
      } catch (error) {
        console.error('Error fetching subscription:', error)
        // Default to showing branding if subscription fetch fails
        setCanRemoveBranding(false)
        setHasAnalytics(false)
      }

      // Increment view count and track analytics
      await supabase
        .from('businesses')
        .update({ views: (businessData.views || 0) + 1 })
        .eq('id', businessData.id)

      // Track store view if analytics is enabled
      if (hasAnalytics) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: businessData.id,
            type: 'view',
            metadata: { slug: params.slug }
          })
        })
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading store:', error)
      setLoading(false)
    }
  }

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  function addToCart(product) {
    // Track product view if analytics is enabled
    if (hasAnalytics && business) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          type: 'product_view',
          productId: product.id,
          metadata: { productName: product.name }
        })
      })
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  function updateQuantity(productId, delta) {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  function openProductModal(product) {
    setSelectedProduct(product)
    setModalQuantity(1)
    setProductModalOpen(true)
  }

  function closeProductModal() {
    setSelectedProduct(null)
    setProductModalOpen(false)
    setModalQuantity(1)
  }

  function addToCartFromModal() {
    if (!selectedProduct) return

    const updatedCart = [...cart]
    const existingItem = updatedCart.find(item => item.id === selectedProduct.id)

    if (existingItem) {
      existingItem.quantity += modalQuantity
    } else {
      updatedCart.push({ ...selectedProduct, quantity: modalQuantity })
    }

    setCart(updatedCart)
    localStorage.setItem(`cart-${business.id}`, JSON.stringify(updatedCart))

    // Track product view if analytics is enabled
    if (hasAnalytics && business) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          type: 'product_view',
          productId: selectedProduct.id,
          metadata: { productName: selectedProduct.name }
        })
      })
    }

    closeProductModal()
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  function checkoutWhatsApp() {
    if (!business || cart.length === 0) return

    // Track WhatsApp click if analytics is enabled
    if (hasAnalytics && business) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          type: 'whatsapp_click',
          metadata: {
            cartTotal: cartTotal,
            cartCount: cartCount,
            items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
          }
        })
      })
    }

    const message = cart.map(item =>
      `• ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`
    ).join('\n')

    const totalMessage = `\n\n*Total: ₦${cartTotal.toLocaleString()}*`

    const fullMessage = encodeURIComponent(
      `Hi! I'd like to order from ${business.name}:\n\n${message}${totalMessage}\n\nMy details:\nName: \nAddress: \nPhone: `
    )

    const whatsappUrl = `https://wa.me/${business.whatsapp_number.replace(/\D/g, '')}?text=${fullMessage}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <main className="store-shell">
        <div className="store-loading">Loading store...</div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="store-shell">
        <div className="store-error">
          <Store size={48} />
          <h2>Store not found</h2>
          <p>This store may not exist or has been deactivated.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="store-shell" style={{
      '--primary-color': customization?.primaryColor || '#10b981'
    }}>
      <nav className="store-nav">
        <div className="store-brand">
          <div className="store-avatar" style={{ backgroundColor: customization?.primaryColor || '#10b981' }}>
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{business.name}</strong>
            <small>{business.location || 'Online Store'}</small>
          </div>
        </div>
        <button
          className="cart-button"
          onClick={() => setCartOpen(true)}
          style={{ backgroundColor: customization?.primaryColor || '#10b981' }}
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </nav>

      <section className="store-hero">
        <div className="hero-content">
          <span className="hero-tag" style={{ backgroundColor: customization?.primaryColor || '#10b981' }}>
            Welcome to our store
          </span>
          <h1>{business.name}</h1>
          {business.description && <p>{business.description}</p>}
        </div>
      </section>

      <section className="store-content">
        <div className="store-filters">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
                style={{
                  backgroundColor: selectedCategory === category ? (customization?.primaryColor || '#10b981') : 'transparent',
                  color: selectedCategory === category ? 'white' : '#374151'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products Section */}
        {customization?.showFeaturedProducts && customization.featuredProductIds && customization.featuredProductIds.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Featured Products</h2>
            <div className="products-grid">
              {filteredProducts.filter(p => customization.featuredProductIds.includes(p.id)).map(product => (
                <div
                  key={product.id}
                  className="store-product-card"
                  onClick={() => openProductModal(product)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.image_url ? (
                    <div
                      className="store-product-image"
                      style={{ backgroundImage: `url(${product.image_url})` }}
                    />
                  ) : (
                    <div className="store-product-image placeholder">
                      <ShoppingBag size={32} />
                    </div>
                  )}
                  <div className="store-product-info">
                    {product.category && <span className="store-product-category">{product.category}</span>}
                    <h3>{product.name}</h3>
                    <p className="store-product-price">₦{product.price.toLocaleString()}</p>
                  </div>
                  <button
                    className="add-to-cart-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product)
                    }}
                    style={{ backgroundColor: customization?.primaryColor || '#10b981' }}
                  >
                    <ShoppingBag size={16} /> Add to cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals Section */}
        {customization?.showNewArrivals && customization.newArrivalProductIds && customization.newArrivalProductIds.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>New Arrivals</h2>
            <div className="products-grid">
              {filteredProducts.filter(p => customization.newArrivalProductIds.includes(p.id)).map(product => (
                <div
                  key={product.id}
                  className="store-product-card"
                  onClick={() => openProductModal(product)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.image_url ? (
                    <div
                      className="store-product-image"
                      style={{ backgroundImage: `url(${product.image_url})` }}
                    />
                  ) : (
                    <div className="store-product-image placeholder">
                      <ShoppingBag size={32} />
                    </div>
                  )}
                  <div className="store-product-info">
                    {product.category && <span className="store-product-category">{product.category}</span>}
                    <h3>{product.name}</h3>
                    <p className="store-product-price">₦{product.price.toLocaleString()}</p>
                  </div>
                  <button
                    className="add-to-cart-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product)
                    }}
                    style={{ backgroundColor: customization?.primaryColor || '#10b981' }}
                  >
                    <ShoppingBag size={16} /> Add to cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>All Products</h2>
        {filteredProducts.length === 0 ? (
          <div className="store-empty">
            <ShoppingBag size={48} />
            <h2>No products found</h2>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="store-product-card"
                onClick={() => openProductModal(product)}
                style={{ cursor: 'pointer' }}
              >
                {product.image_url ? (
                  <div
                    className="store-product-image"
                    style={{ backgroundImage: `url(${product.image_url})` }}
                  />
                ) : (
                  <div className="store-product-image placeholder">
                    <ShoppingBag size={32} />
                  </div>
                )}
                <div className="store-product-info">
                  {product.category && <span className="store-product-category">{product.category}</span>}
                  <h3>{product.name}</h3>
                  <p className="store-product-price">₦{product.price.toLocaleString()}</p>
                  {product.description && <p className="store-product-description">{product.description}</p>}
                </div>
                <button
                  className="add-to-cart-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(product)
                  }}
                  style={{ backgroundColor: customization?.primaryColor || '#10b981' }}
                >
                  <ShoppingBag size={16} /> Add to cart
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      {customization?.showAboutSection && business.description && (
        <section style={{
          background: '#f9fafb',
          padding: '32px',
          marginBottom: '32px',
          borderRadius: '8px'
        }}>
          <h2 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>About {business.name}</h2>
          <p style={{ color: '#6b7280', lineHeight: '1.6' }}>{business.description}</p>
        </section>
      )}

      {/* Contact Section */}
      {customization?.showContactSection && (
        <section style={{
          background: customization?.primaryColor || '#10b981',
          color: 'white',
          padding: '32px',
          marginBottom: '32px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>Contact Us</h2>
          <p style={{ marginBottom: '16px', opacity: 0.9 }}>
            Have questions? Reach out to us via WhatsApp
          </p>
          <a
            href={`https://wa.me/${business.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              color: customization?.primaryColor || '#10b981',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </a>
        </section>
      )}

      {cartOpen && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h2>Your Cart</h2>
            <button onClick={() => setCartOpen(false)} className="close-cart">
              <X size={20} />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    {item.image_url ? (
                      <div 
                        className="cart-item-image" 
                        style={{ backgroundImage: `url(${item.image_url})` }} 
                      />
                    ) : (
                      <div className="cart-item-image placeholder">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p>₦{item.price.toLocaleString()}</p>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>
                        <Minus size={16} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <button 
                      className="remove-item"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <strong>₦{cartTotal.toLocaleString()}</strong>
                </div>
                <button 
                  className="checkout-button"
                  onClick={checkoutWhatsApp}
                >
                  <MessageCircle size={18} /> Order via WhatsApp <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)} />
      )}

      {/* Product Detail Modal */}
      {productModalOpen && selectedProduct && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={closeProductModal}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                padding: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeProductModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1
                }}
              >
                <X size={24} />
              </button>

              {/* Product Image */}
              <div>
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShoppingBag size={64} style={{ color: '#d1d5db' }} />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedProduct.category && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    width: 'fit-content'
                  }}>
                    {selectedProduct.category}
                  </span>
                )}
                <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>
                  {selectedProduct.name}
                </h2>
                <p style={{ fontSize: '24px', fontWeight: '700', color: customization?.primaryColor || '#10b981', margin: 0 }}>
                  ₦{selectedProduct.price.toLocaleString()}
                </p>
                {selectedProduct.description && (
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    {selectedProduct.description}
                  </p>
                )}

                {/* Quantity Selector */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                    Quantity
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{
                      width: '60px',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={addToCartFromModal}
                  style={{
                    padding: '16px',
                    background: customization?.primaryColor || '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ShoppingBag size={20} />
                  Add to Cart - ₦{(selectedProduct.price * modalQuantity).toLocaleString()}
                </button>

                {/* Store Info */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                    Sold by <strong style={{ color: '#374151' }}>{business?.name}</strong>
                  </p>
                  {business?.location && (
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      📍 {business.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Platform branding - only shown for free plan */}
      {!canRemoveBranding && (
        <footer style={{
          textAlign: 'center',
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          marginTop: '40px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            Powered by <strong style={{ color: '#10b981' }}>Shopmini</strong>
          </span>
        </footer>
      )}
    </main>
  )
}
