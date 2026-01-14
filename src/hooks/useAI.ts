// Hup Artificial Intelligence Orchestration
// React hook for interacting with the AI orchestration layer

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AIFeature =
    | 'content_moderation'
    | 'user_matching'
    | 'activity_recommendations'
    | 'business_verification'
    | 'support_bot'
    | 'report_triage';

interface UseAIOptions {
    feature: AIFeature;
    onSuccess?: (result: AIResult) => void;
    onError?: (error: Error) => void;
}

interface AIResult {
    success: boolean;
    result: Record<string, unknown>;
    source: 'ai' | 'fallback';
    model?: string;
    latency_ms?: number;
    tokens?: { input: number; output: number };
    cost?: number;
    reason?: string;
}

export function useAI({ feature, onSuccess, onError }: UseAIOptions) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<AIResult | null>(null);

    const execute = useCallback(async (
        input: Record<string, unknown>,
        context?: Record<string, unknown>
    ) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
                body: { feature, input, context }
            });

            if (fnError) {
                throw new Error(fnError.message);
            }

            if (!data.success) {
                throw new Error(data.error || 'AI request failed');
            }

            const aiResult = data as AIResult;
            setResult(aiResult);
            onSuccess?.(aiResult);
            return aiResult;

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [feature, onSuccess, onError]);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setResult(null);
    }, []);

    return {
        execute,
        reset,
        loading,
        error,
        result
    };
}

// Convenience hooks for specific features
export function useContentModeration() {
    return useAI({ feature: 'content_moderation' });
}

export function useUserMatching() {
    return useAI({ feature: 'user_matching' });
}

export function useActivityRecommendations() {
    return useAI({ feature: 'activity_recommendations' });
}

export function useSupportBot() {
    return useAI({ feature: 'support_bot' });
}
