// src/lib/email/integrations/business.ts
import { emailService } from '../service'
import { createServiceClient } from '@/lib/supabase/service'

export class BusinessEmailIntegrations {
  
  /**
   * Handle business approval
   */
  static async handleBusinessApproval(businessData: any, ownerId: string) {
    try {
      await emailService.sendBusinessApprovalEmail(ownerId, businessData)
      console.log(`Business approval email queued for owner: ${ownerId}`)
    } catch (error) {
      console.error('Handle business approval email error:', error)
      // Don't throw to avoid breaking business approval flow
    }
  }

  /**
   * Handle business rejection
   */
  static async handleBusinessRejection(
    businessData: any, 
    ownerId: string, 
    rejectionReason: string
  ) {
    try {
      await emailService.sendBusinessRejectionEmail(ownerId, businessData, rejectionReason)
      console.log(`Business rejection email queued for owner: ${ownerId}`)
    } catch (error) {
      console.error('Handle business rejection email error:', error)
      // Don't throw to avoid breaking business rejection flow
    }
  }

  /**
   * Handle new review posted
   */
  static async handleNewReview(reviewData: any, businessData: any) {
    try {
      await emailService.sendNewReviewEmail(businessData.profile_id, reviewData, businessData)
      console.log(`New review email queued for business owner: ${businessData.profile_id}`)
    } catch (error) {
      console.error('Handle new review email error:', error)
      // Don't throw to avoid breaking review creation
    }
  }
}