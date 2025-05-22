// src/lib/analytics.ts (NEW FILE - ONLY ONE NEEDED)
export const track = {
    pageView: (entityType: string, entityId: string) => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', entityType, entityId })
      }).catch(() => {}) // Silent fail
    },
    
    businessAction: (businessId: string, action: string) => {
      fetch('/api/analytics/track', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'business_interaction', businessId, interactionType: action })
      }).catch(() => {}) // Silent fail
    },
    
    search: (query: string, resultCount: number) => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'search', query, result_count: resultCount })
      }).catch(() => {}) // Silent fail
    }
  }