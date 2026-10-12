import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, amount, plan, userId, isUpgrade } = body

    if (!email || !amount || !plan || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Initialize Paystack transaction
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    const callbackUrl = `${protocol}://${host}/api/payment/verify`

    console.log('Payment callback URL:', callbackUrl)

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        metadata: {
          plan,
          userId,
          isUpgrade: isUpgrade || false
        },
        callback_url: callbackUrl
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { error: data.message || 'Payment initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
