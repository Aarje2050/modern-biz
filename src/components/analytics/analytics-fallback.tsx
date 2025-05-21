// src/components/analytics/analytics-fallback.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AnalyticsFallback() {
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // Check if analytics tables exist
    const checkTables = async () => {
      const supabase = createClientComponentClient()
      try {
        // Try a simple query with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const { error } = await supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .limit(1)
          .abortSignal(controller.signal)
        
        clearTimeout(timeoutId)
        setTablesExist(!error)
      } catch (err) {
        setTablesExist(false)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkTables()
  }, [])
  
  if (isChecking) {
    return <div className="p-6 bg-white rounded-lg shadow">Checking analytics setup...</div>
  }
  
  if (!tablesExist) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Analytics Setup Required</h2>
        <p className="mb-4">The analytics tables haven't been set up yet. Please run the following SQL in your Supabase SQL editor:</p>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
          <pre>{`
-- Create analytics schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS analytics;

-- Create analytics tables
CREATE TABLE IF NOT EXISTS analytics.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  profile_id UUID,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics.business_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID,
  profile_id UUID,
  interaction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics.search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::JSONB,
  result_count INT,
  data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create public views
CREATE OR REPLACE VIEW public.page_views AS SELECT * FROM analytics.page_views;
CREATE OR REPLACE VIEW public.business_interactions AS SELECT * FROM analytics.business_interactions;
CREATE OR REPLACE VIEW public.search_queries AS SELECT * FROM analytics.search_queries;

-- Enable RLS
ALTER TABLE analytics.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.business_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.search_queries ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow all access to page_views" ON analytics.page_views FOR ALL USING (true);
CREATE POLICY "Allow all access to business_interactions" ON analytics.business_interactions FOR ALL USING (true);
CREATE POLICY "Allow all access to search_queries" ON analytics.search_queries FOR ALL USING (true);
          `}</pre>
        </div>
        <p className="mt-4">After running the SQL, refresh this page to access analytics.</p>
      </div>
    )
  }
  
  return null
}