import { supabase } from "@/integrations/supabase/client";

/**
 * AI Service (Powered by OpenRouter)
 * Wrapper for AI operations across multiple models
 */

export interface AIConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ChatCompletionResponse {
    id: string;
    choices: Array<{
        message: ChatMessage;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class AIService {
    private config: AIConfig;
    private defaultBaseUrl = 'https://openrouter.ai/api/v1';

    constructor(config: AIConfig) {
        this.config = config;
    }

    /**
     * Validate OpenRouter API key format
     */
    async validateKey(): Promise<{ valid: boolean; error?: string }> {
        try {
            if (!this.config.apiKey) {
                return { valid: false, error: 'API key is required' };
            }

            if (!this.config.apiKey.startsWith('sk-or-')) {
                return { valid: false, error: 'Invalid OpenRouter API key format. Must start with sk-or-' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: (error as Error).message };
        }
    }

    /**
     * Test connection to OpenRouter
     */
    async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
        try {
            const validation = await this.validateKey();
            if (!validation.valid) {
                return { success: false, message: validation.error || 'Invalid API key' };
            }

            // Note: We use the same 'validate-openai' function but it will be updated to handle OpenRouter
            const { data, error } = await supabase.functions.invoke('validate-openai', {
                body: { apiKey: this.config.apiKey }
            });

            if (error) throw error;

            return {
                success: data.success,
                message: data.message,
                model: data.model,
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${(error as Error).message}`,
            };
        }
    }

    /**
     * Create a chat completion
     */
    async createChatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse | { error: string }> {
        try {
            const baseUrl = this.config.baseUrl || this.defaultBaseUrl;
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Hup Platform',
                },
                body: JSON.stringify({
                    model: request.model || this.config.model || 'anthropic/claude-3.5-sonnet',
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens ?? 1000,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to create completion');
            }

            return await response.json();
        } catch (error) {
            return { error: (error as Error).message };
        }
    }

    /**
     * Get available models from OpenRouter
     */
    async getModels(): Promise<Array<{ id: string, name: string }> | { error: string }> {
        try {
            const baseUrl = this.config.baseUrl || this.defaultBaseUrl;
            const response = await fetch(`${baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }

            const data = await response.json();
            return data.data.map((model: { id: string; name?: string }) => ({
                id: model.id,
                name: model.name || model.id
            }));
        } catch (error) {
            return { error: (error as Error).message };
        }
    }
}

/**
 * Get AI instance with current configuration
 */
export function getAIService(config: AIConfig): AIService {
    return new AIService(config);
}
