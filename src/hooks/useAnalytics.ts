import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PerformanceMonitor } from "@/lib/utils/performance";

export interface AnalyticsEvent {
    id: string;
    event_type: string;
    event_category: string;
    event_data: Record<string, unknown>;
    created_at: string;
}

export interface UserMetrics {
    total_commands: number;
    total_file_operations: number;
    total_ai_requests: number;
    active_workspaces: number;
    active_days: number;
    last_activity: string;
    first_activity: string;
}

export interface DailyMetric {
    metric_date: string;
    commands_count: number;
    files_modified: number;
    ai_requests: number;
    session_duration_minutes: number;
}

export function useAnalytics(workspaceId?: string) {
    const [metrics, setMetrics] = useState<UserMetrics | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const start = performance.now();
            // Fetch user metrics
            const { data: metricsData, error: metricsError } = await supabase
                .from('user_metrics')
                .select('*')
                .single();
            const duration = performance.now() - start;
            PerformanceMonitor.track('fetchUserMetrics', duration);

            if (metricsError) {
                PerformanceMonitor.reportError(metricsError, { context: 'fetchUserMetrics' });
            }

            if (metricsData) {
                setMetrics(metricsData);
            }

            // Fetch daily metrics for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let dailyQuery = supabase
                .from('daily_metrics')
                .select('*')
                .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('metric_date', { ascending: true });

            if (workspaceId) {
                dailyQuery = dailyQuery.eq('workspace_id', workspaceId);
            }

            const { data: dailyData } = await dailyQuery;
            if (dailyData) {
                setDailyMetrics(dailyData);
            }

            // Fetch recent events
            let eventsQuery = supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (workspaceId) {
                eventsQuery = eventsQuery.eq('workspace_id', workspaceId);
            }

            const { data: eventsData } = await eventsQuery;
            if (eventsData) {
                setRecentEvents(eventsData);
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const logEvent = async (
        eventType: string,
        eventCategory: string,
        eventData: Record<string, unknown> = {},
        targetWorkspaceId?: string
    ) => {
        try {
            const { error } = await supabase.rpc('log_analytics_event', {
                p_event_type: eventType,
                p_event_category: eventCategory,
                p_event_data: eventData,
                p_workspace_id: targetWorkspaceId || workspaceId || null,
            });

            if (error) throw error;

            // Refresh analytics after logging
            await fetchAnalytics();
        } catch (error) {
            console.error('Error logging event:', error);
        }
    };

    const refreshMetrics = async () => {
        try {
            await supabase.rpc('refresh_analytics_views');
            await fetchAnalytics();
        } catch (error) {
            console.error('Error refreshing metrics:', error);
        }
    };

    return {
        metrics,
        dailyMetrics,
        recentEvents,
        loading,
        logEvent,
        refreshMetrics,
        refetch: fetchAnalytics,
    };
}
