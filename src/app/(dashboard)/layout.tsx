// src/app/(dashboard)/layout.tsx - ENTERPRISE DASHBOARD LAYOUT
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Business Dashboard - Manage your business profile, analytics, and customer relationships.',
}

// ENTERPRISE: Server-side layout - no client logic here
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard-specific layout wrapper */}
      <div className="dashboard-container">
        {children}
      </div>
    </div>
  )
}