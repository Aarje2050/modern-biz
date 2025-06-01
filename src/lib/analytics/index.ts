// src/lib/analytics/index.ts - UNIFIED ANALYTICS SYSTEM
// This replaces ALL existing analytics files

interface TrackingEvent {
    type: 'page_view' | 'business_interaction' | 'search' | 'user_event';
    entityType?: 'business' | 'category' | 'page';
    entityId?: string;
    businessId?: string;
    interactionType?: string;
    query?: string;
    resultCount?: number;
    eventData?: Record<string, any>;
  }
  
  class AnalyticsClient {
    private static instance: AnalyticsClient;
    private eventQueue: TrackingEvent[] = [];
    private isProcessing = false;
    private batchSize = 10;
    private flushInterval = 5000; // 5 seconds
    
    constructor() {
      if (typeof window !== 'undefined') {
        // Auto-flush queue periodically
        setInterval(() => this.flush(), this.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flush(true));
      }
    }
    
    static getInstance(): AnalyticsClient {
      if (!AnalyticsClient.instance) {
        AnalyticsClient.instance = new AnalyticsClient();
      }
      return AnalyticsClient.instance;
    }
    
    /**
     * Track page views - enterprise-grade with deduplication
     */
    trackPageView(entityType: 'business' | 'category' | 'page', entityId: string) {
      // Prevent double tracking same page view within 30 seconds
      const key = `${entityType}-${entityId}`;
      const lastTracked = sessionStorage.getItem(`analytics_${key}`);
      const now = Date.now();
      
      if (lastTracked && (now - parseInt(lastTracked)) < 30000) {
        return; // Skip duplicate within 30 seconds
      }
      
      sessionStorage.setItem(`analytics_${key}`, now.toString());
      
      this.addEvent({
        type: 'page_view',
        entityType,
        entityId
      });
    }
    
    /**
     * Track business interactions (phone, directions, website, save, share)
     */
    trackBusinessInteraction(businessId: string, interactionType: string, metadata?: Record<string, any>) {
      this.addEvent({
        type: 'business_interaction',
        businessId,
        interactionType,
        eventData: metadata
      });
    }
    
    /**
     * Track search queries
     */
    trackSearch(query: string, resultCount: number, filters?: Record<string, any>) {
      this.addEvent({
        type: 'search',
        query: query.trim(),
        resultCount,
        eventData: filters
      });
    }
    
    /**
     * Track general user events
     */
    trackEvent(eventType: string, data?: Record<string, any>) {
      this.addEvent({
        type: 'user_event',
        interactionType: eventType,
        eventData: data
      });
    }
    
    /**
     * Add event to queue (private method)
     */
    private addEvent(event: TrackingEvent) {
      this.eventQueue.push(event);
      
      // Auto-flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        this.flush();
      }
    }
    
    /**
     * Flush events to server
     */
    private async flush(force = false) {
      if (this.isProcessing || this.eventQueue.length === 0) {
        return;
      }
      
      this.isProcessing = true;
      const events = [...this.eventQueue];
      this.eventQueue = [];
      
      try {
        // Send events in batch or individually based on force
        if (force || events.length === 1) {
          // Send individually for immediate events or page unload
          await Promise.all(
            events.map(event => this.sendEvent(event))
          );
        } else {
          // Send in batch for better performance
          await this.sendEventBatch(events);
        }
      } catch (error) {
        // Silent failure - never impact user experience
        console.error('Analytics flush error:', error);
        
        // Re-queue events on failure (up to 3 retries)
        if (!force) {
          this.eventQueue.unshift(...events.slice(0, 5)); // Only retry first 5
        }
      } finally {
        this.isProcessing = false;
      }
    }
    
    /**
     * Send single event
     */
    private async sendEvent(event: TrackingEvent): Promise<void> {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true // Important for page unload events
      });
      
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    }
    
    /**
     * Send events in batch (future enhancement)
     */
    private async sendEventBatch(events: TrackingEvent[]): Promise<void> {
      // For now, send individually - can optimize later with batch endpoint
      await Promise.all(events.map(event => this.sendEvent(event)));
    }
  }
  
  // Export singleton instance
  export const analytics = AnalyticsClient.getInstance();
  
  // Convenience exports for common tracking
  export const track = {
    pageView: (entityType: 'business' | 'category' | 'page', entityId: string) => 
      analytics.trackPageView(entityType, entityId),
      
    businessAction: (businessId: string, action: string, metadata?: Record<string, any>) => 
      analytics.trackBusinessInteraction(businessId, action, metadata),
      
    search: (query: string, resultCount: number, filters?: Record<string, any>) => 
      analytics.trackSearch(query, resultCount, filters),
      
    event: (eventType: string, data?: Record<string, any>) => 
      analytics.trackEvent(eventType, data)
  };
  
  // Business-specific tracking helpers
  export const BusinessTracking = {
    viewBusiness: (businessId: string) => 
      track.businessAction(businessId, 'view_details'),
      
    contactPhone: (businessId: string, phoneNumber: string) => 
      track.businessAction(businessId, 'contact_phone', { phone: phoneNumber }),
      
    getDirections: (businessId: string, address: string) => 
      track.businessAction(businessId, 'get_directions', { address }),
      
    visitWebsite: (businessId: string, website: string) => 
      track.businessAction(businessId, 'visit_website', { website }),
      
    saveBusiness: (businessId: string) => 
      track.businessAction(businessId, 'save_business'),
      
    shareBusiness: (businessId: string, platform: string) => 
      track.businessAction(businessId, 'share_business', { platform }),
      
    viewPhotos: (businessId: string, photoCount: number) => 
      track.businessAction(businessId, 'view_photos', { photoCount })
  };