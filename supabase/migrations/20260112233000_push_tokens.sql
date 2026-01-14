-- Migration: Create Push Tokens Table

CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, token)
);

-- RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.push_tokens;
CREATE POLICY "Users can manage their own tokens" ON public.push_tokens
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cleanup old/invalid tokens (optional function)
CREATE OR REPLACE FUNCTION public.cleanup_invalid_tokens()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.push_tokens WHERE created_at < now() - INTERVAL '30 days';
END;
$$;
