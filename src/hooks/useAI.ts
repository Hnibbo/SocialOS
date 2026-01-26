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
    | 'report_triage'
    | 'automation_scheduler'
    | 'task_execution'
    | 'workflow_optimization'
    | 'automation'
    | 'workflow_execution'
    | 'task_scheduling'
    | 'automation_monitoring'
    | 'automation_optimization'
    | 'workflow_analysis'
    | 'task_prioritization'
    | 'automation_error_analysis'
    | 'performance_monitoring'
    | 'automation_testing'
    | 'workflow_validation'
    | 'automation_scaling'
    | 'cost_optimization'
    | 'resource_allocation'
    | 'automation_governance'
    | 'compliance_monitoring'
    | 'automation_analytics';

interface AutomationContext {
    persona: string;
    permissions: string[];
    executionContext: any;
}

interface UseAIOptions {
    feature: AIFeature;
    onSuccess?: (result: AIResult) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: { step: string; status: string; percent: number }) => void;
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
    logs?: Array<{
        timestamp: string;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>;
}

interface AutomationContext {
    workflowId?: string;
    runId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    automationType?: string;
    taskCategory?: string;
    executionMode?: 'scheduled' | 'triggered' | 'manual';
    environment?: 'development' | 'staging' | 'production';
    metadata?: Record<string, unknown>;
    performanceMetrics?: {
        expectedExecutionTime?: number;
        maxExecutionTime?: number;
        successRate?: number;
        avgExecutionTime?: number;
        failureRate?: number;
        retryCount?: number;
    };
    complianceContext?: {
        regulations?: string[];
        complianceLevel?: 'basic' | 'enhanced' | 'strict';
        auditRequired?: boolean;
    };
    resourceContext?: {
        cpuLimit?: number;
        memoryLimit?: number;
        apiRateLimits?: Record<string, number>;
        concurrentExecutions?: number;
    };
    notificationContext?: {
        onSuccess?: string[];
        onError?: string[];
        onTimeout?: string[];
        notificationType?: 'email' | 'slack' | 'in-app' | 'sms';
    };
}

export function useAI({ feature, onSuccess, onError, onProgress }: UseAIOptions) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<AIResult | null>(null);
    const [logs, setLogs] = useState<Array<{
        timestamp: string;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>>([]);
    const [progress, setProgress] = useState<{ step: string; status: string; percent: number } | null>(null);

    const execute = useCallback(async (
        input: Record<string, unknown>,
        context?: AutomationContext & Record<string, unknown>
    ) => {
        setLoading(true);
        setError(null);
        setLogs([]);
        setProgress(null);

        try {
            // Log automation context if available
            if (context) {
                setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: `Executing automation: ${context.automationType || feature} - Priority: ${context.priority || 'normal'}, Mode: ${context.executionMode || 'manual'}`
                }]);
            }

            // Signal progress
            onProgress?.({ step: 'initialization', status: 'Initializing AI service', percent: 0 });
            setProgress({ step: 'initialization', status: 'Initializing AI service', percent: 0 });

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
            
            // Update logs if available
            if (aiResult.logs) {
                setLogs(aiResult.logs);
            }

            onSuccess?.(aiResult);
            return aiResult;

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: error.message
            }]);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
            setProgress(null);
        }
    }, [feature, onSuccess, onError, onProgress]);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setResult(null);
        setLogs([]);
        setProgress(null);
    }, []);

    return {
        execute,
        reset,
        loading,
        error,
        result,
        logs,
        progress
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

// Automation-specific hooks
export function useAutomation() {
    return useAI({ feature: 'automation' });
}

export function useAutomationScheduler() {
    return useAI({ feature: 'automation_scheduler' });
}

export function useTaskExecution() {
    return useAI({ feature: 'task_execution' });
}

export function useWorkflowOptimization() {
    return useAI({ feature: 'workflow_optimization' });
}

export function useWorkflowExecution() {
    return useAI({ feature: 'workflow_execution' });
}

export function useTaskScheduling() {
    return useAI({ feature: 'task_scheduling' });
}

export function useAutomationMonitoring() {
    return useAI({ feature: 'automation_monitoring' });
}

export function useAutomationOptimization() {
    return useAI({ feature: 'automation_optimization' });
}

export function useWorkflowAnalysis() {
    return useAI({ feature: 'workflow_analysis' });
}

export function useTaskPrioritization() {
    return useAI({ feature: 'task_prioritization' });
}

export function useAutomationErrorAnalysis() {
    return useAI({ feature: 'automation_error_analysis' });
}

export function usePerformanceMonitoring() {
    return useAI({ feature: 'performance_monitoring' });
}

export function useAutomationTesting() {
    return useAI({ feature: 'automation_testing' });
}

export function useWorkflowValidation() {
    return useAI({ feature: 'workflow_validation' });
}

export function useAutomationScaling() {
    return useAI({ feature: 'automation_scaling' });
}

export function useCostOptimization() {
    return useAI({ feature: 'cost_optimization' });
}

export function useResourceAllocation() {
    return useAI({ feature: 'resource_allocation' });
}

export function useAutomationGovernance() {
    return useAI({ feature: 'automation_governance' });
}

export function useComplianceMonitoring() {
    return useAI({ feature: 'compliance_monitoring' });
}

export function useAutomationAnalytics() {
    return useAI({ feature: 'automation_analytics' });
}
