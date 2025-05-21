// src/app/loading.tsx
export default function Loading() {
    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-200 overflow-hidden">
          <div className="w-1/3 h-full bg-blue-500 animate-pulse rounded-full"></div>
        </div>
      </div>
    )
  }