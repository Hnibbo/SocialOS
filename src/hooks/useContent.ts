// Hup Content & Reels Hook

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Content } from '@/types/social-os';
import { toast } from 'sonner';
import { useAIModeration, isContentSafe, getViolationReasons } from './useAIModeration';

export function useContent() {
    const [feed, setFeed] = useState<Content[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFeed = useCallback(async (options: { type?: string, limit?: number } = {}) => {
        setLoading(true);
        let query = supabase
            .from('content')
            .select('*')
            .eq('status', 'published') // or 'approved', depending on moderation flow
            .order('created_at', { ascending: false })
            .limit(options.limit || 20);

        if (options.type) {
            // @ts-expect-error - Supabase type definition for content_type doesn't match all possible options
            query = query.eq('content_type', options.type);
        }

        // In real app, we would include personalized feed logic (RPC)

        const { data, error } = await query;

        if (error) {
            toast.error('Failed to load feed');
            console.error(error);
        } else {
            setFeed(data as Content[]);
        }
        setLoading(false);
    }, []);

    const { moderate } = useAIModeration();

    const createContent = useCallback(async (contentData: Partial<Content>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login first');
            return null;
        }

        // Moderate content before publishing
        const moderationResult = await moderate(
            contentData.caption || '',
            contentData.content_type === 'reel' || contentData.content_type === 'live' ? 'video' : 'text'
        );

        if (!isContentSafe(moderationResult)) {
            const violations = getViolationReasons(moderationResult);
            const violationText = violations.join(', ');
            toast.error(`Content rejected: ${violationText}`);
            return null;
        }

        const { data, error } = await supabase
            .from('content')
            .insert({
                ...contentData,
                creator_id: user.id,
                status: 'published',
                moderation_result: moderationResult
            })
            .select()
            .single();

        if (error) {
            toast.error(error.message);
            return null;
        }

        toast.success('Content posted!');
        // Ideally prepend to feed
        setFeed(prev => [data as Content, ...prev]);
        return data as Content;
    }, [moderate]);

    const likeContent = useCallback(async (contentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login first');
            return;
        }

        // Optimistic update
        setFeed(prev => prev.map(c =>
            c.id === contentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c
        ));

        const { error } = await supabase.from('content_engagements').insert({
            content_id: contentId,
            user_id: user.id,
            engagement_type: 'like'
        });

        if (error) {
            if (error.code !== '23505') { // Ignore duplicate likes
                toast.error('Failed to like');
                // Revert optimistic
                setFeed(prev => prev.map(c =>
                    c.id === contentId ? { ...c, likes_count: (c.likes_count || 0) - 1 } : c
                ));
            }
        }
    }, []);

    return {
        feed,
        loading,
        fetchFeed,
        createContent,
        likeContent
    };
}
