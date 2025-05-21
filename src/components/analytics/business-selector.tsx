// src/components/analytics/business-selector.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Business {
  id: string;
  name: string;
}

interface BusinessSelectorProps {
  businesses: Business[];
  currentBusinessId: string;
}

export default function BusinessSelector({ businesses, currentBusinessId }: BusinessSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('business', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }
  
  return (
    <select 
      className="p-2 border rounded-md"
      defaultValue={currentBusinessId}
      onChange={handleChange}
    >
      {businesses.map((business) => (
        <option key={business.id} value={business.id}>
          {business.name}
        </option>
      ))}
    </select>
  )
}