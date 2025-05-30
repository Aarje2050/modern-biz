// src/app/api/cms/sites/[siteId]/templates/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RequestBody {
  page_templates: Record<string, string>
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // Parse request body
    const body: RequestBody = await request.json()
    const { page_templates } = body

    // Validate request
    if (!page_templates || typeof page_templates !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request: page_templates is required and must be an object' 
        },
        { status: 400 }
      )
    }

    // Validate site ID
    if (!params.siteId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Site ID is required' 
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify site exists
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('id', params.siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Site not found' 
        },
        { status: 404 }
      )
    }

    // Update or insert site customizations
    const { error: upsertError } = await supabase
      .from('site_customizations')
      .upsert(
        {
          site_id: params.siteId,
          section: 'templates',
          settings: { page_templates },
          page_templates: page_templates,
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'site_id,section'
        }
      )

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to save template preferences. Please try again.' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Templates saved successfully'
    })

  } catch (error) {
    console.error('API route error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method to retrieve current templates
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    if (!params.siteId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Site ID is required' 
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('site_customizations')
      .select('page_templates, updated_at')
      .eq('site_id', params.siteId)
      .eq('section', 'templates')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database select error:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to retrieve templates' 
        },
        { status: 500 }
      )
    }

    // Return default templates if none found
    const defaultTemplates = {
      about: 'template-v1',
      contact: 'template-v1'
    }

    return NextResponse.json({
      success: true,
      data: {
        page_templates: data?.page_templates || defaultTemplates,
        updated_at: data?.updated_at || null
      }
    })

  } catch (error) {
    console.error('API route error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}