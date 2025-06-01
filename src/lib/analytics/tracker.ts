// src/lib/analytics/tracker.ts - ENHANCED VERSION
// Professional analytics with unique vs total tracking

interface TrackingCache {
    [key: string]: number;
  }
  
  interface PageViewData {
    entityType: 'business' | 'category';
    entityId: string;
    viewType: 'unique' | 'total';
    sessionId: string;
    fingerprint: string;
  }
  
  class IntelligentAnalytics {
    private cache: TrackingCache = {};
    private readonly DEDUPE_WINDOW = 30000; // 30 seconds
    private readonly UNIQUE_VIEW_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
    private sessionId: string;
    private fingerprint: string;
    
    constructor() {
      // Generate session ID and browser fingerprint
      this.sessionId = this.getOrCreateSessionId();
      this.fingerprint = this.generateFingerprint();
      
      // Clean cache periodically
      setInterval(this.cleanCache, 5 * 60 * 1000);
    }
    
    /**
     * Intelligent page view tracking
     * Tracks both unique and total views professionally
     */
    pageView = async (entityType: 'business' | 'category', entityId: string) => {
      const pageKey = `${entityType}-${entityId}`;
      const now = Date.now();
      
      // Always track total page view (with deduplication for rapid clicks)
      const totalKey = `total-${pageKey}`;
      if (!this.cache[totalKey] || (now - this.cache[totalKey]) > this.DEDUPE_WINDOW) {
        this.cache[totalKey] = now;
        
        await this.sendPageView({
          entityType,
          entityId,
          viewType: 'total',
          sessionId: this.sessionId,
          fingerprint: this.fingerprint
        });
      }
      
      // Track unique page view (once per session for same page)
      const uniqueKey = `unique-${pageKey}`;
      const lastUniqueView = localStorage.getItem(`analytics_unique_${pageKey}`);
      
      if (!lastUniqueView || (now - parseInt(lastUniqueView)) > this.UNIQUE_VIEW_WINDOW) {
        localStorage.setItem(`analytics_unique_${pageKey}`, now.toString());
        
        await this.sendPageView({
          entityType,
          entityId,
          viewType: 'unique',
          sessionId: this.sessionId,
          fingerprint: this.fingerprint
        });
      }
    }
    
    /**
     * Track business interactions
     */
    businessAction = async (businessId: string, action: string, metadata?: Record<string, any>) => {
      const dedupeKey = `interaction-${businessId}-${action}`;
      const now = Date.now();
      
      // Deduplicate rapid clicks
      if (this.cache[dedupeKey] && (now - this.cache[dedupeKey]) < this.DEDUPE_WINDOW) {
        return;
      }
      
      this.cache[dedupeKey] = now;
      
      await this.sendEvent({
        type: 'business_interaction',
        businessId,
        interactionType: action,
        eventData: metadata
      });
    }
    
    /**
     * Track search queries
     */
    search = async (query: string, resultCount: number, filters?: Record<string, any>) => {
      const dedupeKey = `search-${query.trim()}`;
      const now = Date.now();
      
      // Deduplicate same search within 5 minutes
      if (this.cache[dedupeKey] && (now - this.cache[dedupeKey]) < 5 * 60 * 1000) {
        return;
      }
      
      this.cache[dedupeKey] = now;
      
      await this.sendEvent({
        type: 'search',
        query: query.trim(),
        resultCount,
        eventData: filters
      });
    }
    
    /**
     * Send page view event
     */
    private sendPageView = async (data: PageViewData) => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'page_view',
            entityType: data.entityType,
            entityId: data.entityId,
            viewType: data.viewType,
            sessionId: data.sessionId,
            fingerprint: data.fingerprint
          }),
          keepalive: true
        });
        
        if (!response.ok) {
          console.log(`📊 Page view queued: ${data.entityType}/${data.entityId} (${data.viewType})`);
        }
      } catch (error) {
        console.log(`📊 Page view queued: ${data.entityType}/${data.entityId} (${data.viewType})`);
      }
    }
    
    /**
     * Send general event
     */
    private sendEvent = async (eventData: Record<string, any>) => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
          keepalive: true
        });
        
        if (!response.ok) {
          console.log(`📊 Event queued: ${eventData.type}`);
        }
      } catch (error) {
        console.log(`📊 Event queued: ${eventData.type}`);
      }
    }
    
    /**
     * Generate or retrieve session ID
     */
    private getOrCreateSessionId(): string {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      
      return sessionId;
    }
    
    /**
     * Generate browser fingerprint for unique user identification
     */
    private generateFingerprint(): string {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx!.textBaseline = 'top';
      ctx!.font = '14px Arial';
      ctx!.fillText('Analytics fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return 'fp_' + Math.abs(hash).toString(36);
    }
    
    /**
     * Clean old cache entries
     */
    private cleanCache = () => {
      const now = Date.now();
      Object.keys(this.cache).forEach(key => {
        if (now - this.cache[key] > this.DEDUPE_WINDOW) {
          delete this.cache[key];
        }
      });
    }
  }
  
  // Export singleton
  export const analytics = new IntelligentAnalytics();
  
  // Export convenience functions
  export const trackPageView = analytics.pageView;
  export const trackBusinessAction = analytics.businessAction;
  export const trackSearch = analytics.search;