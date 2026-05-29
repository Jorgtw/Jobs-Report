import { supabase } from './supabase';
import { db } from './dbService';
import { PRICING_VERSION } from '../utils/pricingConfig';

export type PricingEventType = 'upgrade_click' | 'downgrade' | 'plan_change' | 'limit_reached';

export interface PricingEventMetadata {
  current_plan?: string;
  target_plan?: string;
  limit_name?: string;
  current_usage?: number;
  limit_value?: number | null;
  button_source?: string;
  [key: string]: any;
}

/**
 * Lean Analytics & Observability Service
 * Tracks pricing-related behavior and soft-limit events.
 * Gracefully degrades (falls back to console) if database table is not present.
 */
export const analyticsService = {
  /**
   * Tracks a pricing event and logs it to Supabase (if table exists) and console.
   */
  async trackPricingEvent(
    eventType: PricingEventType,
    metadata: PricingEventMetadata = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    let companyId: string | null = null;
    let userId: string | null = null;

    try {
      companyId = db.getCompanyIdSafe() || null;
      // Get current session user if available
      const session = (await supabase.auth.getSession()).data.session;
      userId = session?.user?.id || null;
    } catch (e) {
      // Ignore context errors
    }

    const payload = {
      company_id: companyId,
      user_id: userId,
      event_type: eventType,
      metadata: {
        ...metadata,
        pricing_version: PRICING_VERSION,
        timestamp,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    };

    // 1. Permanent console observability (crucial for debugging/test validation)
    console.log(`[Analytics Event] [${eventType.toUpperCase()}]`, payload);

    // 2. Soft persistence (Supabase)
    // Defensive design: attempts write, fails silently to avoid breaking the app if table isn't created yet
    if (companyId) {
      try {
        const { error } = await supabase
          .from('pricing_events')
          .insert(payload);
        
        if (error) {
          // Silent warning in console, indicating the table might not exist yet
          console.warn('[Analytics Service] Could not persist event to DB (table might be missing):', error.message);
        }
      } catch (err) {
        console.warn('[Analytics Service] Network/DB failure during persistence:', err);
      }
    }
  }
};
