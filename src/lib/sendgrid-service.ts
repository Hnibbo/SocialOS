import { supabase } from "@/integrations/supabase/client";

/**
 * SendGrid Service
 * Wrapper for SendGrid email API operations
 */

export interface SendGridConfig {
    apiKey: string;
}

export interface EmailMessage {
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, unknown>;
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class SendGridService {
    private config: SendGridConfig;

    constructor(config: SendGridConfig) {
        this.config = config;
    }

    /**
     * Validate SendGrid API key format
     */
    async validateKey(): Promise<{ valid: boolean; error?: string }> {
        try {
            if (!this.config.apiKey) {
                return { valid: false, error: 'API key is required' };
            }

            if (!this.config.apiKey.startsWith('SG.')) {
                return { valid: false, error: 'Invalid API key format. Must start with SG.' };
            }

            if (this.config.apiKey.length < 20) {
                return { valid: false, error: 'API key appears to be too short' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: (error as Error).message };
        }
    }

    /**
     * Test connection to SendGrid
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const validation = await this.validateKey();
            if (!validation.valid) {
                return { success: false, message: validation.error || 'Invalid API key' };
            }

            const { data, error } = await supabase.functions.invoke('validate-sendgrid', {
                body: { apiKey: this.config.apiKey }
            });

            if (error) throw error;

            return {
                success: data.success,
                message: data.message,
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${(error as Error).message}`,
            };
        }
    }

    /**
     * Send an email
     */
    async sendEmail(message: EmailMessage): Promise<EmailResponse> {
        try {
            const payload: Record<string, unknown> = {
                personalizations: [{
                    to: Array.isArray(message.to)
                        ? message.to.map(email => ({ email }))
                        : [{ email: message.to }],
                }],
                from: { email: message.from },
                subject: message.subject,
            };

            if (message.templateId) {
                payload.template_id = message.templateId;
                if (message.dynamicTemplateData) {
                    payload.personalizations[0].dynamic_template_data = message.dynamicTemplateData;
                }
            } else {
                payload.content = [];
                if (message.text) {
                    payload.content.push({ type: 'text/plain', value: message.text });
                }
                if (message.html) {
                    payload.content.push({ type: 'text/html', value: message.html });
                }
            }

            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.errors?.[0]?.message || 'Failed to send email');
            }

            // SendGrid returns 202 Accepted with X-Message-Id header
            const messageId = response.headers.get('X-Message-Id') || undefined;

            return {
                success: true,
                messageId,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Get email templates
     */
    async getTemplates(): Promise<Record<string, unknown>[] | { error: string }> {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            const data = await response.json();
            return data.templates || [];
        } catch (error) {
            return { error: (error as Error).message };
        }
    }
}

/**
 * Get SendGrid instance with current configuration
 */
export function getSendGridService(config: SendGridConfig): SendGridService {
    return new SendGridService(config);
}
