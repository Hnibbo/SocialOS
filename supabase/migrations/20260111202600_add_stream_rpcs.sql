-- Add helper RPC function for incrementing stream viewers

CREATE OR REPLACE FUNCTION public.increment_stream_viewers(stream_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1
    WHERE id = stream_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_stream_viewers TO authenticated;
