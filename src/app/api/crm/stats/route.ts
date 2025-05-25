// src/app/api/crm/stats/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { searchParams } = new URL(request.url)
      const businessId = searchParams.get('business_id')
  
      if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
      }
  
      // Verify business access
      const { data: businessAccess } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', businessId)
        .eq('profile_id', user.id)
        .single()
  
      if (!businessAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Get contact stats
      const [
        { count: totalContacts },
        { count: activeContacts },
        { count: leads },
        { count: customers },
        { count: totalLeads },
        { count: qualifiedLeads },
        { count: totalTasks },
        { count: overdueTasks },
        { count: todayTasks },
        { count: completedTasks },
        { count: weekInteractions },
        { count: monthInteractions }
      ] = await Promise.all([
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'active'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('lifecycle_stage', 'lead'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('lifecycle_stage', 'customer'),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('stage', 'qualified'),
        supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).eq('business_id', businessId).lt('due_date', new Date().toISOString()).eq('status', 'pending'),
        supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('due_date', new Date().toDateString()).lt('due_date', new Date(Date.now() + 86400000).toDateString()),
        supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'completed'),
        supabase.from('crm_interactions').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('interaction_date', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('crm_interactions').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('interaction_date', new Date(Date.now() - 30 * 86400000).toISOString())
      ])
  
      // Get average lead value
      const { data: leadValues } = await supabase
        .from('crm_leads')
        .select('value_estimate')
        .eq('business_id', businessId)
        .not('value_estimate', 'is', null)
  
      const avgValue = leadValues && leadValues.length > 0 
        ? leadValues.reduce((sum, lead) => sum + (lead.value_estimate || 0), 0) / leadValues.length 
        : 0
  
      // Get leads closing this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      
      const { count: closingThisMonth } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('expected_close_date', startOfMonth.toISOString())
        .lte('expected_close_date', endOfMonth.toISOString())
  
      const stats = {
        contacts: {
          total: totalContacts || 0,
          active: activeContacts || 0,
          leads: leads || 0,
          customers: customers || 0
        },
        leads: {
          total: totalLeads || 0,
          qualified: qualifiedLeads || 0,
          avgValue: Math.round(avgValue),
          closingThisMonth: closingThisMonth || 0
        },
        tasks: {
          total: totalTasks || 0,
          overdue: overdueTasks || 0,
          dueToday: todayTasks || 0,
          completed: completedTasks || 0
        },
        interactions: {
          thisWeek: weekInteractions || 0,
          thisMonth: monthInteractions || 0,
          responseRate: 85 // This would be calculated based on actual data
        }
      }
  
      return NextResponse.json({ stats })
  
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }