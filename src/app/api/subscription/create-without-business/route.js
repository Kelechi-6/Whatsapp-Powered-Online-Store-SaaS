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
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing userId or plan' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Check if subscription already exists for this user (with null business_id)
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .is('business_id', null)
      .limit(1)

    if (existingSub && existingSub.length > 0) {
      // Subscription already exists, no need to create another
      return NextResponse.json({ success: true, message: 'Subscription already exists' })
    }

    // Create new subscription with null business_id
    const startDate = new Date().toISOString()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateISO = endDate.toISOString()

    const { error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        business_id: null, // Will be updated after business creation
        plan: plan,
        status: 'active',
        payment_reference: null,
        start_date: startDate,
        end_date: endDateISO
      })

    if (insertError) {
      console.error('Subscription creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
