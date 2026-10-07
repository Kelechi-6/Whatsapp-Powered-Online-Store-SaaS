'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Instagram,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Play,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from 'lucide-react'
import { getPlansForDisplay } from '../lib/plans'

const products = [
  { name: 'The Everyday Tote', price: '₦18,500', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=700&q=85', tag: 'Bags' },
  { name: 'Luna Heel', price: '₦32,000', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85', tag: 'Shoes' },
  { name: 'Satin Slip Dress', price: '₦24,900', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=85', tag: 'Clothing' },
  { name: 'Mini Hoops', price: '₦8,500', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85', tag: 'Accessories' },
]

const faqs = [
  ['Do my customers need an account?', 'No. Customers shop as guests and go straight from your storefront to WhatsApp.'],
  ['Do you process payments?', 'No. You and your customer agree on payment and delivery directly in WhatsApp.'],
  ['Can I use my Instagram link?', 'Yes. Your store is fast and mobile-first, so it works beautifully from Instagram and TikTok.'],
  ['How does WhatsApp checkout work?', 'We format the cart and customer details into a ready-to-send message addressed to your business number.'],
]

// Derive plans from canonical config
const plans = getPlansForDisplay().map(config => ({
  id: config.id,
  name: config.name,
  price: config.price,
  period: config.period,
  text: config.id === 'free' ? 'For getting started' : config.id === 'starter' ? 'For growing businesses' : 'For established brands',
  features: getFeatureList(config.id),
  featured: config.id === 'starter'
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

export default function Page() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard?.writeText('shopmini.co/store/kellys-fashion')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handlePlanSelect = (plan) => {
    window.location.href = `/auth/sign-up?plan=${plan}`
  }

  return (
    <main className="site-shell">
      <nav className="nav-wrap" aria-label="Main navigation">
        <a href="#top" className="brand"><span className="brand-mark"><Store size={18} /></span>shopmini</a>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
          <a href="/auth/login" className="nav-login">Log in</a>
          <button className="button button-dark nav-cta" onClick={() => setDemoOpen(true)}>Create your store <ArrowRight size={16} /></button>
        </div>
        <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </nav>

      <section className="hero container" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Built for small businesses</div>
          <h1>Your products online.<br /><em>Your orders on WhatsApp.</em></h1>
          <p className="hero-sub">Create a simple online store for your business and let customers browse, add to cart, and order directly through WhatsApp.</p>
          <div className="hero-actions"><button className="button button-dark" onClick={() => setDemoOpen(true)}>Create your store <ArrowRight size={17} /></button><button className="button button-ghost" onClick={() => setDemoOpen(true)}><span className="play-icon"><Play size={12} fill="currentColor" /></span> View demo store</button></div>
          <div className="hero-proof"><div className="avatar-stack"><span>AK</span><span>MI</span><span>TO</span><span>+2k</span></div><span>Loved by 2,000+ small businesses</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="phone-frame">
            <div className="phone-top"><span className="phone-notch" /></div>
            <div className="phone-store-head"><div className="mini-avatar">K</div><div><strong>Kelly&apos;s Fashion</strong><small>Port Harcourt, Nigeria</small></div><span className="icon-circle"><Search size={14} /></span></div>
            <div className="phone-banner"><div><small>NEW SEASON</small><strong>Find your<br />everyday style.</strong><button>Shop now <ArrowRight size={11} /></button></div></div>
            <div className="phone-categories"><span className="active">All</span><span>New in</span><span>Shoes</span><span>Bags</span></div>
            <div className="phone-products">{products.slice(0, 2).map((product) => <div className="phone-product" key={product.name}><div className="phone-product-img" style={{ backgroundImage: `url(${product.image})` }} /><strong>{product.name}</strong><small>{product.price}</small></div>)}</div>
            <div className="floating-cart"><ShoppingBag size={15} /><span>2 items</span><b>₦50,500</b></div>
          </div>
          <div className="float-note note-orders"><span className="note-icon green"><MessageCircle size={16} /></span><div><b>New order received</b><small>Just now via WhatsApp</small></div><Check size={16} className="check" /></div>
          <div className="float-note note-link"><span className="note-icon peach"><Share2 size={16} /></span><div><b>shopmini.co/kellys</b><small>Your store is live</small></div></div>
        </div>
      </section>

      <section className="logo-strip"><div className="container logo-row"><span>MADE FOR THE BUSINESSES<br />BUILDING THE FUTURE</span><b>myntra.</b><b className="serif-logo">elle<span>v</span></b><b className="script-logo">amaka</b><b>AFRIK<span className="orange">A</span></b><b className="mono-logo">NOIR</b></div></section>

      <section className="section container" id="how-it-works"><div className="section-heading"><div><span className="kicker">SIMPLE BY DESIGN</span><h2>From idea to order<br /><em>in a few clicks.</em></h2></div><p>Everything you need to start selling online, without everything that gets in the way.</p></div><div className="steps-grid"><Step number="01" icon={<Package />} title="Add your products" text="Upload your bestsellers, set your prices, and make your catalog yours." /><Step number="02" icon={<Share2 />} title="Share your store link" text="Put one beautiful link in your Instagram bio, TikTok, and everywhere else." /><Step number="03" icon={<MessageCircle />} title="Orders land on WhatsApp" text="Your customer’s cart arrives formatted and ready to confirm in a message." /></div></section>

      <section className="feature-band" id="features"><div className="container feature-layout"><div className="feature-image"><div className="image-label"><Sparkles size={15} /> No code. No stress.</div><div className="dashboard-card"><div className="dash-top"><span className="brand-dot" /><b>Good afternoon, Kelly</b><span className="dash-avatar">K</span></div><div className="dash-stat-row"><div><small>STORE VIEWS</small><strong>12,480 <span>↗ 18.4%</span></strong></div><div><small>ORDERS SENT</small><strong>284 <span>↗ 12.8%</span></strong></div></div><div className="chart"><span className="chart-line" /><div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="dash-order"><span className="order-avatar">JD</span><div><b>New order from John Doe</b><small>3 items · ₦65,000</small></div><span className="order-pill">WhatsApp</span></div></div></div><div className="feature-copy"><span className="kicker">EVERYTHING IN ONE PLACE</span><h2>Look professional.<br /><em>Stay in control.</em></h2><p>Run your storefront from one clear, calm dashboard. No jargon, no clutter — just the things that help you sell.</p><ul><li><span><Palette size={17} /></span><div><b>Make it feel like you</b><small>Pick your colors, layout, and brand details.</small></div></li><li><span><MessageCircle size={17} /></span><div><b>WhatsApp, built in</b><small>Every order goes to the right number automatically.</small></div></li><li><span><Share2 size={17} /></span><div><b>Share everywhere</b><small>One link, QR code, and easy social sharing.</small></div></li></ul><button className="text-link" onClick={() => setDemoOpen(true)}>See how it works <ArrowRight size={16} /></button></div></div></section>

      <section className="section container audience"><div className="center-heading"><span className="kicker">MADE FOR YOUR KIND OF BUSINESS</span><h2>Small business.<br /><em>Big presence.</em></h2><p>Whether you sell from a shelf, a studio, or your spare room — shopmini gives you a store that keeps up.</p></div><div className="audience-grid">{['Fashion vendors','Shoe sellers','Beauty & cosmetics','Food vendors','Jewelry & gifts','Instagram businesses'].map((name, index) => <div className={`audience-card tone-${index + 1}`} key={name}><div className="audience-photo" style={{ backgroundImage: `url(${products[index % products.length].image})` }} /><span>{name}</span><ArrowRight size={16} /></div>)}</div></section>

      <section className="pricing-section" id="pricing"><div className="container"><div className="center-heading"><span className="kicker">START SIMPLE. GROW FREELY.</span><h2>A plan for every<br /><em>stage of your journey.</em></h2><p>Start free, get your first orders, and upgrade when you’re ready for more.</p></div><div className="pricing-grid"><Price name="Free" price="₦0" text="For getting started" features={['Up to 10 products', 'Basic storefront', 'WhatsApp checkout', 'Basic customization']} onSelect={handlePlanSelect} /><Price name="Starter" price="₦5,000" text="For growing businesses" features={['Unlimited products', 'Custom branding', 'Delivery settings', 'Store analytics']} featured onSelect={handlePlanSelect} /><Price name="Pro" price="₦12,000" text="For established brands" features={['Everything in Starter', 'Advanced analytics', 'Custom domain support', 'Priority support']} onSelect={handlePlanSelect} /></div></div></section>

      <section className="section container faq-section" id="faq"><div className="faq-intro"><span className="kicker">GOOD TO KNOW</span><h2>Questions,<br /><em>answered.</em></h2><p>Still curious? We’re here to help you get selling.</p><button className="text-link">Talk to us <ArrowRight size={16} /></button></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><ChevronDown size={18} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>

      <section className="final-cta"><div className="container final-inner"><div><span className="kicker">YOUR NEXT CUSTOMER IS OUT THERE</span><h2>Ready to put your<br /><em>business online?</em></h2><p>Set up your store in minutes. No credit card required.</p></div><button className="button button-light" onClick={() => setDemoOpen(true)}>Create your store <ArrowRight size={17} /></button></div></section>
      <footer><div className="container footer-inner"><a href="#top" className="brand"><span className="brand-mark"><Store size={18} /></span>shopmini</a><span>Simple stores for ambitious small businesses.</span><div><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">Help</a><a href="#login">Log in</a></div><small> 2026 shopmini</small></div></footer>

      {demoOpen && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" onClick={() => setDemoOpen(false)} aria-label="Close"><X size={18} /></button><div className="modal-kicker"><Sparkles size={15} /> YOUR STORE, IN MINUTES</div><h2>Let&apos;s get your business online.</h2><p>Create your free shopmini store and start sharing your link today.</p><label>Business name<input placeholder="e.g. Kelly's Fashion" autoFocus /></label><label>WhatsApp number<input placeholder="080 1234 5678" /></label><button className="button button-dark modal-submit" onClick={() => { window.location.href = '/auth/sign-up' }}>Create my store <ArrowRight size={16} /></button><small>No credit card required. Free forever plan included.</small></div></div>}
    </main>
  )
}

function Step({ number, icon, title, text }) { return <div className="step-card"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p><a href="#features">Learn more <ArrowRight size={14} /></a></div> }
function Price({ name, price, text, features, featured, onSelect }) { 
  const planMap = { 'Free': 'free', 'Starter': 'starter', 'Pro': 'pro' }
  return (
    <div className={`price-card ${featured ? 'featured' : ''}`}>
      {featured && <span className="popular">MOST POPULAR</span>}
      <h3>{name}</h3>
      <p>{text}</p>
      <div className="price"><strong>{price}</strong><span>/ month</span></div>
      <button 
        className={`button ${featured ? 'button-dark' : 'button-outline'}`}
        onClick={() => onSelect(planMap[name])}
      >
        Get started <ArrowRight size={15} />
      </button>
      <ul>{features.map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
    </div>
  )
}

// Note: The plans array in the pricing section should be derived from lib/plans.ts
// This is a placeholder for future refactoring to use the canonical config

export { copyLink }
