import { SafetyEngine, SafetyCheckResult } from '../shared/security';

export type SafetyCheck = SafetyCheckResult;

export class SafetyChecker {
    /**
     * Check if command is safe to execute
     */
    async validateCommand(command: string): Promise<SafetyCheckResult> {
        return await SafetyEngine.validateCommand(command);
    }

    /**
     * Check if file operation is safe
     */
    static checkFileOperation(operation: 'read' | 'write' | 'delete', path: string): SafetyCheck {
        return SafetyEngine.validateFileOperation(operation, path);
    }

    /**
     * Get user-friendly safety message
     */
    static getSafetyMessage(check: SafetyCheck): string {
        if (check.safe && !check.requiresConfirmation) {
            return 'This action is safe to execute.';
        }

        if (check.safe && check.requiresConfirmation) {
            return `This action is generally safe but requires confirmation: ${check.reason || 'System modification'}`;
        }

        return `⚠️ DANGER: ${check.reason || 'This action may be destructive'}. Please review carefully before proceeding.`;
    }
}
