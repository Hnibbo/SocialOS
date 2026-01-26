import { supabase } from "@/integrations/supabase/client";

/**
 * AI Service (Powered by OpenRouter)
 * Wrapper for AI operations across multiple models
 */

export interface AIConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
    automationMode?: 'light' | 'advanced' | 'enterprise';
}

export interface AutomationTask {
    id: string;
    name: string;
    description: string;
    category: 'content' | 'moderation' | 'search' | 'engagement';
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTokens: number;
    executionTime: number;
}

export interface AutomationResult {
    success: boolean;
    result?: Record<string, unknown>;
    error?: string;
    executionTime?: number;
    taskId?: string;
    workflowId?: string;
    runId?: string;
    logs?: Array<{
        timestamp: string;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>;
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

export interface AutomationRequest {
    task: string;
    parameters: Record<string, unknown>;
    context?: Record<string, unknown>;
    workflowId?: string;
    runId?: string;
}

export interface AutomationResponse {
    success: boolean;
    result?: Record<string, unknown>;
    error?: string;
    executionTime?: number;
    workflowId?: string;
    runId?: string;
    logs?: Array<{
        timestamp: string;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>;
}

export interface AutomationError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
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

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    capabilities: string[];
}

export class AIService {
    private config: AIConfig;
    private defaultBaseUrl = 'https://openrouter.ai/api/v1';
    private fallbackChain: string[] = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'];
    private automationModels: string[] = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'];
    private observability: {
        requests: Array<{
            id: string;
            timestamp: string;
            model: string;
            duration: number;
            success: boolean;
            error?: string;
            tokens?: { prompt: number; completion: number };
            taskType?: string;
            workflowId?: string;
            runId?: string;
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            executionMode?: 'scheduled' | 'triggered' | 'manual';
        }>;
        errors: Array<{
            id: string;
            timestamp: string;
            model: string;
            error: string;
            retryCount: number;
            taskType?: string;
            workflowId?: string;
            runId?: string;
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            executionMode?: 'scheduled' | 'triggered' | 'manual';
        }>;
        automationMetrics: {
            totalTasks: number;
            successfulTasks: number;
            failedTasks: number;
            avgExecutionTime: number;
            tasksByType: Record<string, number>;
            errorsByType: Record<string, number>;
            tasksByPriority: Record<string, number>;
            tasksByMode: Record<string, number>;
            avgExecutionTimeByType: Record<string, number>;
            successRateByType: Record<string, number>;
            errorRateByType: Record<string, number>;
            retryCountByType: Record<string, number>;
        };
    } = {
        requests: [],
        errors: [],
        automationMetrics: {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            avgExecutionTime: 0,
            tasksByType: {},
            errorsByType: {},
            tasksByPriority: {},
            tasksByMode: {},
            avgExecutionTimeByType: {},
            successRateByType: {},
            errorRateByType: {},
            retryCountByType: {}
        }
    };

    constructor(config: AIConfig) {
        this.config = config;
    }

    /**
     * Generate a unique ID for requests
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Log request metadata for observability
     */
    private logRequest(requestId: string, metadata: {
        model: string;
        duration: number;
        success: boolean;
        error?: string;
        tokens?: { prompt: number; completion: number };
    }) {
        this.observability.requests.push({
            id: requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });

        // Keep only last 1000 requests
        if (this.observability.requests.length > 1000) {
            this.observability.requests.shift();
        }
    }

    /**
     * Log errors for debugging and observability
     */
    private logError(requestId: string, model: string, error: string, retryCount: number, taskType?: string, workflowId?: string, runId?: string, priority?: 'low' | 'normal' | 'high' | 'urgent', executionMode?: 'scheduled' | 'triggered' | 'manual') {
        this.observability.errors.push({
            id: requestId,
            timestamp: new Date().toISOString(),
            model,
            error,
            retryCount,
            taskType,
            workflowId,
            runId,
            priority,
            executionMode
        });

        // Keep only last 500 errors
        if (this.observability.errors.length > 500) {
            this.observability.errors.shift();
        }
    }

    /**
     * Get observability metrics
     */
    getObservabilityMetrics() {
        const totalRequests = this.observability.requests.length;
        const successfulRequests = this.observability.requests.filter(r => r.success).length;
        const errorRate = totalRequests > 0 ? (1 - successfulRequests / totalRequests) * 100 : 0;
        const avgDuration = totalRequests > 0 
            ? this.observability.requests.reduce((sum, r) => sum + r.duration, 0) / totalRequests 
            : 0;

        return {
            totalRequests,
            successfulRequests,
            errorRate: errorRate.toFixed(2),
            avgDuration: avgDuration.toFixed(2),
            errors: this.observability.errors.slice(-20),
            automationMetrics: this.observability.automationMetrics
        };
    }

    /**
     * Get automation-specific metrics
     */
    getAutomationMetrics() {
        return this.observability.automationMetrics;
    }

    /**
     * Execute automation task with error handling and observability
     */
    async executeAutomationTask(
        task: AutomationTask,
        params: any,
        options?: {
            retries?: number;
            retryDelay?: number;
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            executionMode?: 'scheduled' | 'triggered' | 'manual';
            timeout?: number;
            workflowId?: string;
            runId?: string;
        }
    ): Promise<AutomationResult> {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        const maxRetries = options?.retries ?? 2;
        const retryDelay = options?.retryDelay ?? 1000;
        const timeout = options?.timeout ?? 30000; // 30 second default timeout
        let retryCount = 0;

        // Update automation metrics
        this.observability.automationMetrics.totalTasks++;
        if (!this.observability.automationMetrics.tasksByType[task.id]) {
            this.observability.automationMetrics.tasksByType[task.id] = 0;
        }
        this.observability.automationMetrics.tasksByType[task.id]++;
        
        if (!this.observability.automationMetrics.tasksByPriority[options?.priority || 'normal']) {
            this.observability.automationMetrics.tasksByPriority[options?.priority || 'normal'] = 0;
        }
        this.observability.automationMetrics.tasksByPriority[options?.priority || 'normal']++;
        
        if (!this.observability.automationMetrics.tasksByMode[options?.executionMode || 'manual']) {
            this.observability.automationMetrics.tasksByMode[options?.executionMode || 'manual'] = 0;
        }
        this.observability.automationMetrics.tasksByMode[options?.executionMode || 'manual']++;

        // Create timeout promise
        const timeoutPromise = new Promise<AutomationResult>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Task execution timed out'));
            }, timeout);
        });

        try {
            const executionPromise = (async () => {
                while (retryCount <= maxRetries) {
                    try {
                        // Create automation-specific chat messages with enhanced context
                        const messages: ChatMessage[] = [
                            {
                                role: 'system',
                                content: `You are an automation assistant for the SocialOS platform. Your task is to execute automation operations with precision and efficiency.
                            
                                Available automation capabilities:
                                - Workflow automation
                                - Content generation and moderation
                                - User engagement automation
                                - Data processing and analysis
                                - System monitoring and alerting
                            
                                Execute tasks with clear, structured responses following these guidelines:
                                1. Validate all inputs before processing
                                2. Execute tasks step by step
                                3. Handle errors gracefully with fallbacks
                                4. Provide detailed execution logs
                                5. Return structured results
                            
                                Automation Task: ${task.name} (${task.id})
                                Description: ${task.description}
                                Category: ${task.category}
                                Complexity: ${task.complexity}
                                Estimated Tokens: ${task.estimatedTokens}
                                Estimated Execution Time: ${task.executionTime}ms
                                Parameters: ${JSON.stringify(params, null, 2)}
                                Priority: ${options?.priority || 'normal'}
                                Execution Mode: ${options?.executionMode || 'manual'}
                                `
                            },
                            {
                                role: 'user',
                                content: `Execute automation task: ${task.name} with parameters ${JSON.stringify(params)}`
                            }
                        ];

                        const chatRequest: ChatCompletionRequest = {
                            messages,
                            model: 'anthropic/claude-3.5-sonnet',
                            temperature: 0.3,
                            maxTokens: task.estimatedTokens > 0 ? task.estimatedTokens : 2000
                        };

                        const response = await this.createChatCompletion(chatRequest);

                        if ('error' in response) {
                            throw new Error(response.error);
                        }

                        const duration = Date.now() - startTime;
                        this.logRequest(requestId, {
                            model: response.modelUsed || 'unknown',
                            duration,
                            success: true,
                            tokens: {
                                prompt: response.usage.prompt_tokens,
                                completion: response.usage.completion_tokens
                            },
                            taskType: task.id,
                            workflowId: options?.workflowId,
                            runId: options?.runId || requestId,
                            priority: options?.priority,
                            executionMode: options?.executionMode
                        });

                        // Parse automation result
                        let automationResult: Record<string, unknown>;
                        try {
                            automationResult = JSON.parse(response.choices[0].message.content);
                        } catch {
                            automationResult = {
                                raw: response.choices[0].message.content,
                                parsed: false
                            };
                        }

                        // Update automation metrics
                        this.observability.automationMetrics.successfulTasks++;
                        this.observability.automationMetrics.avgExecutionTime =
                            (this.observability.automationMetrics.avgExecutionTime * (this.observability.automationMetrics.successfulTasks - 1) + duration) /
                            this.observability.automationMetrics.successfulTasks;
                        
                        // Update type-specific metrics
                        if (!this.observability.automationMetrics.avgExecutionTimeByType[task.id]) {
                            this.observability.automationMetrics.avgExecutionTimeByType[task.id] = duration;
                            this.observability.automationMetrics.successRateByType[task.id] = 1;
                            this.observability.automationMetrics.retryCountByType[task.id] = 0;
                        } else {
                            const totalTasks = this.observability.automationMetrics.tasksByType[task.id];
                            const successfulTasks = (this.observability.automationMetrics.successRateByType[task.id] * (totalTasks - 1)) + 1;
                            this.observability.automationMetrics.successRateByType[task.id] = successfulTasks / totalTasks;
                            this.observability.automationMetrics.avgExecutionTimeByType[task.id] =
                                (this.observability.automationMetrics.avgExecutionTimeByType[task.id] * (totalTasks - 1) + duration) / totalTasks;
                        }

                        return {
                            success: true,
                            result: automationResult,
                            executionTime: duration,
                            taskId: task.id,
                            workflowId: options?.workflowId,
                            runId: options?.runId || requestId,
                            logs: [
                                {
                                    timestamp: new Date().toISOString(),
                                    level: 'info',
                                    message: `Task executed successfully with model ${response.modelUsed}`
                                },
                                {
                                    timestamp: new Date().toISOString(),
                                    level: 'info',
                                    message: `Execution time: ${duration}ms, Priority: ${options?.priority || 'normal'}, Mode: ${options?.executionMode || 'manual'}`
                                }
                            ]
                        };

                    } catch (error) {
                        retryCount++;
                        
                        const duration = Date.now() - startTime;
                        this.logRequest(requestId, {
                            model: 'unknown',
                            duration,
                            success: false,
                            error: (error as Error).message,
                            taskType: task.id,
                            workflowId: options?.workflowId,
                            runId: options?.runId || requestId,
                            priority: options?.priority,
                            executionMode: options?.executionMode
                        });

                        // Log error details
                        this.logError(requestId, 'unknown', (error as Error).message, retryCount, task.id, options?.workflowId, options?.runId || requestId, options?.priority, options?.executionMode);

                        // If we've exhausted all retries
                        if (retryCount > maxRetries) {
                            // Update automation metrics
                            this.observability.automationMetrics.failedTasks++;
                            if (!this.observability.automationMetrics.errorsByType[task.id]) {
                                this.observability.automationMetrics.errorsByType[task.id] = 0;
                            }
                            this.observability.automationMetrics.errorsByType[task.id]++;
                            
                            // Update error rate metric
                            const totalTasks = this.observability.automationMetrics.tasksByType[task.id];
                            const failedTasks = this.observability.automationMetrics.errorsByType[task.id];
                            this.observability.automationMetrics.errorRateByType[task.id] = failedTasks / totalTasks;

                            return {
                                success: false,
                                error: (error as Error).message,
                                executionTime: duration,
                                taskId: task.id,
                                workflowId: options?.workflowId,
                                runId: options?.runId || requestId,
                                logs: [
                                    {
                                        timestamp: new Date().toISOString(),
                                        level: 'error',
                                        message: `Task failed after ${retryCount} attempts: ${(error as Error).message}`
                                    },
                                    {
                                        timestamp: new Date().toISOString(),
                                        level: 'error',
                                        message: `Priority: ${options?.priority || 'normal'}, Mode: ${options?.executionMode || 'manual'}`
                                    }
                                ]
                            };
                        }

                        // Wait before retrying
                        if (retryCount <= maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
                        }
                    }
                }

                // Fallback return (should never reach here)
                return {
                    success: false,
                    error: 'Unknown error',
                    executionTime: Date.now() - startTime,
                    taskId: task.id,
                    workflowId: options?.workflowId,
                    runId: options?.runId || requestId,
                    logs: [
                        {
                            timestamp: new Date().toISOString(),
                            level: 'error',
                            message: 'Unknown error occurred'
                        }
                    ]
                };
            })();

            return await Promise.race([executionPromise, timeoutPromise]);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logRequest(requestId, {
                model: 'unknown',
                duration,
                success: false,
                error: (error as Error).message,
                taskType: task.id,
                workflowId: options?.workflowId,
                runId: options?.runId || requestId,
                priority: options?.priority,
                executionMode: options?.executionMode
            });

            this.logError(requestId, 'unknown', (error as Error).message, 0, task.id, options?.workflowId, options?.runId || requestId, options?.priority, options?.executionMode);

            this.observability.automationMetrics.failedTasks++;
            if (!this.observability.automationMetrics.errorsByType[task.id]) {
                this.observability.automationMetrics.errorsByType[task.id] = 0;
            }
            this.observability.automationMetrics.errorsByType[task.id]++;

            const totalTasks = this.observability.automationMetrics.tasksByType[task.id];
            const failedTasks = this.observability.automationMetrics.errorsByType[task.id];
            this.observability.automationMetrics.errorRateByType[task.id] = failedTasks / totalTasks;

            return {
                success: false,
                error: (error as Error).message,
                executionTime: duration,
                taskId: task.id,
                workflowId: options?.workflowId,
                runId: options?.runId || requestId,
                logs: [
                    {
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: `Task failed: ${(error as Error).message}`
                    },
                    {
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: `Priority: ${options?.priority || 'normal'}, Mode: ${options?.executionMode || 'manual'}, Duration: ${duration}ms`
                    }
                ]
            };
        }
    }

    /**
     * Execute automation with simplified interface
     */
    async executeAutomation(
        request: AutomationRequest & { 
            retries?: number; 
            retryDelay?: number;
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            executionMode?: 'scheduled' | 'triggered' | 'manual';
            timeout?: number;
        }
    ): Promise<AutomationResponse> {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        const maxRetries = request.retries ?? 2;
        const retryDelay = request.retryDelay ?? 1000;
        const timeout = request.timeout ?? 30000; // 30 second default timeout
        let retryCount = 0;

        // Update automation metrics
        this.observability.automationMetrics.totalTasks++;
        if (!this.observability.automationMetrics.tasksByType[request.task]) {
            this.observability.automationMetrics.tasksByType[request.task] = 0;
        }
        this.observability.automationMetrics.tasksByType[request.task]++;
        
        if (!this.observability.automationMetrics.tasksByPriority[request.priority || 'normal']) {
            this.observability.automationMetrics.tasksByPriority[request.priority || 'normal'] = 0;
        }
        this.observability.automationMetrics.tasksByPriority[request.priority || 'normal']++;
        
        if (!this.observability.automationMetrics.tasksByMode[request.executionMode || 'manual']) {
            this.observability.automationMetrics.tasksByMode[request.executionMode || 'manual'] = 0;
        }
        this.observability.automationMetrics.tasksByMode[request.executionMode || 'manual']++;

        // Create timeout promise
        const timeoutPromise = new Promise<AutomationResponse>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Task execution timed out'));
            }, timeout);
        });

        try {
            const executionPromise = (async () => {
                while (retryCount <= maxRetries) {
                    try {
                        // Create automation-specific chat messages with enhanced context
                        const messages: ChatMessage[] = [
                            {
                                role: 'system',
                                content: `You are an automation assistant for the SocialOS platform. Your task is to execute automation operations with precision and efficiency.
                            
                                Available automation capabilities:
                                - Workflow automation
                                - Content generation and moderation
                                - User engagement automation
                                - Data processing and analysis
                                - System monitoring and alerting
                            
                                Execute tasks with clear, structured responses following these guidelines:
                                1. Validate all inputs before processing
                                2. Execute tasks step by step
                                3. Handle errors gracefully with fallbacks
                                4. Provide detailed execution logs
                                5. Return structured results
                            
                                Automation Task: ${request.task}
                                Parameters: ${JSON.stringify(request.parameters, null, 2)}
                                Context: ${JSON.stringify(request.context, null, 2)}
                                Priority: ${request.priority || 'normal'}
                                Execution Mode: ${request.executionMode || 'manual'}
                                `
                            },
                            {
                                role: 'user',
                                content: `Execute automation task: ${request.task} with parameters ${JSON.stringify(request.parameters)}`
                            }
                        ];

                        const chatRequest: ChatCompletionRequest = {
                            messages,
                            model: 'anthropic/claude-3.5-sonnet',
                            temperature: 0.3,
                            maxTokens: 2000
                        };

                        const response = await this.createChatCompletion(chatRequest);

                        if ('error' in response) {
                            throw new Error(response.error);
                        }

                        const duration = Date.now() - startTime;
                        this.logRequest(requestId, {
                            model: response.modelUsed || 'unknown',
                            duration,
                            success: true,
                            tokens: {
                                prompt: response.usage.prompt_tokens,
                                completion: response.usage.completion_tokens
                            },
                            taskType: request.task,
                            workflowId: request.workflowId,
                            runId: request.runId || requestId,
                            priority: request.priority,
                            executionMode: request.executionMode
                        });

                        // Parse automation result
                        let automationResult: Record<string, unknown>;
                        try {
                            automationResult = JSON.parse(response.choices[0].message.content);
                        } catch {
                            automationResult = {
                                raw: response.choices[0].message.content,
                                parsed: false
                            };
                        }

                        // Update automation metrics
                        this.observability.automationMetrics.successfulTasks++;
                        this.observability.automationMetrics.avgExecutionTime = 
                            (this.observability.automationMetrics.avgExecutionTime * (this.observability.automationMetrics.successfulTasks - 1) + duration) / 
                            this.observability.automationMetrics.successfulTasks;
                        
                        // Update type-specific metrics
                        if (!this.observability.automationMetrics.avgExecutionTimeByType[request.task]) {
                            this.observability.automationMetrics.avgExecutionTimeByType[request.task] = duration;
                            this.observability.automationMetrics.successRateByType[request.task] = 1;
                            this.observability.automationMetrics.retryCountByType[request.task] = 0;
                        } else {
                            const totalTasks = this.observability.automationMetrics.tasksByType[request.task];
                            const successfulTasks = (this.observability.automationMetrics.successRateByType[request.task] * (totalTasks - 1)) + 1;
                            this.observability.automationMetrics.successRateByType[request.task] = successfulTasks / totalTasks;
                            this.observability.automationMetrics.avgExecutionTimeByType[request.task] = 
                                (this.observability.automationMetrics.avgExecutionTimeByType[request.task] * (totalTasks - 1) + duration) / totalTasks;
                        }

                        return {
                            success: true,
                            result: automationResult,
                            executionTime: duration,
                            workflowId: request.workflowId,
                            runId: request.runId || requestId,
                            logs: [
                                {
                                    timestamp: new Date().toISOString(),
                                    level: 'info',
                                    message: `Task executed successfully with model ${response.modelUsed}`
                                },
                                {
                                    timestamp: new Date().toISOString(),
                                    level: 'info',
                                    message: `Execution time: ${duration}ms, Priority: ${request.priority || 'normal'}, Mode: ${request.executionMode || 'manual'}`
                                }
                            ]
                        };

                    } catch (error) {
                        retryCount++;
                        
                        const duration = Date.now() - startTime;
                        this.logRequest(requestId, {
                            model: 'unknown',
                            duration,
                            success: false,
                            error: (error as Error).message,
                            taskType: request.task,
                            workflowId: request.workflowId,
                            runId: request.runId || requestId,
                            priority: request.priority,
                            executionMode: request.executionMode
                        });

                        // Log error details
                        this.logError(requestId, 'unknown', (error as Error).message, retryCount, request.task, request.workflowId, request.runId || requestId, request.priority, request.executionMode);

                        // If we've exhausted all retries
                        if (retryCount > maxRetries) {
                            // Update automation metrics
                            this.observability.automationMetrics.failedTasks++;
                            if (!this.observability.automationMetrics.errorsByType[request.task]) {
                                this.observability.automationMetrics.errorsByType[request.task] = 0;
                            }
                            this.observability.automationMetrics.errorsByType[request.task]++;
                            
                            // Update error rate metric
                            const totalTasks = this.observability.automationMetrics.tasksByType[request.task];
                            const failedTasks = this.observability.automationMetrics.errorsByType[request.task];
                            this.observability.automationMetrics.errorRateByType[request.task] = failedTasks / totalTasks;

                            return {
                                success: false,
                                error: (error as Error).message,
                                executionTime: duration,
                                workflowId: request.workflowId,
                                runId: request.runId || requestId,
                                logs: [
                                    {
                                        timestamp: new Date().toISOString(),
                                        level: 'error',
                                        message: `Task failed after ${retryCount} attempts: ${(error as Error).message}`
                                    },
                                    {
                                        timestamp: new Date().toISOString(),
                                        level: 'error',
                                        message: `Priority: ${request.priority || 'normal'}, Mode: ${request.executionMode || 'manual'}`
                                    }
                                ]
                            };
                        }

                        // Wait before retrying
                        if (retryCount <= maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
                        }
                    }
                }

                // Fallback return (should never reach here)
                return {
                    success: false,
                    error: 'Unknown error',
                    executionTime: Date.now() - startTime,
                    workflowId: request.workflowId,
                    runId: request.runId || requestId,
                    logs: [
                        {
                            timestamp: new Date().toISOString(),
                            level: 'error',
                            message: 'Unknown error occurred'
                        }
                    ]
                };
            })();

            return await Promise.race([executionPromise, timeoutPromise]);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logRequest(requestId, {
                model: 'unknown',
                duration,
                success: false,
                error: (error as Error).message,
                taskType: request.task,
                workflowId: request.workflowId,
                runId: request.runId || requestId,
                priority: request.priority,
                executionMode: request.executionMode
            });

            this.logError(requestId, 'unknown', (error as Error).message, 0, request.task, request.workflowId, request.runId || requestId, request.priority, request.executionMode);

            this.observability.automationMetrics.failedTasks++;
            if (!this.observability.automationMetrics.errorsByType[request.task]) {
                this.observability.automationMetrics.errorsByType[request.task] = 0;
            }
            this.observability.automationMetrics.errorsByType[request.task]++;

            const totalTasks = this.observability.automationMetrics.tasksByType[request.task];
            const failedTasks = this.observability.automationMetrics.errorsByType[request.task];
            this.observability.automationMetrics.errorRateByType[request.task] = failedTasks / totalTasks;

            return {
                success: false,
                error: (error as Error).message,
                executionTime: duration,
                workflowId: request.workflowId,
                runId: request.runId || requestId,
                logs: [
                    {
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: `Task failed: ${(error as Error).message}`
                    },
                    {
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: `Priority: ${request.priority || 'normal'}, Mode: ${request.executionMode || 'manual'}, Duration: ${duration}ms`
                    }
                ]
            };
        }
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
     * Create a chat completion with fallback support
     */
    async createChatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse | { error: string }> {
        const modelsToTry = request.model ? [request.model] : [...this.fallbackChain];
        
        for (let i = 0; i < modelsToTry.length; i++) {
            const model = modelsToTry[i];
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
                        model: model,
                        messages: request.messages,
                        temperature: request.temperature ?? 0.7,
                        max_tokens: request.maxTokens ?? 1000,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || `Failed to create completion with ${model}`);
                }

                const data = await response.json();
                return {
                    ...data,
                    modelUsed: model // Add model information to response
                };
            } catch (error) {
                console.warn(`Failed with model ${model}: ${(error as Error).message}`);
                if (i === modelsToTry.length - 1) {
                    return { error: (error as Error).message };
                }
            }
        }
        
        return { error: 'All models failed to respond' };
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
