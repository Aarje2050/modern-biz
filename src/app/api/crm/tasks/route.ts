// src/app/api/crm/tasks/route.ts

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
      const status = searchParams.get('status')
      const assignedTo = searchParams.get('assigned_to')
      const dueDateFilter = searchParams.get('due_date') // 'overdue', 'today', 'this_week'
  
      if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
      }
  
      // Validate user has access to this business
      const hasAccess = await validateBusinessAccess(user.id, businessId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Build query
      let query = supabase
        .from('crm_tasks')
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, email),
          lead:crm_leads(id, title),
          assigned_user:profiles!assigned_to(id, full_name, avatar_url)
        `)
        .eq('business_id', businessId)
  
      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo)
      }
  
      // Apply due date filters
      if (dueDateFilter) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (dueDateFilter) {
          case 'overdue':
            query = query.lt('due_date', today.toISOString()).neq('status', 'completed')
            break
          case 'today':
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString())
            break
          case 'this_week':
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)
            query = query.gte('due_date', today.toISOString()).lt('due_date', weekEnd.toISOString())
            break
        }
      }
  
      // To this:
const { data: tasks, error } = await query
.order('due_date', { ascending: true, nullsFirst: false })
  
      if (error) {
        console.error('Error fetching tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
      }
  
      return NextResponse.json({ tasks })
  
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
        lead_id,
        title,
        description,
        type = 'follow_up',
        priority = 'medium',
        due_date,
        assigned_to
      } = body
  
      if (!business_id || !title) {
        return NextResponse.json({ 
          error: 'Business ID and title are required' 
        }, { status: 400 })
      }
  
      // Validate user has access to this business
      const hasAccess = await validateBusinessAccess(user.id, business_id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Create the task
      const { data: task, error } = await supabase
        .from('crm_tasks')
        .insert({
          business_id,
          contact_id,
          lead_id,
          title,
          description,
          type,
          priority,
          due_date,
          assigned_to: assigned_to || user.id,
          created_by: user.id
        })
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, email),
          lead:crm_leads(id, title),
          assigned_user:profiles!assigned_to(id, full_name, avatar_url)
        `)
        .single()
  
      if (error) {
        console.error('Error creating task:', error)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
      }
  
      return NextResponse.json({ task }, { status: 201 })
  
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }