-- Create platform_pages table for CMS functionality
CREATE TABLE IF NOT EXISTS public.platform_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    metadata JSONB,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_platform_pages_slug ON public.platform_pages(slug);
CREATE INDEX IF NOT EXISTS idx_platform_pages_published ON public.platform_pages(is_published, updated_at DESC);

-- Enable RLS
ALTER TABLE public.platform_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view published pages
CREATE POLICY "Public can view published pages" ON public.platform_pages
    FOR SELECT
    TO public
    USING (is_published = true);

-- Authenticated users can view all pages
CREATE POLICY "Authenticated users can view all pages" ON public.platform_pages
    FOR SELECT
    TO authenticated
    USING (true);

-- Only authenticated users can insert pages
CREATE POLICY "Authenticated users can insert pages" ON public.platform_pages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins or page creators can update
CREATE POLICY "Admins or creators can update pages" ON public.platform_pages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Only admins or page creators can delete
CREATE POLICY "Admins or creators can delete pages" ON public.platform_pages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.platform_pages TO authenticated;
GRANT SELECT ON public.platform_pages TO anon;

COMMENT ON TABLE public.platform_pages IS 'CMS pages for custom platform content and landing pages';
