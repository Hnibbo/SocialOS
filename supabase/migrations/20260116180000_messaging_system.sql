-- MESSAGING SYSTEM
-- Complete chat, DMs, and group messaging

-- Drop existing restricted conversations table to upgrade to Ultimate schema
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL DEFAULT 'direct', -- direct, group, channel
    name text,
    description text,
    avatar_url text,
    created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_encrypted boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_message_at timestamp with time zone DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member', -- admin, moderator, member
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone DEFAULT now(),
    is_muted boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    notification_level text DEFAULT 'all', -- all, mentions, none
    UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    content text,
    type text DEFAULT 'text', -- text, image, video, audio, file, location, poll
    metadata jsonb DEFAULT '{}'::jsonb,
    reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size bigint,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they're part of"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update conversations"
ON public.conversations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
);

-- RLS Policies for participants
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage participants"
ON public.conversation_participants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversation_participants.conversation_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- RLS Policies for reactions
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT, INSERT ON public.message_attachments TO authenticated;

-- Create indexes
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_reactions_message ON public.message_reactions(message_id);

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- Trigger for updating conversation timestamp
CREATE TRIGGER on_message_created_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to get user conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    type text,
    name text,
    avatar_url text,
    last_message_at timestamp with time zone,
    unread_count bigint,
    last_message_content text,
    last_message_sender_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        COALESCE(c.name, 
            (SELECT display_name FROM public.user_profiles 
             WHERE id = (SELECT user_id FROM public.conversation_participants 
                        WHERE conversation_id = c.id AND user_id != p_user_id LIMIT 1))
        ) as name,
        COALESCE(c.avatar_url,
            (SELECT avatar_url FROM public.user_profiles 
             WHERE id = (SELECT user_id FROM public.conversation_participants 
                        WHERE conversation_id = c.id AND user_id != p_user_id LIMIT 1))
        ) as avatar_url,
        c.last_message_at,
        (SELECT COUNT(*) FROM public.messages m
         WHERE m.conversation_id = c.id
         AND m.created_at > cp.last_read_at
         AND m.sender_id != p_user_id) as unread_count,
        (SELECT content FROM public.messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as last_message_content,
        (SELECT sender_id FROM public.messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as last_message_sender_id
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = p_user_id
    ORDER BY c.last_message_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_conversations TO authenticated;
