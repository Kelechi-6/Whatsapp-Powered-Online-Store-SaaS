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
      // Check if subscription has expired
      if (subData.end_date && new Date(subData.end_date) < new Date()) {
        // Subscription has expired, downgrade to free plan
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            end_date: null
          })
          .eq('id', subData.id)

        if (!updateError) {
          // Return updated free plan subscription
          return NextResponse.json({
            ...subData,
            plan: 'free',
            end_date: null
          })
        }
      }

      // If subscription is missing start_date or end_date (for existing subscriptions), add them
      if (!subData.start_date || !subData.end_date) {
        const startDate = new Date().toISOString()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        const endDateISO = endDate.toISOString()

        const { data: updatedSub } = await supabaseAdmin
          .from('subscriptions')
          .update({
            start_date: startDate,
            end_date: endDateISO
          })
          .eq('id', subData.id)
          .select()
          .single()

        if (updatedSub) {
          return NextResponse.json(updatedSub)
        }
      }

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
