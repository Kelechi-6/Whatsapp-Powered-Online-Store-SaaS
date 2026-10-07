import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { businessId, type, productId, metadata } = body

    if (!businessId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Create analytics record
    const { error: analyticsError } = await supabaseAdmin
      .from('analytics')
      .insert({
        business_id: businessId,
        type, // 'view', 'product_view', 'whatsapp_click', 'order'
        product_id: productId || null,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })

    if (analyticsError) {
      console.error('Analytics tracking error:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ success: true }) // Don't fail the request
  }
}
