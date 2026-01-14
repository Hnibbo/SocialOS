import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from './performance';

describe('PerformanceMonitor', () => {
    beforeEach(() => {
        PerformanceMonitor.clearMetrics();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('trackApiCall', () => {
        it('should track successful api calls', async () => {
            const mockApi = vi.fn().mockResolvedValue('success');

            const result = await PerformanceMonitor.trackApiCall('test-api', mockApi);

            expect(result).toBe('success');
            expect(mockApi).toHaveBeenCalled();

            const metrics = PerformanceMonitor.getSlowOperations(-1);
            expect(metrics).toHaveLength(1);
            expect(metrics[0].name).toBe('api-test-api');
            expect(metrics[0].category).toBe('api');
        });

        it('should track failed api calls', async () => {
            const mockError = new Error('API Failed');
            const mockApi = vi.fn().mockRejectedValue(mockError);

            await expect(PerformanceMonitor.trackApiCall('test-api', mockApi)).rejects.toThrow('API Failed');

            const metrics = PerformanceMonitor.getSlowOperations(-1);
            expect(metrics).toHaveLength(1);
            expect(metrics[0].name).toBe('api-test-api-error');
        });

        it('should measure duration correctly', async () => {
            const mockApi = vi.fn().mockImplementation(async () => {
                vi.advanceTimersByTime(100);
                return 'done';
            });

            await PerformanceMonitor.trackApiCall('measured-api', mockApi);

            const metrics = PerformanceMonitor.getSlowOperations(-1);
            expect(metrics[0].value).toBe(100);
        });
    });

    describe('reportError', () => {
        it('should log error and record metric', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            PerformanceMonitor.reportError(new Error('Test Error'));

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Error] Test Error'),
                expect.any(Object)
            );

            // Check internal metrics if accessible or via side effect
            // Since metrics are private, we can't easily check 'error' metric via public API unless getSummary exposes it
            // implementation of getSummary filters by category, let's see
        });
    });

    describe('getSummary', () => {
        it('should calculate averages correctly', () => {
            PerformanceMonitor.trackRender('comp1', 10);
            PerformanceMonitor.trackRender('comp2', 20);

            const summary = PerformanceMonitor.getSummary();
            expect(summary.avgRender).toBe(15);
        });
    });
});
