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
    const { businessId, plan } = body

    if (!businessId || !plan) {
      return NextResponse.json(
        { error: 'Missing businessId or plan' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // First check if there's an existing subscription with null business_id
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .is('business_id', null)
      .limit(1)

    if (existingSub && existingSub.length > 0) {
      // Calculate end date based on plan (1 month for paid plans)
      const startDate = new Date().toISOString()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)
      const endDateISO = endDate.toISOString()

      // Update existing subscription with business_id and plan
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          business_id: businessId,
          plan: plan,
          status: 'active',
          start_date: startDate,
          end_date: endDateISO
        })
        .eq('id', existingSub[0].id)

      if (updateError) {
        console.error('Subscription update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }
    } else {
      // Check if subscription already exists for this business
      const { data: businessSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle()

      if (businessSub) {
        // Calculate end date based on plan (1 month for paid plans)
        const startDate = new Date().toISOString()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        const endDateISO = endDate.toISOString()

        // Update existing subscription
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: plan,
            status: 'active',
            start_date: startDate,
            end_date: endDateISO
          })
          .eq('id', businessSub.id)

        if (updateError) {
          console.error('Subscription update error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          )
        }
      } else {
        // Calculate end date based on plan (1 month for paid plans)
        const startDate = new Date().toISOString()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        const endDateISO = endDate.toISOString()

        // Create new subscription
        const { error: insertError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            business_id: businessId,
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
      }
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
