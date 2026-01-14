import { supabase } from "@/integrations/supabase/client";

/**
 * Stripe Service
 * Wrapper for Stripe API operations
 */

export interface StripeConfig {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
}

export interface CreateCheckoutSessionParams {
    priceId: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
}

export interface CheckoutSession {
    id: string;
    url: string;
    status: string;
}

export class StripeService {
    private config: StripeConfig;

    constructor(config: StripeConfig) {
        this.config = config;
    }

    /**
     * Validate Stripe API keys
     */
    async validateKeys(): Promise<{ valid: boolean; error?: string }> {
        try {
            // Test the publishable key format
            if (!this.config.publishableKey.startsWith('pk_')) {
                return { valid: false, error: 'Invalid publishable key format' };
            }

            // If we have a secret key, validate it
            if (this.config.secretKey && !this.config.secretKey.startsWith('sk_') && !this.config.secretKey.startsWith('rk_')) {
                return { valid: false, error: 'Invalid secret key format' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: (error as Error).message };
        }
    }

    /**
     * Test connection to Stripe
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const validation = await this.validateKeys();
            if (!validation.valid) {
                return { success: false, message: validation.error || 'Invalid keys' };
            }

            // Call the secure Edge Function to validate the key
            const { data, error } = await supabase.functions.invoke('validate-stripe', {
                body: { secretKey: this.config.secretKey }
            });

            if (error) throw error;

            return {
                success: data.success,
                message: data.message
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Create a customer portal session
     * This should be called from the Edge Function
     */
    async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string } | { error: string }> {
        try {
            // This would be called via Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('customer-portal', {
                body: { customer_id: customerId, return_url: returnUrl }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            return { error: (error as Error).message };
        }
    }

    /**
     * Get subscription status
     */
    async getSubscriptionStatus(customerId: string): Promise<{
        active: boolean;
        plan?: string;
        status?: string;
    }> {
        try {
            // This would query Supabase database
            const { data, error } = await supabase.functions.invoke('check-subscription', {
                body: { customer_id: customerId }
            });

            if (error) return { active: false };
            return data;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return { active: false };
        }
    }
}

/**
 * Get Stripe instance with current configuration
 */
export function getStripeService(config: StripeConfig): StripeService {
    return new StripeService(config);
}
