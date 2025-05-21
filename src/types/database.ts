// src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  core: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          account_type: string
          is_verified: boolean
          settings: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          account_type?: string
          is_verified?: boolean
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          account_type?: string
          is_verified?: boolean
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  listings: {
    Tables: {
      businesses: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          slug: string
          description: string | null
          short_description: string | null
          logo_url: string | null
          cover_url: string | null
          established_year: number | null
          status: string
          verification_level: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          established_year?: number | null
          status?: string
          verification_level?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          established_year?: number | null
          status?: string
          verification_level?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          parent_id: string | null
          display_order: number
          is_featured: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          display_order?: number
          is_featured?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          display_order?: number
          is_featured?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}