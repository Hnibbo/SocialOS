/**
 * Performance Monitoring Utility
 * Track and optimize platform performance
 */

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: number;
    category: 'load' | 'render' | 'api' | 'user-interaction';
}

export class PerformanceMonitor {
    private static metrics: PerformanceMetric[] = [];
    private static readonly MAX_METRICS = 100;

    /**
     * Track page load performance
     */
    static trackPageLoad(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (perfData) {
                this.recordMetric({
                    name: 'page-load',
                    value: perfData.loadEventEnd - perfData.fetchStart,
                    unit: 'ms',
                    category: 'load',
                });

                this.recordMetric({
                    name: 'dom-content-loaded',
                    value: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                    unit: 'ms',
                    category: 'load',
                });

                this.recordMetric({
                    name: 'first-paint',
                    value: perfData.responseEnd - perfData.fetchStart,
                    unit: 'ms',
                    category: 'render',
                });
            }
        });
    }

    /**
     * Track API call performance
     */
    static async trackApiCall<T>(
        name: string,
        apiCall: () => Promise<T>
    ): Promise<T> {
        const start = performance.now();

        try {
            const result = await apiCall();
            const duration = performance.now() - start;

            this.recordMetric({
                name: `api-${name}`,
                value: duration,
                unit: 'ms',
                category: 'api',
            });

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            this.recordMetric({
                name: `api-${name}-error`,
                value: duration,
                unit: 'ms',
                category: 'api',
            });

            throw error;
        }
    }

    /**
     * Track component render time
     */
    static trackRender(componentName: string, renderTime: number): void {
        this.recordMetric({
            name: `render-${componentName}`,
            value: renderTime,
            unit: 'ms',
            category: 'render',
        });
    }

    /**
     * Track custom metric
     */
    static track(name: string, value: number, unit: 'ms' | 'count' | 'bytes' = 'ms'): void {
        this.recordMetric({
            name,
            value,
            unit,
            category: 'user-interaction',
        });
    }

    /**
     * Track user interaction
     */
    static trackInteraction(interactionName: string): void {
        this.track(`interaction-${interactionName}`, 1, 'count');
    }

    /**
     * Get performance summary
     */
    static getSummary(): {
        avgPageLoad: number;
        avgApiCall: number;
        avgRender: number;
        totalInteractions: number;
    } {
        const pageLoadMetrics = this.metrics.filter(m => m.name === 'page-load');
        const apiMetrics = this.metrics.filter(m => m.category === 'api' && !m.name.includes('error'));
        const renderMetrics = this.metrics.filter(m => m.category === 'render');
        const interactionMetrics = this.metrics.filter(m => m.category === 'user-interaction');

        return {
            avgPageLoad: this.average(pageLoadMetrics),
            avgApiCall: this.average(apiMetrics),
            avgRender: this.average(renderMetrics),
            totalInteractions: interactionMetrics.reduce((sum, m) => sum + m.value, 0),
        };
    }

    /**
     * Get slow operations
     */
    static getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
        return this.metrics
            .filter(m => m.unit === 'ms' && m.value > threshold)
            .sort((a, b) => b.value - a.value);
    }

    /**
     * Export metrics
     */
    static exportMetrics(): string {
        return JSON.stringify(this.metrics, null, 2);
    }

    /**
     * Clear metrics
     */
    static clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Flush metrics to external endpoint
     */
    static async flushMetrics(endpoint: string = '/api/v1/metrics'): Promise<void> {
        if (this.metrics.length === 0) return;

        try {
            // Disabled flushing to non-existent endpoint to avoid 404s
            /*
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.metrics),
                keepalive: true,
            });
            */
            this.clearMetrics();
        } catch (error) {
            console.warn('Failed to flush metrics', error);
        }
    }

    // Private helpers

    private static recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
        this.metrics.push({
            ...metric,
            timestamp: Date.now(),
        });

        // Limit size
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics.shift();
        }
    }

    private static average(metrics: PerformanceMetric[]): number {
        if (metrics.length === 0) return 0;
        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        return sum / metrics.length;
    }

    /**
     * Report an error
     */
    static reportError(error: Error | string, context?: Record<string, unknown>): void {
        const message = typeof error === 'string' ? error : error.message;

        console.error(`[Error] ${message}`, {
            ...context,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'server',
        });

        // Track as error metric
        this.recordMetric({
            name: 'error',
            value: 1,
            unit: 'count',
            category: 'api', // or a new category 'error'
        });
    }

    /**
     * Initialize performance monitoring
     */
    static init(): void {
        if (typeof window === 'undefined') return;

        this.trackPageLoad();

        // Track long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            this.recordMetric({
                                name: 'long-task',
                                value: entry.duration,
                                unit: 'ms',
                                category: 'render',
                            });
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch {
                // Not supported
            }

            // Track LCP
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric({
                        name: 'largest-contentful-paint',
                        value: lastEntry.startTime,
                        unit: 'ms',
                        category: 'render'
                    });
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch { }

            // Track CLS
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            this.recordMetric({
                                name: 'cumulative-layout-shift',
                                value: (entry as any).value,
                                unit: 'count', // strictly it's a score, but count fits better than ms or bytes
                                category: 'render'
                            });
                        }
                    }
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch { }
        }

        // Set up periodic flush
        setInterval(() => this.flushMetrics(), 30000);
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    PerformanceMonitor.init();
}
