-- CONTENT CREATION & SOCIAL FEATURES
-- Posts, stories, media, and engagement

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content text,
    type text DEFAULT 'text', -- text, image, video, poll, event, article
    visibility text DEFAULT 'public', -- public, friends, private, custom
    location_lat double precision,
    location_lng double precision,
    location_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_pinned boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create post_media table
CREATE TABLE IF NOT EXISTS public.post_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url text NOT NULL,
    media_type text NOT NULL, -- image, video, audio
    thumbnail_url text,
    width integer,
    height integer,
    duration integer,
    file_size bigint,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_edited boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    media_url text NOT NULL,
    media_type text NOT NULL, -- image, video
    thumbnail_url text,
    duration integer DEFAULT 5,
    caption text,
    background_color text,
    link_url text,
    link_text text,
    views_count integer DEFAULT 0,
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
    created_at timestamp with time zone DEFAULT now()
);

-- Create story_views table
CREATE TABLE IF NOT EXISTS public.story_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT now(),
    UNIQUE(story_id, user_id)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    following_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create saved_posts table
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    collection_name text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts FOR SELECT
USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Likes are viewable by everyone"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Users can comment"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for stories
CREATE POLICY "Active stories are viewable by everyone"
ON public.stories FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone"
ON public.user_follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT ON public.post_media TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts USING gist(ll_to_earth(location_lat, location_lng)) WHERE location_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);

-- Function to get feed posts
CREATE OR REPLACE FUNCTION public.get_feed_posts(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    display_name text,
    avatar_url text,
    content text,
    type text,
    created_at timestamp with time zone,
    likes_count bigint,
    comments_count bigint,
    is_liked boolean,
    media jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        up.display_name,
        up.avatar_url,
        p.content,
        p.type,
        p.created_at,
        (SELECT COUNT(*) FROM public.post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM public.post_comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = p_user_id) as is_liked,
        (SELECT jsonb_agg(jsonb_build_object(
            'url', media_url,
            'type', media_type,
            'thumbnail', thumbnail_url
        ) ORDER BY order_index)
        FROM public.post_media WHERE post_id = p.id) as media
    FROM public.posts p
    JOIN public.user_profiles up ON up.id = p.user_id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND (
        p.user_id = p_user_id
        OR EXISTS (SELECT 1 FROM public.user_follows WHERE follower_id = p_user_id AND following_id = p.user_id)
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_posts TO authenticated;
