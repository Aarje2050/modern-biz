// src/app/api/crm/leads/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBusinessAccess, validateCRMPermissions } from '@/lib/middleware/crm-access'

export async function GET(request: NextRequest) {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { searchParams } = new URL(request.url)
      const businessId = searchParams.get('business_id')
      const stage = searchParams.get('stage')
      const assignedTo = searchParams.get('assigned_to')
  
      if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
      }
  
      // Validate user has access to this business
      const hasAccess = await validateBusinessAccess(user.id, businessId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Validate CRM permissions
      const crmPermissions = await validateCRMPermissions(user.id, businessId)
      if (!crmPermissions.canViewLeads) {
        return NextResponse.json({ error: 'CRM access denied' }, { status: 403 })
      }
  
      // Build query
      let query = supabase
        .from('crm_leads')
        .select(`
          *,
          contact:crm_contacts(*),
          assigned_user:profiles!assigned_to(id, full_name, avatar_url),
          interactions:crm_interactions(count),
          tasks:crm_tasks(count)
        `)
        .eq('business_id', businessId)
  
      // Apply filters
      if (stage) {
        query = query.eq('stage', stage)
      }
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo)
      }
  
      const { data: leads, error } = await query
        .order('created_at', { ascending: false })
  
      if (error) {
        console.error('Error fetching leads:', error)
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
      }
  
      return NextResponse.json({ leads })
  
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function POST(request: NextRequest) {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const body = await request.json()
      const {
        business_id,
        contact_id,
        title,
        description,
        value_estimate,
        currency = 'USD',
        stage = 'new',
        priority = 'medium',
        probability = 0,
        expected_close_date,
        assigned_to,
        source,
        source_details = {},
        custom_fields = {},
        tags = [],
        notes
      } = body
  
      if (!business_id || !contact_id || !title) {
        return NextResponse.json({ 
          error: 'Business ID, contact ID, and title are required' 
        }, { status: 400 })
      }
  
      // Validate user has access to this business
      const hasAccess = await validateBusinessAccess(user.id, business_id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Validate CRM permissions
      const crmPermissions = await validateCRMPermissions(user.id, business_id)
      if (!crmPermissions.canEditLeads) {
        return NextResponse.json({ error: 'CRM edit access denied' }, { status: 403 })
      }
  
      // Verify contact exists and belongs to this business
      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('id', contact_id)
        .eq('business_id', business_id)
        .single()
  
      if (contactError || !contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
  
      // Create the lead
      const { data: lead, error } = await supabase
        .from('crm_leads')
        .insert({
          business_id,
          contact_id,
          title,
          description,
          value_estimate,
          currency,
          stage,
          priority,
          probability,
          expected_close_date,
          assigned_to: assigned_to || user.id,
          source,
          source_details,
          custom_fields,
          tags,
          notes,
          created_by: user.id
        })
        .select(`
          *,
          contact:crm_contacts(*),
          assigned_user:profiles!assigned_to(id, full_name, avatar_url)
        `)
        .single()
  
      if (error) {
        console.error('Error creating lead:', error)
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
      }
  
      return NextResponse.json({ lead }, { status: 201 })
  
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  