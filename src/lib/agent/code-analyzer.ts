/**
 * Autonomous Agent - Code Analyzer
 * Analyzes code structure and provides insights
 */

export interface CodeAnalysis {
    language: string;
    complexity: number;
    linesOfCode: number;
    functions: number;
    classes: number;
    imports: string[];
    exports: string[];
    issues: CodeIssue[];
}

export interface CodeIssue {
    type: 'warning' | 'error' | 'info';
    message: string;
    line?: number;
    suggestion?: string;
}

export class CodeAnalyzer {
    /**
     * Analyze code file
     */
    static analyzeCode(content: string, filename: string): CodeAnalysis {
        const language = this.detectLanguage(filename);

        return {
            language,
            complexity: this.calculateComplexity(content),
            linesOfCode: this.countLines(content),
            functions: this.countFunctions(content, language),
            classes: this.countClasses(content, language),
            imports: this.extractImports(content, language),
            exports: this.extractExports(content, language),
            issues: CodeAnalyzer.detectIssues(content),
        };
    }

    private static detectLanguage(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript-react',
            'js': 'javascript',
            'jsx': 'javascript-react',
            'py': 'python',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
        };
        return langMap[ext || ''] || 'unknown';
    }

    private static countLines(content: string): number {
        return content.split('\n').filter(line => line.trim().length > 0).length;
    }

    private static calculateComplexity(content: string): number {
        // Cyclomatic complexity approximation
        let complexity = 1;

        // Count decision points
        const patterns = [
            /\bif\b/g,
            /\belse\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\b\?\b/g, // ternary
            /&&/g,
            /\|\|/g,
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) complexity += matches.length;
        });

        return complexity;
    }

    private static countFunctions(content: string, language: string): number {
        if (language.includes('typescript') || language.includes('javascript')) {
            const functionPatterns = [
                /function\s+\w+/g,
                /const\s+\w+\s*=\s*\(/g,
                /\w+\s*:\s*\(/g, // method definitions
                /=>\s*{/g, // arrow functions
            ];

            let count = 0;
            functionPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) count += matches.length;
            });
            return count;
        }

        return 0;
    }

    private static countClasses(content: string, language: string): number {
        if (language.includes('typescript') || language.includes('javascript')) {
            const matches = content.match(/class\s+\w+/g);
            return matches ? matches.length : 0;
        }
        return 0;
    }

    private static extractImports(content: string, language: string): string[] {
        const imports: string[] = [];

        if (language.includes('typescript') || language.includes('javascript')) {
            const importRegex = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }
        }

        return imports;
    }

    private static extractExports(content: string, language: string): string[] {
        const exports: string[] = [];

        if (language.includes('typescript') || language.includes('javascript')) {
            const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
            let match;
            while ((match = exportRegex.exec(content)) !== null) {
                exports.push(match[1]);
            }
        }

        return exports;
    }

    private static detectIssues(content: string): CodeIssue[] {
        const issues: CodeIssue[] = [];

        // Check for console.log
        if (content.includes('console.log')) {
            issues.push({
                type: 'warning',
                message: 'console.log found - should be removed in production',
                suggestion: 'Use proper logging library or remove debug statements',
            });
        }

        // Check for TODO comments
        const todoMatches = content.match(/\/\/\s*TODO:?(.+)/gi);
        if (todoMatches) {
            todoMatches.forEach(todo => {
                issues.push({
                    type: 'info',
                    message: `TODO found: ${todo.replace(/\/\/\s*TODO:?\s*/i, '')}`,
                });
            });
        }

        // Check for long functions (>50 lines)
        const functionBlocks = content.match(/function[^{]*{[^}]{500,}}/g);
        if (functionBlocks) {
            issues.push({
                type: 'warning',
                message: 'Long function detected (>50 lines)',
                suggestion: 'Consider breaking down into smaller functions',
            });
        }

        // Check for deep nesting (>4 levels)
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const indent = line.match(/^\s*/)?.[0].length || 0;
            if (indent > 16) { // 4 levels of 4-space indentation
                issues.push({
                    type: 'warning',
                    message: 'Deep nesting detected',
                    line: index + 1,
                    suggestion: 'Consider extracting nested logic into separate functions',
                });
            }
        });

        return issues;
    }

    /**
     * Generate dependency graph
     */
    static generateDependencyGraph(files: Map<string, string>): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        files.forEach((content, filename) => {
            const language = this.detectLanguage(filename);
            const imports = this.extractImports(content, language);
            graph.set(filename, imports);
        });

        return graph;
    }

    /**
     * Suggest improvements
     */
    static suggestImprovements(analysis: CodeAnalysis): string[] {
        const suggestions: string[] = [];

        if (analysis.complexity > 20) {
            suggestions.push('High complexity detected - consider refactoring');
        }

        if (analysis.linesOfCode > 300) {
            suggestions.push('Large file - consider splitting into smaller modules');
        }

        if (analysis.functions === 0 && analysis.linesOfCode > 50) {
            suggestions.push('No functions detected - consider organizing code into functions');
        }

        if (analysis.issues.filter(i => i.type === 'error').length > 0) {
            suggestions.push('Fix errors before proceeding');
        }

        return suggestions;
    }
}
