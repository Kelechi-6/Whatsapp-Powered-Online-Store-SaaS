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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing businessId' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // First try to find subscription by business_id
    const { data: subData } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle()

    if (subData) {
      return NextResponse.json(subData)
    }

    // If not found, check for subscription with null business_id
    const { data: nullSubData } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .is('business_id', null)
      .limit(1)

    if (nullSubData && nullSubData.length > 0) {
      // Update it with the business_id
      const { data: updatedSub } = await supabaseAdmin
        .from('subscriptions')
        .update({ business_id: businessId })
        .eq('id', nullSubData[0].id)
        .select()
        .single()

      return NextResponse.json(updatedSub)
    }

    // No subscription found, return null
    return NextResponse.json(null)
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
