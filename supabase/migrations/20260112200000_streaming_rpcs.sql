-- Migration: Streaming RPCs

-- 1. Increment Viewers RPC
CREATE OR REPLACE FUNCTION public.increment_stream_viewers(stream_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1
    WHERE id = stream_id;
END;
$$;

-- 2. Decrement Viewers RPC (for completeness)
CREATE OR REPLACE FUNCTION public.decrement_stream_viewers(stream_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = stream_id;
END;
$$;
