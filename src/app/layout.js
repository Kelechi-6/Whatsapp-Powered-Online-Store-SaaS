// import { Analytics } from '@vercel/analytics/next'
// import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata = {
  title: 'Shopmini',
  description: 'A lightweight SaaS platform that helps small businesses create online product catalogs and receive customer orders directly through WhatsApp.',
  generator: 'WhatsApp-Powered Online Store SaaS',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}