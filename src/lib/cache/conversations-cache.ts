// src/lib/cache/conversations-cache.ts (PROFESSIONAL CACHE MANAGER)

interface CacheData<T> {
    data: T
    timestamp: number
    version: string
  }
  
  interface ConversationCacheConfig {
    ttl: number // Time to live in milliseconds
    maxSize: number // Maximum conversations to cache
    version: string // Cache version for invalidation
  }
  
  class ConversationsCache {
    private config: ConversationCacheConfig = {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100, // Max 100 conversations
      version: '1.0'
    }
  
    private getKey(userId: string, filter?: string): string {
      return `conversations:${userId}${filter ? `:${filter}` : ''}`
    }
  
    // Get cached conversations
    get<T>(userId: string, filter?: string): T | null {
      try {
        const key = this.getKey(userId, filter)
        const cached = localStorage.getItem(key)
        
        if (!cached) return null
        
        const { data, timestamp, version }: CacheData<T> = JSON.parse(cached)
        
        // Check version compatibility
        if (version !== this.config.version) {
          this.delete(userId, filter)
          return null
        }
        
        // Check TTL
        if (Date.now() - timestamp > this.config.ttl) {
          this.delete(userId, filter)
          return null
        }
        
        return data
      } catch (error) {
        console.warn('Cache read error:', error)
        return null
      }
    }
  
    // Set cached conversations
    set<T>(userId: string, data: T, filter?: string): void {
      try {
        const key = this.getKey(userId, filter)
        const cacheData: CacheData<T> = {
          data,
          timestamp: Date.now(),
          version: this.config.version
        }
        
        // Truncate if too many conversations
        if (Array.isArray(data) && data.length > this.config.maxSize) {
          cacheData.data = data.slice(0, this.config.maxSize) as T
        }
        
        localStorage.setItem(key, JSON.stringify(cacheData))
      } catch (error) {
        console.warn('Cache write error:', error)
        // Handle quota exceeded
        if (error instanceof DOMException && error.code === 22) {
          this.clearAll()
        }
      }
    }
  
    // Delete specific cache
    delete(userId: string, filter?: string): void {
      try {
        const key = this.getKey(userId, filter)
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Cache delete error:', error)
      }
    }
  
    // Clear all conversation caches
    clearAll(): void {
      try {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('conversations:')
        )
        keys.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.warn('Cache clear error:', error)
      }
    }
  
    // Invalidate cache (for real-time updates)
    invalidate(userId: string): void {
      this.delete(userId)
      this.delete(userId, 'all')
      this.delete(userId, 'business')
      this.delete(userId, 'users')
    }
  
    // Update single conversation in cache
    updateConversation(userId: string, conversationId: string, updatedData: any): void {
      try {
        const cached = this.get<any[]>(userId)
        if (!cached) return
  
        const updatedConversations = cached.map(conv => 
          conv.id === conversationId ? { ...conv, ...updatedData } : conv
        )
        
        this.set(userId, updatedConversations)
      } catch (error) {
        console.warn('Cache update error:', error)
      }
    }
  
    // Remove conversation from cache
    removeConversation(userId: string, conversationId: string): void {
      try {
        const cached = this.get<any[]>(userId)
        if (!cached) return
  
        const filteredConversations = cached.filter(conv => conv.id !== conversationId)
        this.set(userId, filteredConversations)
      } catch (error) {
        console.warn('Cache remove error:', error)
      }
    }
  
    // Get cache stats
    getStats(): { size: number; keys: string[] } {
      try {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('conversations:')
        )
        const size = keys.reduce((total, key) => {
          return total + (localStorage.getItem(key)?.length || 0)
        }, 0)
        
        return { size, keys }
      } catch (error) {
        return { size: 0, keys: [] }
      }
    }
  }
  
  // Singleton instance
  export const conversationsCache = new ConversationsCache()
  
  // Cache events for debugging
  export const cacheEvents = {
    onHit: (key: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache HIT] ${key}`)
      }
    },
    onMiss: (key: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache MISS] ${key}`)
      }
    },
    onSet: (key: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache SET] ${key}`)
      }
    }
  }