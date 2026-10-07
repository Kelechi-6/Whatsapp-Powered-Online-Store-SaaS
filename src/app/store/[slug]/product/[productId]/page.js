// 'use client'

// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { createClient } from '../../../../lib/supabase/client'
// import {
//   ShoppingBag,
//   ArrowLeft,
//   MessageCircle,
//   Plus,
//   Minus,
//   Store
// } from 'lucide-react'

// export default function ProductDetailPage() {
//   const params = useParams()
//   const router = useRouter()
//   const [business, setBusiness] = useState(null)
//   const [product, setProduct] = useState(null)
//   const [cart, setCart] = useState([])
//   const [quantity, setQuantity] = useState(1)
//   const [loading, setLoading] = useState(true)
//   const [customization, setCustomization] = useState(null)

//   useEffect(() => {
//     loadProductData()
//   }, [params.slug, params.productId])

//   async function loadProductData() {
//     try {
//       const supabase = createClient()

//       // Load business
//       const { data: businessData } = await supabase
//         .from('businesses')
//         .select('*')
//         .eq('slug', params.slug)
//         .eq('is_active', true)
//         .single()

//       if (!businessData) {
//         setLoading(false)
//         return
//       }

//       setBusiness(businessData)

//       // Load customization settings
//       if (businessData.customization_settings) {
//         setCustomization(businessData.customization_settings)
//       }

//       // Load product
//       const { data: productData } = await supabase
//         .from('products')
//         .select('*')
//         .eq('id', params.productId)
//         .eq('business_id', businessData.id)
//         .single()

//       if (!productData) {
//         setLoading(false)
//         return
//       }

//       setProduct(productData)

//       // Load cart from localStorage
//       const savedCart = localStorage.getItem(`cart-${businessData.id}`)
//       if (savedCart) {
//         setCart(JSON.parse(savedCart))
//       }

//       setLoading(false)
//     } catch (error) {
//       console.error('Error loading product:', error)
//       setLoading(false)
//     }
//   }

//   function addToCart() {
//     if (!product) return

//     const updatedCart = [...cart]
//     const existingItem = updatedCart.find(item => item.id === product.id)

//     if (existingItem) {
//       existingItem.quantity += quantity
//     } else {
//       updatedCart.push({ ...product, quantity })
//     }

//     setCart(updatedCart)
//     localStorage.setItem(`cart-${business.id}`, JSON.stringify(updatedCart))

//     // Track product view if analytics is enabled
//     if (business) {
//       fetch('/api/analytics/track', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           businessId: business.id,
//           type: 'product_view',
//           productId: product.id,
//           metadata: { productName: product.name }
//         })
//       })
//     }
//   }

//   function checkoutWhatsApp() {
//     if (!business || cart.length === 0) return

//     const message = cart.map(item =>
//       `• ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`
//     ).join('\n')

//     const totalMessage = `\n\n*Total: ₦${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}*`

//     const fullMessage = encodeURIComponent(
//       `Hi! I'd like to order from ${business.name}:\n\n${message}${totalMessage}\n\nMy details:\nName: \nAddress: \nPhone: `
//     )

//     const whatsappUrl = `https://wa.me/${business.whatsapp_number.replace(/\D/g, '')}?text=${fullMessage}`
//     window.open(whatsappUrl, '_blank')
//   }

//   if (loading) {
//     return (
//       <main className="store-shell">
//         <div className="store-loading">Loading...</div>
//       </main>
//     )
//   }

//   if (!product || !business) {
//     return (
//       <main className="store-shell">
//         <div className="store-error">
//           <Store size={48} />
//           <h2>Product not found</h2>
//           <p>This product may not exist or has been removed.</p>
//           <button
//             onClick={() => router.push(`/store/${params.slug}`)}
//             style={{
//               marginTop: '16px',
//               padding: '12px 24px',
//               background: '#10b981',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer',
//               fontSize: '14px',
//               fontWeight: '600'
//             }}
//           >
//             Back to Store
//           </button>
//         </div>
//       </main>
//     )
//   }

//   const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
//   const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

//   return (
//     <main className="store-shell" style={{
//       '--primary-color': customization?.primaryColor || '#10b981'
//     }}>
//       {/* Navigation */}
//       <nav className="store-nav">
//         <button
//           onClick={() => router.push(`/store/${params.slug}`)}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             background: 'none',
//             border: 'none',
//             color: '#374151',
//             cursor: 'pointer',
//             fontSize: '14px',
//             fontWeight: '500'
//           }}
//         >
//           <ArrowLeft size={18} />
//           Back to {business.name}
//         </button>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//           <span style={{ fontSize: '14px', color: '#6b7280' }}>
//             {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
//           </span>
//           <button
//             onClick={checkoutWhatsApp}
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//               padding: '10px 20px',
//               background: customization?.primaryColor || '#10b981',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer',
//               fontSize: '14px',
//               fontWeight: '600'
//             }}
//           >
//             <MessageCircle size={16} />
//             Checkout
//           </button>
//         </div>
//       </nav>

//       {/* Product Details */}
//       <section style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
//           {/* Product Image */}
//           <div>
//             {product.image_url ? (
//               <div
//                 style={{
//                   width: '100%',
//                   aspectRatio: '1',
//                   borderRadius: '12px',
//                   overflow: 'hidden',
//                   background: '#f9fafb',
//                   border: '1px solid #e5e7eb'
//                 }}
//               >
//                 <img
//                   src={product.image_url}
//                   alt={product.name}
//                   style={{
//                     width: '100%',
//                     height: '100%',
//                     objectFit: 'cover'
//                   }}
//                 />
//               </div>
//             ) : (
//               <div
//                 style={{
//                   width: '100%',
//                   aspectRatio: '1',
//                   borderRadius: '12px',
//                   background: '#f9fafb',
//                   border: '1px solid #e5e7eb',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}
//               >
//                 <ShoppingBag size={64} style={{ color: '#d1d5db' }} />
//               </div>
//             )}
//           </div>

//           {/* Product Info */}
//           <div>
//             {product.category && (
//               <span style={{
//                 display: 'inline-block',
//                 padding: '4px 12px',
//                 background: '#f3f4f6',
//                 color: '#6b7280',
//                 borderRadius: '20px',
//                 fontSize: '12px',
//                 fontWeight: '600',
//                 marginBottom: '12px'
//               }}>
//                 {product.category}
//               </span>
//             )}
//             <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', lineHeight: '1.2' }}>
//               {product.name}
//             </h1>
//             <p style={{ fontSize: '28px', fontWeight: '700', color: customization?.primaryColor || '#10b981', marginBottom: '16px' }}>
//               ₦{product.price.toLocaleString()}
//             </p>
//             {product.description && (
//               <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '24px' }}>
//                 {product.description}
//               </p>
//             )}

//             {/* Quantity Selector */}
//             <div style={{ marginBottom: '24px' }}>
//               <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
//                 Quantity
//               </label>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '6px',
//                     background: 'white',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                   }}
//                 >
//                   <Minus size={18} />
//                 </button>
//                 <span style={{
//                   width: '60px',
//                   textAlign: 'center',
//                   fontSize: '18px',
//                   fontWeight: '600'
//                 }}>
//                   {quantity}
//                 </span>
//                 <button
//                   onClick={() => setQuantity(quantity + 1)}
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '6px',
//                     background: 'white',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                   }}
//                 >
//                   <Plus size={18} />
//                 </button>
//               </div>
//             </div>

//             {/* Add to Cart Button */}
//             <button
//               onClick={addToCart}
//               style={{
//                 width: '100%',
//                 padding: '16px',
//                 background: customization?.primaryColor || '#10b981',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 cursor: 'pointer',
//                 fontSize: '16px',
//                 fontWeight: '600',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 gap: '8px',
//                 marginBottom: '16px'
//               }}
//             >
//               <ShoppingBag size={20} />
//               Add to Cart - ₦{(product.price * quantity).toLocaleString()}
//             </button>

//             {/* Store Info */}
//             <div style={{
//               padding: '16px',
//               background: '#f9fafb',
//               borderRadius: '8px',
//               border: '1px solid #e5e7eb'
//             }}>
//               <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
//                 Sold by <strong style={{ color: '#374151' }}>{business.name}</strong>
//               </p>
//               {business.location && (
//                 <p style={{ fontSize: '14px', color: '#6b7280' }}>
//                   📍 {business.location}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Platform branding */}
//       {!customization?.removeBranding && (
//         <footer style={{
//           textAlign: 'center',
//           padding: '20px',
//           borderTop: '1px solid #e5e7eb',
//           marginTop: '40px',
//           fontSize: '13px',
//           color: '#6b7280'
//         }}>
//           <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
//             Powered by <strong style={{ color: '#10b981' }}>Shopmini</strong>
//           </span>
//         </footer>
//       )}
//     </main>
//   )
// }
