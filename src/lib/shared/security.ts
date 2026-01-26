import { supabase } from '@/integrations/supabase/client';

export interface SafetyCheckResult {
    safe: boolean;
    reason?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    requiresConfirmation: boolean;
}

export class SafetyEngine {
    private static readonly PROTECTED_PATHS = [
        '/',
        '/bin',
        '/boot',
        '/dev',
        '/etc',
        '/lib',
        '/proc',
        '/root',
        '/sbin',
        '/sys',
        '/usr',
        '/var',
        'C:\\Windows',
        'C:\\Program Files',
    ];

    /**
     * Comprehensive command validation
     */
    static async validateCommand(command: string): Promise<SafetyCheckResult> {
        const lowerCommand = command.trim().toLowerCase();

        // 1. Fetch Dynamic Security Rules from DB
        try {
            const { data: dbRules } = await supabase
                .from('security_rules')
                .select('pattern, reason, severity, requires_confirmation')
                .eq('is_active', true);

            if (dbRules) {
                for (const rule of dbRules) {
                    if (lowerCommand.includes(rule.pattern.toLowerCase())) {
                        return {
                            safe: false,
                            reason: rule.reason || `Restricted command pattern detected: ${rule.pattern}`,
                            severity: (rule.severity as 'low' | 'medium' | 'high' | 'critical') || 'high',
                            requiresConfirmation: rule.requires_confirmation ?? true,
                        };
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching dynamic safety rules, falling back to static logic", error);
        }

        // 2. Check for dangerous RegEx patterns (Static Failsafes)
        const staticDangerousPatterns = [
            /rm\s+-rf\s+\//,
            /rm\s+-rf\s+\*/,
            /rm\s+-rf\s+~/,
            /sudo\s+rm/,
            /curl.*\|\s*bash/,
            /wget.*\|\s*sh/,
            />\s*\/etc\/passwd/,
            />\s*\/etc\/shadow/,
            /kill\s+-9\s+1/,
        ];

        for (const pattern of staticDangerousPatterns) {
            if (pattern.test(command)) {
                return {
                    safe: false,
                    reason: 'Dangerous operational pattern detected (Static Failsafe)',
                    severity: 'critical',
                    requiresConfirmation: true,
                };
            }
        }

        // 3. Check for protected path targeting
        for (const path of this.PROTECTED_PATHS) {
            if (command.includes(path)) {
                return {
                    safe: false,
                    reason: `Command targets or references protected system path: ${path}`,
                    severity: 'high',
                    requiresConfirmation: true,
                };
            }
        }

        // 4. Path traversal checks
        if (command.includes('..') && (
            lowerCommand.includes('cd ') ||
            lowerCommand.includes('rm ') ||
            lowerCommand.includes('cat ') ||
            lowerCommand.includes('mv ') ||
            lowerCommand.includes('cp ')
        )) {
            return {
                safe: false,
                reason: 'Potential path traversal attempt detected',
                severity: 'medium',
                requiresConfirmation: true,
            };
        }

        return {
            safe: true,
            severity: 'low',
            requiresConfirmation: false,
        };
    }

    /**
     * File operation safety check
     */
    static validateFileOperation(operation: 'read' | 'write' | 'delete', targetPath: string): SafetyCheckResult {
        for (const protectedPath of this.PROTECTED_PATHS) {
            if (targetPath.startsWith(protectedPath)) {
                return {
                    safe: false,
                    reason: `Target path is protected: ${protectedPath}`,
                    severity: 'critical',
                    requiresConfirmation: true,
                };
            }
        }

        if (operation === 'delete') {
            return {
                safe: true,
                reason: 'File deletion requires confirmation',
                severity: 'medium',
                requiresConfirmation: true,
            };
        }

        return {
            safe: true,
            severity: 'low',
            requiresConfirmation: false,
        };
    }
}
