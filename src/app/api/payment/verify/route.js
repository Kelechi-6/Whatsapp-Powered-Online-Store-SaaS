// app/api/payment/verify/route.js
import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
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
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.redirect(
        new URL('/dashboard/subscription?error=missing_reference', request.url)
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status || data.data.status !== 'success') {
      return NextResponse.redirect(
        new URL('/dashboard/subscription?error=payment_failed', request.url)
      )
    }

    // Get metadata from the transaction
    const { plan, userId, isUpgrade } = data.data.metadata

    // Regular client (uses user session, respects RLS)
    const supabase = await createClient()

    // Admin client (bypasses RLS for subscriptions writes)
    const supabaseAdmin = createAdminClient()

    if (isUpgrade) {
      // Update existing subscription
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()

      if (!businessData) {
        console.error('No business found for user:', userId)
        return NextResponse.redirect(new URL('/dashboard/setup', request.url))
      }

      console.log('Updating subscription for business:', businessData.id, 'to plan:', plan)

      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan,
          payment_reference: reference,
        })
        .eq('business_id', businessData.id)

      if (subError) {
        console.error('Subscription update error:', subError)
        return NextResponse.redirect(
          new URL('/dashboard/subscription?error=subscription_failed', request.url)
        )
      }

      console.log('Subscription updated successfully')
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      // Check if user already has a business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()

      if (businessData) {
        // User has a business, create/update subscription with business_id
        console.log('User has business, linking subscription:', businessData.id)
        
        // Check if subscription already exists for this business
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('business_id', businessData.id)
          .maybeSingle()

        if (existingSub) {
          // Update existing subscription
          const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              plan,
              payment_reference: reference,
            })
            .eq('id', existingSub.id)

          if (subError) {
            console.error('Subscription update error:', subError)
            return NextResponse.redirect(
              new URL('/dashboard/subscription?error=subscription_failed', request.url)
            )
          }
        } else {
          // Create new subscription with business_id
          const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              business_id: businessData.id,
              plan,
              status: 'active',
              payment_reference: reference,
            })

          if (subError) {
            console.error('Subscription creation error:', subError)
            return NextResponse.redirect(
              new URL('/dashboard/subscription?error=subscription_failed', request.url)
            )
          }
        }

        console.log('Subscription created/updated successfully, redirecting to dashboard')
        // Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        // User has no business, create subscription with null business_id and redirect to setup
        console.log('User has no business, redirecting to setup')
        
        const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
          business_id: null, // Will be updated after business creation
          plan,
          status: 'active',
          payment_reference: reference,
        })

        if (subError) {
          console.error('Subscription creation error:', subError)
          return NextResponse.redirect(
            new URL('/dashboard/subscription?error=subscription_failed', request.url)
          )
        }

        // Redirect to setup
        return NextResponse.redirect(
          new URL(`/dashboard/setup?plan=${plan}`, request.url)
        )
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/subscription?error=verification_failed', request.url)
    )
  }
}