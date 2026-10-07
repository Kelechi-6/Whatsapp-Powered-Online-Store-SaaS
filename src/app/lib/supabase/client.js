import { createBrowserClient } from '@supabase/ssr'

let client

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookieOptions: { secure: process.env.NODE_ENV === 'production' } },
    )
  }
  return client
}

export function getAuthRedirectUrl() {
  return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
}

export function formatAuthError(error) {
  if (!error) return ''
  const message = String(error.message || '').toLowerCase()
  if (message.includes('confirm') || message.includes('verification')) return 'Check your email to confirm your account before signing in.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (message.includes('password')) return 'Use a stronger password with at least 8 characters.'
  if (message.includes('invalid login') || message.includes('already registered') || message.includes('user already')) return 'Invalid email or password.'
  return 'Something went wrong. Please try again.'
}
