
import { supabase } from "@/integrations/supabase/client";

export interface HupScoreData {
    score: number;
    xp: number;
    level: number;
    metrics: {
        logins: number;
        invites: number;
        map_interaction: number;
        matches: number;
        content_created: number;
        likes: number;
        comments: number;
        shares: number;
        group_joined: number;
        activity_attended: number;
    };
    nextLevelThreshold: number;
    badges: Badge[];
    achievements: Achievement[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    unlockedAt: string | null;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
    progress: number;
    total: number;
}

const LEVEL_THRESHOLDS = [0, 100, 500, 1200, 2500, 5000, 10000, 20000, 35000, 50000];

export const BADGES: Badge[] = [
    { id: 'first_login', name: 'First Step', description: 'Log in for the first time', icon: '🚪', rarity: 'common', unlockedAt: null },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Get 10 matches', icon: '🦋', rarity: 'uncommon', unlockedAt: null },
    { id: 'inviter', name: 'Community Builder', description: 'Invite 5 friends', icon: '👥', rarity: 'rare', unlockedAt: null },
    { id: 'content_creator', name: 'Content Creator', description: 'Create 20 posts', icon: '🎨', rarity: 'epic', unlockedAt: null },
    { id: 'map_explorer', name: 'Map Explorer', description: 'Interact with map 100 times', icon: '🗺️', rarity: 'legendary', unlockedAt: null },
];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'daily_login', title: 'Daily Login', description: 'Log in for 7 consecutive days', xpReward: 50, completed: false, progress: 0, total: 7 },
    { id: 'total_likes', title: 'Popular Content', description: 'Get 100 likes on your content', xpReward: 100, completed: false, progress: 0, total: 100 },
    { id: 'group_participation', title: 'Group Participant', description: 'Join 5 groups', xpReward: 75, completed: false, progress: 0, total: 5 },
    { id: 'activity_lover', title: 'Activity Lover', description: 'Attend 10 activities', xpReward: 150, completed: false, progress: 0, total: 10 },
];

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
            xp: 0,
            level: 1,
            metrics: { logins: 0, invites: 0, map_interaction: 0, matches: 0, content_created: 0, likes: 0, comments: 0, shares: 0, group_joined: 0, activity_attended: 0 },
            nextLevelThreshold: LEVEL_THRESHOLDS[1],
            badges: BADGES,
            achievements: ACHIEVEMENTS,
        };
    }

    const currentScore = metricsData.hup_score || 0;
    const currentLevel = metricsData.level || 1;
    const nextLevel = currentLevel < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[currentLevel] : 999999;

    // Calculate XP from metrics
    const metrics = typeof metricsData.metrics === 'object' ? metricsData.metrics : {};
    const xp = calculateXP(metrics);

    // Determine unlocked badges
    const userBadges = [...BADGES];
    if (metrics.logins >= 1) userBadges.find(b => b.id === 'first_login')!.unlockedAt = new Date().toISOString();
    if (metrics.matches >= 10) userBadges.find(b => b.id === 'social_butterfly')!.unlockedAt = new Date().toISOString();
    if (metrics.invites >= 5) userBadges.find(b => b.id === 'inviter')!.unlockedAt = new Date().toISOString();
    if (metrics.content_created >= 20) userBadges.find(b => b.id === 'content_creator')!.unlockedAt = new Date().toISOString();
    if (metrics.map_interaction >= 100) userBadges.find(b => b.id === 'map_explorer')!.unlockedAt = new Date().toISOString();

    // Determine achievements progress
    const userAchievements = [...ACHIEVEMENTS];
    userAchievements.find(a => a.id === 'daily_login')!.progress = Math.min(metrics.logins, 7);
    userAchievements.find(a => a.id === 'daily_login')!.completed = metrics.logins >= 7;
    userAchievements.find(a => a.id === 'total_likes')!.progress = metrics.likes;
    userAchievements.find(a => a.id === 'total_likes')!.completed = metrics.likes >= 100;
    userAchievements.find(a => a.id === 'group_participation')!.progress = metrics.group_joined;
    userAchievements.find(a => a.id === 'group_participation')!.completed = metrics.group_joined >= 5;
    userAchievements.find(a => a.id === 'activity_lover')!.progress = metrics.activity_attended;
    userAchievements.find(a => a.id === 'activity_lover')!.completed = metrics.activity_attended >= 10;

    return {
        score: currentScore,
        xp,
        level: currentLevel,
        metrics: {
            logins: metrics.logins || 0,
            invites: metrics.invites || 0,
            map_interaction: metrics.map_interaction || 0,
            matches: metrics.matches || 0,
            content_created: metrics.content_created || 0,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            group_joined: metrics.group_joined || 0,
            activity_attended: metrics.activity_attended || 0,
        },
        nextLevelThreshold: nextLevel,
        badges: userBadges,
        achievements: userAchievements,
    };
}

function calculateXP(metrics: any): number {
    // XP calculation from various metrics
    return (
        (metrics.logins || 0) * 5 +
        (metrics.map_interaction || 0) * 1 +
        (metrics.matches || 0) * 50 +
        (metrics.invites || 0) * 100 +
        (metrics.content_created || 0) * 20 +
        (metrics.likes || 0) * 2 +
        (metrics.comments || 0) * 3 +
        (metrics.shares || 0) * 10 +
        (metrics.group_joined || 0) * 15 +
        (metrics.activity_attended || 0) * 25
    );
}

export async function incrementMetric(userId: string, metric: keyof HupScoreData['metrics'], amount: number = 1) {
    const { data: current } = await supabase
        .from('user_metrics')
        .select('metrics, hup_score')
        .eq('user_id', userId)
        .single();

    if (!current) return;

    const metrics = (current.metrics as any) || { logins: 0, invites: 0, map_interaction: 0, matches: 0, content_created: 0, likes: 0, comments: 0, shares: 0, group_joined: 0, activity_attended: 0 };
    metrics[metric] = (metrics[metric] || 0) + amount;

    // Recalculate Score
    const newScore = calculateXP(metrics);

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

export async function getLeaderboard(): Promise<{ userId: string; username: string; score: number; level: number; avatarUrl: string | null }[]> {
    const { data, error } = await supabase
        .from('user_metrics')
        .select(`
            user_id,
            hup_score,
            level,
            profiles:profiles!user_metrics_user_id_fkey (
                username,
                avatar_url
            )
        `)
        .order('hup_score', { ascending: false })
        .limit(100);

    if (error || !data) return [];

    return data.map(item => ({
        userId: item.user_id,
        username: item.profiles?.username || 'Unknown',
        score: item.hup_score || 0,
        level: item.level || 1,
        avatarUrl: item.profiles?.avatar_url || null,
    }));
}
