// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/database'

// Service role client for server-side operations (bypasses RLS)
export const createServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}