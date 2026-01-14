// Hup Content & Reels Hook

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Content } from '@/types/social-os';
import { toast } from 'sonner';

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
            // @ts-expect-error
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

    const createContent = useCallback(async (contentData: Partial<Content>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login first');
            return null;
        }

        const { data, error } = await supabase
            .from('content')
            .insert({
                ...contentData,
                creator_id: user.id,
                status: 'published' // Default to published for now (or pending moderation)
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
    }, []);

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
