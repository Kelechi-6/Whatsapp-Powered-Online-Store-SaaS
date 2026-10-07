import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { checkProductLimit, PlanError, createPlanErrorResponse } from '../../../lib/plan-enforcement'

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
    const { businessId, name, price, description, imageUrl } = body

    if (!businessId || !name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check product limit
    const { canAdd, remaining, plan } = await checkProductLimit(businessId)

    if (!canAdd) {
      return NextResponse.json(
        createPlanErrorResponse(PlanError.PRODUCT_LIMIT_REACHED, plan),
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Create product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        business_id: businessId,
        name: name.trim(),
        price: parseFloat(price),
        description: description?.trim() || null,
        image_url: imageUrl || null,
      })
      .select()
      .single()

    if (productError) {
      console.error('Product creation error:', productError)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
