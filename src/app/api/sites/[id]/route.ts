// src/app/api/sites/[id]/route.ts (Debug Version)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PUT API CALLED ===')
  
  try {
    console.log('1. Getting supabase client...')
    const supabase = createClient()
    
    console.log('2. Parsing request body...')
    const body = await request.json()
    console.log('Body received:', body)
    
    console.log('3. Getting params...')
    const { id } = params
    console.log('Site ID:', id)
    
    const { domain, name, config } = body
    
    if (!domain || !name) {
      console.log('4. Validation failed - missing domain or name')
      return NextResponse.json(
        { error: 'Domain and name are required' }, 
        { status: 400 }
      )
    }

    console.log('5. Generating slug...')
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    console.log('Generated slug:', slug)

    console.log('6. First, check if site exists...')
    const { data: existingSite, error: checkError } = await supabase
      .from('sites')
      .select('id, domain, name')
      .eq('id', id)
      .single()

    if (checkError || !existingSite) {
      console.error('7. Site not found:', checkError)
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    console.log('7. Site exists:', existingSite)
    console.log('8. Updating in database...')
    
    const { data: updatedSites, error } = await supabase
      .from('sites')
      .update({
        domain,
        name,
        slug,
        config: config || {}
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('9. Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updatedSites || updatedSites.length === 0) {
      console.error('10. No rows updated')
      return NextResponse.json({ error: 'Failed to update site' }, { status: 500 })
    }

    const site = updatedSites[0]

    console.log('11. Success! Updated site:', site)
    return NextResponse.json(site)
    
  } catch (error) {
    console.error('=== API ERROR ===', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, 
      { status: 500 }
    )
  }
}