/**
 * Autonomous Agent - Predictive Actions
 * Predicts next likely actions based on context and history
 */

export interface PredictedAction {
    command: string;
    confidence: number;
    reason: string;
    category: 'build' | 'test' | 'deploy' | 'debug' | 'install' | 'git' | 'other';
}

export interface WorkspaceContext {
    files: string[];
    recentCommands: string[];
    currentDirectory: string;
    gitStatus?: {
        branch: string;
        hasChanges: boolean;
        unstagedFiles: number;
    };
}

export class ActionPredictor {
    /**
     * Predict next actions based on workspace context
     */
    static predictNextActions(context: WorkspaceContext): PredictedAction[] {
        const predictions: PredictedAction[] = [];

        // Check for package.json - suggest npm commands
        if (context.files.includes('package.json')) {
            predictions.push(...this.predictNpmActions(context));
        }

        // Check for git changes
        if (context.gitStatus?.hasChanges) {
            predictions.push(...this.predictGitActions(context));
        }

        // Check recent command patterns
        predictions.push(...this.predictFromHistory(context));

        // Check for common file patterns
        predictions.push(...this.predictFromFiles(context));

        // Sort by confidence
        return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }

    private static predictNpmActions(context: WorkspaceContext): PredictedAction[] {
        const predictions: PredictedAction[] = [];
        const lastCommand = context.recentCommands[context.recentCommands.length - 1];

        // If just installed packages, suggest running dev server
        if (lastCommand?.includes('npm install') || lastCommand?.includes('yarn add')) {
            predictions.push({
                command: 'npm run dev',
                confidence: 0.8,
                reason: 'Start development server after installing dependencies',
                category: 'build',
            });
        }

        // If package.json exists but no recent npm commands
        if (!context.recentCommands.some(cmd => cmd.includes('npm') || cmd.includes('yarn'))) {
            predictions.push({
                command: 'npm install',
                confidence: 0.6,
                reason: 'Install dependencies from package.json',
                category: 'install',
            });
        }

        return predictions;
    }

    private static predictGitActions(context: WorkspaceContext): PredictedAction[] {
        const predictions: PredictedAction[] = [];

        if (!context.gitStatus) return predictions;

        // Unstaged files - suggest staging
        if (context.gitStatus.unstagedFiles > 0) {
            predictions.push({
                command: 'git add .',
                confidence: 0.7,
                reason: `Stage ${context.gitStatus.unstagedFiles} modified files`,
                category: 'git',
            });
        }

        // On feature branch - suggest push
        if (context.gitStatus.branch !== 'main' && context.gitStatus.branch !== 'master') {
            predictions.push({
                command: `git push origin ${context.gitStatus.branch}`,
                confidence: 0.65,
                reason: 'Push feature branch changes',
                category: 'git',
            });
        }

        return predictions;
    }

    private static predictFromHistory(context: WorkspaceContext): PredictedAction[] {
        const predictions: PredictedAction[] = [];
        const commands = context.recentCommands;

        // Pattern: test -> build -> deploy
        if (commands.some(cmd => cmd.includes('test')) &&
            commands.some(cmd => cmd.includes('build'))) {
            predictions.push({
                command: 'npm run deploy',
                confidence: 0.75,
                reason: 'Deploy after successful tests and build',
                category: 'deploy',
            });
        }

        // Pattern: repeated failed command
        const lastCommand = commands[commands.length - 1];
        const failureCount = commands.filter(cmd => cmd === lastCommand).length;
        if (failureCount > 2) {
            predictions.push({
                command: `# Debug: ${lastCommand}`,
                confidence: 0.5,
                reason: 'Command failed multiple times - needs debugging',
                category: 'debug',
            });
        }

        return predictions;
    }

    private static predictFromFiles(context: WorkspaceContext): PredictedAction[] {
        const predictions: PredictedAction[] = [];

        // TypeScript project
        if (context.files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
            predictions.push({
                command: 'npm run type-check',
                confidence: 0.6,
                reason: 'Run TypeScript type checking',
                category: 'test',
            });
        }

        // Test files present
        if (context.files.some(f => f.includes('.test.') || f.includes('.spec.'))) {
            predictions.push({
                command: 'npm test',
                confidence: 0.7,
                reason: 'Run test suite',
                category: 'test',
            });
        }

        // Dockerfile present
        if (context.files.includes('Dockerfile')) {
            predictions.push({
                command: 'docker build -t app .',
                confidence: 0.65,
                reason: 'Build Docker image',
                category: 'build',
            });
        }

        return predictions;
    }

    /**
     * Learn from executed action
     */
    static learnFromAction(action: string, context: WorkspaceContext): void {
        try {
            const history = JSON.parse(localStorage.getItem('agent_action_history') || '[]');
            history.push({
                action,
                timestamp: Date.now(),
                context: {
                    files: context.files.length,
                    structure: context.currentDirectory
                }
            });
            // Keep last 50 actions
            if (history.length > 50) history.shift();
            localStorage.setItem('agent_action_history', JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to save action history', e);
        }
    }
}
