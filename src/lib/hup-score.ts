
import { supabase } from "@/integrations/supabase/client";

export interface HupScoreData {
    score: number;
    level: number;
    metrics: {
        logins: number;
        invites: number;
        map_interaction: number;
        matches: number;
    };
    nextLevelThreshold: number;
}

const LEVEL_THRESHOLDS = [0, 100, 500, 1200, 2500, 5000, 10000];

export async function getUserHupScore(userId: string): Promise<HupScoreData> {
    const { data: metricsData, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !metricsData) {
        // Return default if not found
        return {
            score: 0,
            level: 1,
            metrics: { logins: 0, invites: 0, map_interaction: 0, matches: 0 },
            nextLevelThreshold: LEVEL_THRESHOLDS[1]
        };
    }

    const currentScore = metricsData.hup_score || 0;
    const currentLevel = metricsData.level || 1;
    const nextLevel = currentLevel < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[currentLevel] : 999999;

    return {
        score: currentScore,
        level: currentLevel,
        metrics: typeof metricsData.metrics === 'object' ? metricsData.metrics : {},
        nextLevelThreshold: nextLevel
    };
}

export async function incrementMetric(userId: string, metric: 'logins' | 'invites' | 'map_interaction' | 'matches', amount: number = 1) {
    // In a real app, this would be an RPC call to ensure atomicity and security
    // For now, we fetch, update, and push back (optimistic-ish)

    const { data: current } = await supabase
        .from('user_metrics')
        .select('metrics, hup_score')
        .eq('user_id', userId)
        .single();

    if (!current) return;

    const metrics = (current.metrics as any) || { logins: 0, invites: 0, map_interaction: 0, matches: 0 };
    metrics[metric] = (metrics[metric] || 0) + amount;

    // Recalculate Score
    // Weightings: Login=5, Map=1, Match=50, Invite=100
    const newScore =
        (metrics.logins * 5) +
        (metrics.map_interaction * 1) +
        (metrics.matches * 50) +
        (metrics.invites * 100);

    // Determine Level
    let newLevel = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (newScore >= LEVEL_THRESHOLDS[i]) newLevel = i + 1;
    }

    await supabase
        .from('user_metrics')
        .update({
            metrics: metrics,
            hup_score: newScore,
            level: newLevel,
            last_updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
}
