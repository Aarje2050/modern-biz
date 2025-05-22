// src/app/categories/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Categories - Business Directory',
  description: 'Browse businesses by category in our directory',
}

export const revalidate = 3600;
export default async function CategoriesPage() {
  const supabase = await createClient()
  
  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  // Get all active business IDs
const { data: activeBusinesses } = await supabase
.from('businesses')
.select('id')
.eq('status', 'active');

const activeBusinessIds = (activeBusinesses || []).map(b => b.id);

// Now get count of businesses per category
const categoriesWithCount = await Promise.all((categories || []).map(async (category) => {
const { count } = await supabase
  .from('business_categories')
  .select('*', { count: 'exact', head: true })
  .eq('category_id', category.id)
  .in('business_id', activeBusinessIds);

return {
  ...category,
  businessCount: count || 0
}
}));

  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse by Category</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categoriesWithCount.map((category) => (
          <Link 
            key={category.id} 
            href={`/categories/${category.slug}`}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-4">
              {category.icon ? (
                <Image 
                  src={category.icon}
                  alt={category.name}
                  width={32}
                  height={32}
                />
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <h2 className="text-lg font-medium mb-1">{category.name}</h2>
            <p className="text-sm text-gray-500">
              {category.businessCount} {category.businessCount === 1 ? 'business' : 'businesses'}
            </p>
          </Link>
        ))}
        
        {categoriesWithCount.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No categories found.</p>
          </div>
        )}
      </div>
    </div>
  )
}