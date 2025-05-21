// src/types/business.ts
export type BusinessContact = {
    id: string
    business_id: string
    type: string
    value: string
    is_primary: boolean
    is_public: boolean
    created_at: string
  }
  
  export type Location = {
    id: string
    business_id: string
    name: string | null
    address_line1: string
    address_line2: string | null
    city: string
    state: string
    postal_code: string
    country: string
    latitude: number | null
    longitude: number | null
    is_primary: boolean
    is_active: boolean
    created_at: string
  }
  
  export type Business = {
    id: string
    profile_id: string
    name: string
    slug: string
    description: string | null
    short_description: string | null
    logo_url: string | null
    cover_url: string | null
    established_year: number | null
    status: string
    verification_level: string
    created_at: string
    updated_at: string
    locations: Location[]
    business_contacts: BusinessContact[]
  }