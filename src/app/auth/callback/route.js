import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/dashboard'
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      if (!existing) {
        const metadata = user.user_metadata || {}
        const baseSlug = String(metadata.business_name || 'my-store').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-store'
        const { data: taken } = await supabase.from('businesses').select('slug').like('slug', `${baseSlug}%`)
        const suffix = taken?.length ? `-${taken.length + 1}` : ''
        await supabase.from('businesses').insert({ owner_id: user.id, name: metadata.business_name || 'My Store', slug: `${baseSlug}${suffix}`, owner_name: metadata.owner_name || null, email: user.email, phone: metadata.phone || null, whatsapp_number: metadata.phone || '0000000000', category: metadata.category || null })
      }
    }
  }
  return NextResponse.redirect(new URL(next, url.origin))
}
