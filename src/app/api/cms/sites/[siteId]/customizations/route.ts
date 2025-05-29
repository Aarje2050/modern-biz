// src/app/api/cms/sites/[siteId]/customizations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

// GET /api/cms/sites/[siteId]/customizations - Get all customizations
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    const supabase = createClient()

    let query = supabase
      .from('site_customizations')
      .select('*')
      .eq('site_id', params.siteId)
      .eq('is_active', true)
      .order('section')

    if (section) {
      query = query.eq('section', section)
    }

    const { data: customizations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform to object with section as key
    const customizationsObj = (customizations || []).reduce((acc: any, item) => {
      acc[item.section] = item.settings
      return acc
    }, {})

    return NextResponse.json(customizationsObj)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customizations' }, { status: 500 })
  }
}

// PUT /api/cms/sites/[siteId]/customizations - Update customizations
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const { section, settings } = body

    if (!section) {
      return NextResponse.json({ error: 'Section is required' }, { status: 400 })
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings must be an object' }, { status: 400 })
    }

    const supabase = createClient()

    // Upsert customization
    const { data, error } = await supabase
      .from('site_customizations')
      .upsert({
        site_id: params.siteId,
        section,
        settings,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'site_id,section'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customization' }, { status: 500 })
  }
}

// POST /api/cms/sites/[siteId]/customizations/reset - Reset to defaults
export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const { section } = body

    const supabase = createClient()

    if (section) {
      // Reset specific section to defaults
      const defaultSettings = getDefaultSettings(section)
      
      const { data, error } = await supabase
        .from('site_customizations')
        .upsert({
          site_id: params.siteId,
          section,
          settings: defaultSettings,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'site_id,section'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(data)
    } else {
      // Reset all sections
      const sections = ['colors', 'typography', 'layout', 'header', 'footer', 'custom_css']
      const resetPromises = sections.map(sectionName => {
        const defaultSettings = getDefaultSettings(sectionName)
        return supabase
          .from('site_customizations')
          .upsert({
            site_id: params.siteId,
            section: sectionName,
            settings: defaultSettings,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'site_id,section'
          })
      })

      await Promise.all(resetPromises)
      return NextResponse.json({ message: 'All customizations reset to defaults' })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset customizations' }, { status: 500 })
  }
}

// Helper function to get default settings
function getDefaultSettings(section: string) {
  const defaults: Record<string, any> = {
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B', 
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text_primary: '#1F2937',
      text_secondary: '#6B7280',
      border: '#E5E7EB'
    },
    typography: {
      heading_font: 'Inter',
      body_font: 'Inter',
      font_sizes: {
        xs: '0.75rem',
        sm: '0.875rem', 
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      line_heights: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    layout: {
      container_width: '1200px',
      sidebar_width: '300px',
      header_height: '80px',
      footer_height: 'auto',
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem', 
        lg: '1.5rem',
        xl: '3rem'
      },
      border_radius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem'
      }
    },
    header: {
      logo_url: '',
      logo_width: '120px',
      show_tagline: true,
      sticky_header: false,
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      border_bottom: true,
      padding: {
        top: '1rem',
        bottom: '1rem'
      }
    },
    footer: {
      background_color: '#F8FAFC',
      text_color: '#6B7280',
      show_copyright: true,
      copyright_text: '© 2024 Site. All rights reserved.',
      show_social_links: true,
      social_links: [],
      columns: 3,
      padding: {
        top: '3rem',
        bottom: '2rem'
      }
    },
    custom_css: {
      css: '',
      enabled: false
    }
  }

  return defaults[section] || {}
}