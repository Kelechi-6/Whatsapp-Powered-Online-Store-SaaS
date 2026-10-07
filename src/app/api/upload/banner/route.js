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
    const formData = await request.formData()
    const file = formData.get('file')
    const businessId = formData.get('businessId')

    if (!file || !businessId) {
      return NextResponse.json(
        { error: 'Missing file or businessId' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bannerBucket = buckets?.find(b => b.name === 'banner-images')

    if (!bannerBucket) {
      const { error: createError } = await supabaseAdmin.storage.createBucket('banner-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
      if (createError) {
        console.error('Error creating bucket:', createError)
        return NextResponse.json(
          { error: 'Failed to create storage bucket' },
          { status: 500 }
        )
      }
    }

    // Upload file
    const fileExt = file.name.split('.').pop()
    const fileName = `banner-${businessId}-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('banner-images')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('banner-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
