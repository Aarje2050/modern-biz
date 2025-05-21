// src/components/ui/pagination.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type PaginationProps = {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    
    router.push(`?${params.toString()}`)
  }
  
  // Only show pagination if there are multiple pages
  if (totalPages <= 1) {
    return null
  }
  
  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pages = []
    
    // Always show first page
    pages.push(1)
    
    // Calculate start and end of page number window
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)
    
    // Add ellipsis after first page if there's a gap
    if (startPage > 2) {
      pages.push('...')
    }
    
    // Add page numbers in the window
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Add ellipsis before last page if there's a gap
    if (endPage < totalPages - 1) {
      pages.push('...')
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }
  
  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center" aria-label="Pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mr-2 p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <span className="sr-only">Previous</span>
          &larr; Previous
        </button>
        
        <div className="flex space-x-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">...</span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => handlePageChange(page as number)}
                disabled={page === currentPage}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  page === currentPage
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-2 p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <span className="sr-only">Next</span>
          Next &rarr;
        </button>
      </nav>
    </div>
  )
}