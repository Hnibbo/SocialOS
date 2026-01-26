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
     * Send notification email
     */
    async sendNotificationEmail(to: string, subject: string, content: string, type: string = 'info'): Promise<EmailResponse> {
        try {
            const emailContent = `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #00f0ff, #ff00ff); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Hup Notification</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: ${
                                type === 'info' ? '#3498db' :
                                type === 'success' ? '#2ecc71' :
                                type === 'warning' ? '#f39c12' :
                                type === 'alert' ? '#e74c3c' : '#9b59b6'
                            };">${type.toUpperCase()}</span>
                        </div>
                        <h2 style="color: #333; margin: 20px 0; font-size: 20px;">${subject}</h2>
                        <div style="color: #666; line-height: 1.6;">
                            ${content}
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                            <p>You're receiving this email because you're a member of Hup. If you don't want to receive these emails, you can manage your notification preferences in your settings.</p>
                            <p>&copy; ${new Date().getFullYear()} Hup. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `;

            const result = await this.sendEmail({
                to,
                from: 'notifications@hup.social',
                subject,
                html: emailContent
            });

            return result;
        } catch (error) {
            console.error('Error sending notification email:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Send daily digest email
     */
    async sendDailyDigestEmail(to: string, digestData: {
        totalLikes: number;
        totalComments: number;
        newFollowers: number;
        popularPosts: Array<{ title: string; likes: number; comments: number }>;
    }): Promise<EmailResponse> {
        try {
            const popularPostsHtml = digestData.popularPosts.map(post => `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">${post.title}</h4>
                    <div style="color: #666; font-size: 14px;">
                        <span style="margin-right: 15px;">❤️ ${post.likes} likes</span>
                        <span>💬 ${post.comments} comments</span>
                    </div>
                </div>
            `).join('');

            const emailContent = `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #00f0ff, #ff00ff); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Your Daily Hup Digest</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin: 20px 0; font-size: 20px;">👋 Hello!</h2>
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                            Here's your daily summary of activity on Hup:
                        </p>
                        
                        <div style="display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #3498db;">❤️</div>
                                <div style="font-size: 18px; font-weight: bold; color: #333;">${digestData.totalLikes}</div>
                                <div style="font-size: 12px; color: #666;">Likes</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">💬</div>
                                <div style="font-size: 18px; font-weight: bold; color: #333;">${digestData.totalComments}</div>
                                <div style="font-size: 12px; color: #666;">Comments</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #f39c12;">👥</div>
                                <div style="font-size: 18px; font-weight: bold; color: #333;">${digestData.newFollowers}</div>
                                <div style="font-size: 12px; color: #666;">New Followers</div>
                            </div>
                        </div>

                        <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">🔥 Your Most Popular Posts</h3>
                        ${popularPostsHtml}

                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                            <p>You're receiving this daily digest because you're a member of Hup. You can manage your email preferences in your settings.</p>
                            <p>&copy; ${new Date().getFullYear()} Hup. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `;

            const result = await this.sendEmail({
                to,
                from: 'notifications@hup.social',
                subject: `Your Daily Hup Digest - ${new Date().toLocaleDateString()}`,
                html: emailContent
            });

            return result;
        } catch (error) {
            console.error('Error sending daily digest email:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
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
