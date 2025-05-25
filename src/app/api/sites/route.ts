// src/app/api/sites/route.ts (Debug Version)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sites)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('=== POST SITES API CALLED ===')
  
  try {
    console.log('1. Creating supabase client...')
    const supabase = createClient()
    
    console.log('2. Parsing request body...')
    const body = await request.json()
    console.log('Body received:', JSON.stringify(body, null, 2))
    
    const { domain, name, config } = body
    
    console.log('3. Validating inputs...')
    if (!domain || !name) {
      console.log('Validation failed - missing domain or name')
      return NextResponse.json(
        { error: 'Domain and name are required' }, 
        { status: 400 }
      )
    }

    console.log('4. Generating slug...')
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    console.log('Generated slug:', slug)

    console.log('5. Checking user auth...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('User:', user?.id)
    console.log('Auth error:', authError)

    console.log('6. Checking admin status...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single()
    
    console.log('Profile:', profile)
    console.log('Profile error:', profileError)

    console.log('7. Inserting site...')
    const insertData = {
      domain,
      name,
      slug,
      config: config || {}
    }
    console.log('Insert data:', JSON.stringify(insertData, null, 2))

    const { data: site, error } = await supabase
      .from('sites')
      .insert(insertData)
      .select()
      .single()

    console.log('8. Insert result:')
    console.log('Site data:', site)
    console.log('Insert error:', error)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code 
      }, { status: 500 })
    }

    console.log('9. Success!')
    return NextResponse.json(site, { status: 201 })
    
  } catch (error) {
    console.error('=== CRITICAL ERROR ===', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: (error as Error).message,
        stack: (error as Error).stack 
      }, 
      { status: 500 }
    )
  }
}