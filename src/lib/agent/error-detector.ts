/**
 * Autonomous Agent - Error Detector
 * Analyzes command output to detect and categorize errors
 */

export interface DetectedError {
    type: 'syntax' | 'runtime' | 'dependency' | 'permission' | 'network' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
}

export class ErrorDetector {
    /**
     * Analyze command output for errors
     */
    static detectErrors(output: string, exitCode: number): DetectedError[] {
        const errors: DetectedError[] = [];

        // Exit code indicates error
        if (exitCode !== 0) {
            errors.push(...this.analyzeByExitCode(exitCode, output));
        }

        // Pattern-based detection
        errors.push(...this.detectByPatterns(output));

        return errors;
    }

    private static analyzeByExitCode(code: number, output: string): DetectedError[] {
        const errors: DetectedError[] = [];

        if (code === 127) {
            errors.push({
                type: 'dependency',
                severity: 'high',
                message: 'Command not found',
                suggestion: 'Install the required package or check PATH',
            });
        } else if (code === 126) {
            errors.push({
                type: 'permission',
                severity: 'high',
                message: 'Permission denied',
                suggestion: 'Check file permissions or run with appropriate privileges',
            });
        } else if (code === 1) {
            // Generic error - analyze output
            errors.push(...this.detectByPatterns(output));
        }

        return errors;
    }

    private static detectByPatterns(output: string): DetectedError[] {
        const errors: DetectedError[] = [];

        // Syntax errors
        if (/SyntaxError|ParseError|Unexpected token/i.test(output)) {
            const match = output.match(/(.+):(\d+):(\d+)/);
            errors.push({
                type: 'syntax',
                severity: 'high',
                message: 'Syntax error detected',
                file: match?.[1],
                line: match?.[2] ? parseInt(match[2]) : undefined,
                suggestion: 'Check syntax at the specified location',
            });
        }

        // Module/dependency errors
        if (/Cannot find module|Module not found|ImportError/i.test(output)) {
            const match = output.match(/['"]([^'"]+)['"]/);
            errors.push({
                type: 'dependency',
                severity: 'high',
                message: `Missing dependency: ${match?.[1] || 'unknown'}`,
                suggestion: `Install missing dependency: npm install ${match?.[1] || ''}`,
            });
        }

        // Type errors
        if (/TypeError|ReferenceError|is not defined/i.test(output)) {
            errors.push({
                type: 'runtime',
                severity: 'medium',
                message: 'Runtime type error',
                suggestion: 'Check variable declarations and types',
            });
        }

        // Network errors
        if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Network error/i.test(output)) {
            errors.push({
                type: 'network',
                severity: 'medium',
                message: 'Network connectivity issue',
                suggestion: 'Check internet connection and firewall settings',
            });
        }

        // Permission errors
        if (/EACCES|Permission denied|Access is denied/i.test(output)) {
            errors.push({
                type: 'permission',
                severity: 'high',
                message: 'Permission denied',
                suggestion: 'Check file/directory permissions',
            });
        }

        // Port already in use
        if (/EADDRINUSE|address already in use/i.test(output)) {
            const match = output.match(/:(\d+)/);
            errors.push({
                type: 'runtime',
                severity: 'medium',
                message: `Port ${match?.[1] || 'unknown'} already in use`,
                suggestion: `Kill the process using port ${match?.[1]} or use a different port`,
            });
        }

        return errors;
    }

    /**
     * Get suggested fix for an error
     */
    static getSuggestedFix(error: DetectedError): string | null {
        if (error.suggestion) {
            return error.suggestion;
        }

        switch (error.type) {
            case 'dependency':
                return 'Run: npm install or yarn install';
            case 'permission':
                return 'Run: chmod +x <file> or check directory permissions';
            case 'network':
                return 'Check your internet connection';
            case 'syntax':
                return 'Review the code at the specified line';
            default:
                return null;
        }
    }

    /**
     * Determine if error is auto-fixable
     */
    static isAutoFixable(error: DetectedError): boolean {
        return error.type === 'dependency' && error.severity !== 'critical';
    }

    /**
     * Generate auto-fix command
     */
    static generateAutoFix(error: DetectedError): string | null {
        if (!this.isAutoFixable(error)) {
            return null;
        }

        if (error.type === 'dependency' && error.message.includes('Missing dependency:')) {
            const match = error.message.match(/Missing dependency: (.+)/);
            if (match?.[1]) {
                return `npm install ${match[1]}`;
            }
        }

        return null;
    }
}
