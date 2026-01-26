import { useState, useCallback } from 'react';
import { useAI } from './useAI';

export interface AutomationModerationResult extends ModerationResult {
  automationRisk: 'low' | 'medium' | 'high';
  suggestedAction: 'allow' | 'block' | 'review' | 'quarantine';
  automationContext: {
    persona: string;
    action: string;
    historicalPattern: string;
  };
}

export interface ModerationResult {
  safe: boolean;
  categories: {
    hate: boolean;
    hate_threatening: boolean;
    self_harm: boolean;
    sexual: boolean;
    sexual_minors: boolean;
    violence: boolean;
    violence_graphic: boolean;
    automation_malicious: boolean;
    automation_spam: boolean;
    automation_abusive: boolean;
    automation_privacy: boolean;
    automation_scam: boolean;
    automation_exploitative: boolean;
    automation_denial_of_service: boolean;
    automation_rate_limiting: boolean;
    automation_data_theft: boolean;
    automation_misinformation: boolean;
    automation_phishing: boolean;
    automation_malware: boolean;
    automation_unauthorized_access: boolean;
    automation_resource_exhaustion: boolean;
    automation_compliance_violation: boolean;
    automation_unethical_behavior: boolean;
  };
  scores: {
    hate: number;
    hate_threatening: number;
    self_harm: number;
    sexual: number;
    sexual_minors: number;
    violence: number;
    violence_graphic: number;
    automation_malicious: number;
    automation_spam: number;
    automation_abusive: number;
    automation_privacy: number;
    automation_scam: number;
    automation_exploitative: number;
    automation_denial_of_service: number;
    automation_rate_limiting: number;
    automation_data_theft: number;
    automation_misinformation: number;
    automation_phishing: number;
    automation_malware: number;
    automation_unauthorized_access: number;
    automation_resource_exhaustion: number;
    automation_compliance_violation: number;
    automation_unethical_behavior: number;
  };
  flagged: boolean;
  reason?: string;
  confidence?: number;
  automationRisk?: 'low' | 'medium' | 'high' | 'critical';
  automationImpact?: 'none' | 'minor' | 'moderate' | 'severe';
  complianceIssues?: string[];
  recommendedAction?: 'allow' | 'block' | 'flag' | 'review' | 'rate_limit' | 'sandbox';
  automationDetails?: {
    riskFactors: string[];
    complianceFrameworks: string[];
    mitigationSuggestions: string[];
    auditRequired: boolean;
    sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AutomationModerationContext {
  automationType: string;
  workflowId?: string;
  runId?: string;
  userContext?: {
    userId: string;
    reputationScore?: number;
    automationHistory?: Array<{
      task: string;
      timestamp: string;
      success: boolean;
      moderationResult?: ModerationResult;
    }>;
  };
}

export function useAIModeration() {
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { execute: moderateContent } = useAI({ feature: 'content_moderation' });

  const moderate = useCallback(async (
    content: string, 
    type: 'text' | 'image' | 'video' = 'text', 
    context?: AutomationModerationContext
  ): Promise<ModerationResult> => {
    setLoading(true);
    setResult(null);

    try {
      const aiResult = await moderateContent({
        content,
        type,
        timestamp: new Date().toISOString(),
        context
      });

      const moderationResult: ModerationResult = {
        safe: aiResult.result.safe ?? true,
        categories: aiResult.result.categories ?? {
          hate: false,
          hate_threatening: false,
          self_harm: false,
          sexual: false,
          sexual_minors: false,
          violence: false,
          violence_graphic: false,
          automation_malicious: false,
          automation_spam: false,
          automation_abusive: false,
          automation_privacy: false,
          automation_scam: false,
          automation_exploitative: false,
          automation_denial_of_service: false,
          automation_rate_limiting: false,
          automation_data_theft: false
        },
        scores: aiResult.result.scores ?? {
          hate: 0,
          hate_threatening: 0,
          self_harm: 0,
          sexual: 0,
          sexual_minors: 0,
          violence: 0,
          violence_graphic: 0,
          automation_malicious: 0,
          automation_spam: 0,
          automation_abusive: 0,
          automation_privacy: 0,
          automation_scam: 0,
          automation_exploitative: 0,
          automation_denial_of_service: 0,
          automation_rate_limiting: 0,
          automation_data_theft: 0
        },
        flagged: aiResult.result.flagged ?? false,
        reason: aiResult.result.reason,
        confidence: aiResult.result.confidence,
        automationRisk: aiResult.result.automationRisk,
        automationImpact: aiResult.result.automationImpact,
        complianceIssues: aiResult.result.complianceIssues,
        recommendedAction: aiResult.result.recommendedAction
      };

      setResult(moderationResult);
      return moderationResult;
    } catch (error) {
      console.error('Moderation failed:', error);
      // Fallback to safe if AI moderation fails
      const fallbackResult: ModerationResult = {
        safe: true,
        categories: {
          hate: false,
          hate_threatening: false,
          self_harm: false,
          sexual: false,
          sexual_minors: false,
          violence: false,
          violence_graphic: false,
          automation_malicious: false,
          automation_spam: false,
          automation_abusive: false,
          automation_privacy: false,
          automation_scam: false,
          automation_exploitative: false,
          automation_denial_of_service: false,
          automation_rate_limiting: false,
          automation_data_theft: false
        },
        scores: {
          hate: 0,
          hate_threatening: 0,
          self_harm: 0,
          sexual: 0,
          sexual_minors: 0,
          violence: 0,
          violence_graphic: 0,
          automation_malicious: 0,
          automation_spam: 0,
          automation_abusive: 0,
          automation_privacy: 0,
          automation_scam: 0,
          automation_exploitative: 0,
          automation_denial_of_service: 0,
          automation_rate_limiting: 0,
          automation_data_theft: 0
        },
        flagged: false,
        automationRisk: 'low',
        automationImpact: 'none',
        recommendedAction: 'allow'
      };
      setResult(fallbackResult);
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  }, [moderateContent]);

  const moderateAutomation = useCallback(async (
    automationData: {
      task: string;
      parameters: Record<string, unknown>;
      workflowId?: string;
    },
    context?: AutomationModerationContext
  ): Promise<ModerationResult> => {
    const automationContent = JSON.stringify(automationData);
    return moderate(automationContent, 'text', {
      ...context,
      automationType: automationData.task
    });
  }, [moderate]);

  const moderateAutomationTask = useCallback(async (
    task: string,
    parameters: Record<string, unknown>,
    context?: AutomationModerationContext
  ): Promise<ModerationResult> => {
    return moderateAutomation({ task, parameters }, context);
  }, [moderateAutomation]);

  const moderateWorkflow = useCallback(async (
    workflowId: string,
    workflowData: any,
    context?: AutomationModerationContext
  ): Promise<ModerationResult> => {
    const workflowContent = JSON.stringify({
      workflowId,
      ...workflowData
    });
    return moderate(workflowContent, 'text', {
      ...context,
      automationType: 'workflow',
      workflowId
    });
  }, [moderate]);

  const isAutomationSafe = useCallback((result: ModerationResult): boolean => {
    // Check if automation is safe based on risk and impact
    if (result.automationRisk === 'critical' || result.automationRisk === 'high') {
      return false;
    }
    
    if (result.automationImpact === 'severe') {
      return false;
    }
    
    return isContentSafe(result);
  }, []);

  const getAutomationViolationReasons = useCallback((result: ModerationResult): string[] => {
    const reasons: string[] = getViolationReasons(result);
    
    if (result.automationRisk === 'critical') {
      reasons.push('Critical automation risk');
    } else if (result.automationRisk === 'high') {
      reasons.push('High automation risk');
    }
    
    if (result.automationImpact === 'severe') {
      reasons.push('Severe automation impact');
    } else if (result.automationImpact === 'moderate') {
      reasons.push('Moderate automation impact');
    }
    
    if (result.complianceIssues) {
      reasons.push(...result.complianceIssues);
    }
    
    return reasons;
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
  }, []);

  return {
    moderate,
    moderateAutomation,
    moderateAutomationTask,
    moderateWorkflow,
    isAutomationSafe,
    getAutomationViolationReasons,
    reset,
    result,
    loading
  };
}

export function useAutomationModeration() {
  const [result, setResult] = useState<AutomationModerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { execute: moderateContent } = useAI({ feature: 'content_moderation' });

  const moderate = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'video' = 'text',
    automationContext: AutomationContext
  ): Promise<AutomationModerationResult> => {
    setLoading(true);
    setResult(null);

    try {
      const aiResult = await moderateContent({
        content,
        type,
        timestamp: new Date().toISOString(),
        context: automationContext
      });

      const moderationResult: AutomationModerationResult = {
        safe: aiResult.result.safe ?? true,
        categories: aiResult.result.categories ?? {
          hate: false,
          hate_threatening: false,
          self_harm: false,
          sexual: false,
          sexual_minors: false,
          violence: false,
          violence_graphic: false,
          automation_malicious: false,
          automation_spam: false,
          automation_abusive: false,
          automation_privacy: false,
          automation_scam: false,
          automation_exploitative: false,
          automation_denial_of_service: false,
          automation_rate_limiting: false,
          automation_data_theft: false,
          automation_misinformation: false,
          automation_phishing: false,
          automation_malware: false,
          automation_unauthorized_access: false,
          automation_resource_exhaustion: false,
          automation_compliance_violation: false,
          automation_unethical_behavior: false
        },
        scores: aiResult.result.scores ?? {
          hate: 0,
          hate_threatening: 0,
          self_harm: 0,
          sexual: 0,
          sexual_minors: 0,
          violence: 0,
          violence_graphic: 0,
          automation_malicious: 0,
          automation_spam: 0,
          automation_abusive: 0,
          automation_privacy: 0,
          automation_scam: 0,
          automation_exploitative: 0,
          automation_denial_of_service: 0,
          automation_rate_limiting: 0,
          automation_data_theft: 0,
          automation_misinformation: 0,
          automation_phishing: 0,
          automation_malware: 0,
          automation_unauthorized_access: 0,
          automation_resource_exhaustion: 0,
          automation_compliance_violation: 0,
          automation_unethical_behavior: 0
        },
        flagged: aiResult.result.flagged ?? false,
        reason: aiResult.result.reason,
        confidence: aiResult.result.confidence,
        automationRisk: aiResult.result.automationRisk || 'low',
        automationImpact: aiResult.result.automationImpact,
        complianceIssues: aiResult.result.complianceIssues,
        recommendedAction: aiResult.result.recommendedAction,
        automationDetails: aiResult.result.automationDetails,
        suggestedAction: aiResult.result.recommendedAction || 'allow',
        automationContext: automationContext
      };

      setResult(moderationResult);
      return moderationResult;
    } catch (error) {
      console.error('Automation moderation failed:', error);
      // Fallback to safe if AI moderation fails
      const fallbackResult: AutomationModerationResult = {
        safe: true,
        categories: {
          hate: false,
          hate_threatening: false,
          self_harm: false,
          sexual: false,
          sexual_minors: false,
          violence: false,
          violence_graphic: false,
          automation_malicious: false,
          automation_spam: false,
          automation_abusive: false,
          automation_privacy: false,
          automation_scam: false,
          automation_exploitative: false,
          automation_denial_of_service: false,
          automation_rate_limiting: false,
          automation_data_theft: false,
          automation_misinformation: false,
          automation_phishing: false,
          automation_malware: false,
          automation_unauthorized_access: false,
          automation_resource_exhaustion: false,
          automation_compliance_violation: false,
          automation_unethical_behavior: false
        },
        scores: {
          hate: 0,
          hate_threatening: 0,
          self_harm: 0,
          sexual: 0,
          sexual_minors: 0,
          violence: 0,
          violence_graphic: 0,
          automation_malicious: 0,
          automation_spam: 0,
          automation_abusive: 0,
          automation_privacy: 0,
          automation_scam: 0,
          automation_exploitative: 0,
          automation_denial_of_service: 0,
          automation_rate_limiting: 0,
          automation_data_theft: 0,
          automation_misinformation: 0,
          automation_phishing: 0,
          automation_malware: 0,
          automation_unauthorized_access: 0,
          automation_resource_exhaustion: 0,
          automation_compliance_violation: 0,
          automation_unethical_behavior: 0
        },
        flagged: false,
        automationRisk: 'low',
        automationImpact: 'none',
        recommendedAction: 'allow',
        suggestedAction: 'allow',
        automationContext: automationContext
      };
      setResult(fallbackResult);
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  }, [moderateContent]);

  const moderateAutomation = useCallback(async (
    automationData: {
      task: string;
      parameters: Record<string, unknown>;
      workflowId?: string;
    },
    automationContext: AutomationContext
  ): Promise<AutomationModerationResult> => {
    const automationContent = JSON.stringify(automationData);
    return moderate(automationContent, 'text', {
      ...automationContext,
      action: automationData.task
    });
  }, [moderate]);

  const moderateAutomationTask = useCallback(async (
    task: string,
    parameters: Record<string, unknown>,
    automationContext: AutomationContext
  ): Promise<AutomationModerationResult> => {
    return moderateAutomation({ task, parameters }, automationContext);
  }, [moderateAutomation]);

  const moderateWorkflow = useCallback(async (
    workflowId: string,
    workflowData: any,
    automationContext: AutomationContext
  ): Promise<AutomationModerationResult> => {
    const workflowContent = JSON.stringify({
      workflowId,
      ...workflowData
    });
    return moderate(workflowContent, 'text', {
      ...automationContext,
      action: 'workflow',
    });
  }, [moderate]);

  const isAutomationSafe = useCallback((result: AutomationModerationResult): boolean => {
    // Check if automation is safe based on risk and impact
    if (result.automationRisk === 'critical' || result.automationRisk === 'high') {
      return false;
    }
    
    if (result.automationImpact === 'severe') {
      return false;
    }
    
    return isContentSafe(result);
  }, []);

  const getAutomationViolationReasons = useCallback((result: AutomationModerationResult): string[] => {
    const reasons: string[] = getViolationReasons(result);
    
    if (result.automationRisk === 'critical') {
      reasons.push('Critical automation risk');
    } else if (result.automationRisk === 'high') {
      reasons.push('High automation risk');
    }
    
    if (result.automationImpact === 'severe') {
      reasons.push('Severe automation impact');
    } else if (result.automationImpact === 'moderate') {
      reasons.push('Moderate automation impact');
    }
    
    if (result.complianceIssues) {
      reasons.push(...result.complianceIssues);
    }
    
    return reasons;
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
  }, []);

  return {
    moderate,
    moderateAutomation,
    moderateAutomationTask,
    moderateWorkflow,
    isAutomationSafe,
    getAutomationViolationReasons,
    reset,
    result,
    loading
  };
}

// Helper function to check if content is safe
export function isContentSafe(moderationResult: ModerationResult): boolean {
  return moderationResult.safe && !moderationResult.flagged;
}

// Helper function to get violation reasons
export function getViolationReasons(moderationResult: ModerationResult): string[] {
  const reasons: string[] = [];

  if (moderationResult.categories.hate) reasons.push('Hate speech');
  if (moderationResult.categories.hate_threatening) reasons.push('Threatening hate speech');
  if (moderationResult.categories.self_harm) reasons.push('Self-harm');
  if (moderationResult.categories.sexual) reasons.push('Sexual content');
  if (moderationResult.categories.sexual_minors) reasons.push('Sexual content involving minors');
  if (moderationResult.categories.violence) reasons.push('Violence');
  if (moderationResult.categories.violence_graphic) reasons.push('Graphic violence');

  return reasons;
}
