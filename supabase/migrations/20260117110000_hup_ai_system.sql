-- HUP AI ASSISTANT FOUNDATION
-- Memory, conversations, and autonomous task system

-- 1. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title text,
    summary text,
    context_data jsonb DEFAULT '{}'::jsonb,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role text NOT NULL, -- 'user', 'assistant', 'system'
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    tokens_used integer,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. AI Memories (Long-term persistent facts about the user)
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    memory_type text NOT NULL, -- 'preference', 'fact', 'entity', 'event'
    content text NOT NULL,
    importance integer DEFAULT 5, -- 1-10
    embedding vector(1536), -- For semantic search (if pgvector is enabled)
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. AI Tasks (Autonomous actions planned/executed by Hup AI)
CREATE TABLE IF NOT EXISTS public.ai_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    task_type text NOT NULL, -- 'reminder', 'automation', 'research', 'personal_assistant'
    status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    request_content text NOT NULL,
    result_content text,
    execution_data jsonb DEFAULT '{}'::jsonb,
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. User Feedback for AI
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES public.ai_messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL, -- 1 (bad) to 5 (excellent)
    comment text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- AI Policies
CREATE POLICY "Users can manage their own AI conversations"
ON public.ai_conversations FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI messages"
ON public.ai_messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE id = ai_messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their own AI memories"
ON public.ai_memories FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI tasks"
ON public.ai_tasks FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON public.ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON public.ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON public.ai_tasks(status);

-- Grant permissions
GRANT ALL ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_tasks TO authenticated;
GRANT ALL ON public.ai_feedback TO authenticated;
