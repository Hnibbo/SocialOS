/**
 * Autonomous Agent - Memory System
 * Long-term memory storage for learning user patterns
 */

export interface MemoryEntry {
    id: string;
    type: 'command' | 'pattern' | 'preference' | 'error' | 'success';
    content: string;
    context: Record<string, unknown>;
    timestamp: number;
    frequency: number;
    lastAccessed: number;
}

export class AgentMemory {
    private static readonly STORAGE_KEY = 'hup_agent_memory';
    private static readonly MAX_ENTRIES = 1000;

    /**
     * Store a memory entry
     */
    static async store(entry: Omit<MemoryEntry, 'id' | 'timestamp' | 'frequency' | 'lastAccessed'>): Promise<void> {
        const memories = await this.getAll();

        // Check if similar memory exists
        const existing = memories.find(m =>
            m.type === entry.type &&
            m.content === entry.content
        );

        if (existing) {
            // Update frequency
            existing.frequency++;
            existing.lastAccessed = Date.now();
            existing.context = { ...existing.context, ...entry.context };
        } else {
            // Create new entry
            const newEntry: MemoryEntry = {
                ...entry,
                id: this.generateId(),
                timestamp: Date.now(),
                frequency: 1,
                lastAccessed: Date.now(),
            };
            memories.push(newEntry);
        }

        // Limit size
        if (memories.length > this.MAX_ENTRIES) {
            // Remove least frequently accessed
            memories.sort((a, b) => a.frequency - b.frequency);
            memories.splice(0, memories.length - this.MAX_ENTRIES);
        }

        await this.saveAll(memories);
    }

    /**
     * Retrieve memories by type
     */
    static async getByType(type: MemoryEntry['type']): Promise<MemoryEntry[]> {
        const memories = await this.getAll();
        return memories.filter(m => m.type === type);
    }

    /**
     * Search memories
     */
    static async search(query: string): Promise<MemoryEntry[]> {
        const memories = await this.getAll();
        const lowerQuery = query.toLowerCase();

        return memories.filter(m =>
            m.content.toLowerCase().includes(lowerQuery) ||
            JSON.stringify(m.context).toLowerCase().includes(lowerQuery)
        ).sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Get most frequent patterns
     */
    static async getFrequentPatterns(limit: number = 10): Promise<MemoryEntry[]> {
        const memories = await this.getAll();
        return memories
            .filter(m => m.type === 'pattern')
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit);
    }

    /**
     * Get recent memories
     */
    static async getRecent(limit: number = 20): Promise<MemoryEntry[]> {
        const memories = await this.getAll();
        return memories
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Clear old memories
     */
    static async clearOld(daysOld: number = 30): Promise<number> {
        const memories = await this.getAll();
        const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        const filtered = memories.filter(m => m.timestamp > cutoff);
        const removed = memories.length - filtered.length;

        await this.saveAll(filtered);
        return removed;
    }

    /**
     * Export memories
     */
    static async export(): Promise<string> {
        const memories = await this.getAll();
        return JSON.stringify(memories, null, 2);
    }

    /**
     * Import memories
     */
    static async import(data: string): Promise<void> {
        try {
            const memories = JSON.parse(data) as MemoryEntry[];
            await this.saveAll(memories);
        } catch {
            throw new Error('Invalid memory data format');
        }
    }

    // Private helpers

    private static async getAll(): Promise<MemoryEntry[]> {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    private static async saveAll(memories: MemoryEntry[]): Promise<void> {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memories));
        } catch (error) {
            console.error('Failed to save memories:', error);
        }
    }

    private static generateId(): string {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Learn from command execution
     */
    static async learnFromCommand(
        command: string,
        success: boolean,
        context: Record<string, unknown>
    ): Promise<void> {
        await this.store({
            type: success ? 'success' : 'error',
            content: command,
            context: {
                ...context,
                success,
                executedAt: new Date().toISOString(),
            },
        });

        // Detect patterns
        const recentCommands = (await this.getRecent(10))
            .filter(m => m.type === 'command' || m.type === 'success')
            .map(m => m.content);

        if (recentCommands.length >= 3) {
            const pattern = this.detectCommandPattern(recentCommands);
            if (pattern) {
                await this.store({
                    type: 'pattern',
                    content: pattern,
                    context: { commands: recentCommands },
                });
            }
        }
    }

    private static detectCommandPattern(commands: string[]): string | null {
        // Simple pattern detection - can be enhanced with ML
        const commonPrefix = this.findCommonPrefix(commands);
        if (commonPrefix.length > 5) {
            return `Pattern: ${commonPrefix}*`;
        }
        return null;
    }

    private static findCommonPrefix(strings: string[]): string {
        if (strings.length === 0) return '';

        let prefix = strings[0];
        for (let i = 1; i < strings.length; i++) {
            while (strings[i].indexOf(prefix) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === '') return '';
            }
        }
        return prefix;
    }
}
