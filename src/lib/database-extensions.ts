// Extended Database Type Definitions
// This file extends the auto-generated Database type with missing tables

// Import the Json type from the auto-generated file
export type { Json } from './types';

// Platform Pages Table
export type platform_pages = {
    Row: {
        id: string;
        slug: string;
        title: string;
        content: Json;
        description: string | null;
        metadata: Json | null;
        is_published: boolean;
        created_at: string | null;
        updated_at: string | null;
    };
    Insert: {
        id?: string;
        slug: string;
        title: string;
        content?: Json;
        description?: string | null;
        metadata?: Json | null;
        is_published?: boolean;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Update: {
        id?: string;
        slug?: string;
        title?: string;
        content?: Json;
        description?: string | null;
        metadata?: Json | null;
        is_published?: boolean;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Relationships: [];
};

// User Identity Table
export type user_identity = {
    Row: {
        id: string;
        user_id: string;
        pronouns: string[] | null;
        gender_identity: string | null;
        sexual_orientation: string | null;
        languages: string[] | null;
        bio: string | null;
        interests: string[] | null;
        looking_for: string[] | null;
        dating_preferences: Json | null;
        created_at: string | null;
        updated_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        pronouns?: string[] | null;
        gender_identity?: string | null;
        sexual_orientation?: string | null;
        languages?: string[] | null;
        bio?: string | null;
        interests?: string[] | null;
        looking_for?: string[] | null;
        dating_preferences?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        pronouns?: string[] | null;
        gender_identity?: string | null;
        sexual_orientation?: string | null;
        languages?: string[] | null;
        bio?: string | null;
        interests?: string[] | null;
        looking_for?: string[] | null;
        dating_preferences?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Relationships: [];
};

// User Installed Agents Table
export type user_installed_agents = {
    Row: {
        id: string;
        user_id: string;
        agent_id: string;
        installed_at: string | null;
        config: Json | null;
        is_active: boolean | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        agent_id: string;
        installed_at?: string | null;
        config?: Json | null;
        is_active?: boolean | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        agent_id?: string;
        installed_at?: string | null;
        config?: Json | null;
        is_active?: boolean | null;
    };
    Relationships: [];
};

// AI Subscriptions Table
export type ai_subscriptions = {
    Row: {
        id: string;
        user_id: string;
        agent_id: string | null;
        plan_type: 'free' | 'basic' | 'premium' | 'custom';
        status: 'active' | 'expired' | 'cancelled' | 'suspended';
        expires_at: string;
        features_enabled: Json | null;
        created_at: string | null;
        updated_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        agent_id?: string | null;
        plan_type?: 'free' | 'basic' | 'premium' | 'custom';
        status?: 'active' | 'expired' | 'cancelled' | 'suspended';
        expires_at?: string;
        features_enabled?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        agent_id?: string | null;
        plan_type?: 'free' | 'basic' | 'premium' | 'custom';
        status?: 'active' | 'expired' | 'cancelled' | 'suspended';
        expires_at?: string;
        features_enabled?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Relationships: [];
};

// AI Conversations Table
export type ai_conversations = {
    Row: {
        id: string;
        user_id: string;
        agent_id: string | null;
        title: string;
        context: string;
        metadata: Json | null;
        created_at: string | null;
        updated_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        agent_id?: string | null;
        title: string;
        context?: string;
        metadata?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        agent_id?: string | null;
        title?: string;
        context?: string;
        metadata?: Json | null;
        created_at?: string | null;
        updated_at?: string | null;
    };
    Relationships: [];
};

// AI Messages Table
export type ai_messages = {
    Row: {
        id: string;
        conversation_id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        metadata: Json | null;
        created_at: string | null;
    };
    Insert: {
        id?: string;
        conversation_id: string;
        role?: 'user' | 'assistant' | 'system';
        content: string;
        metadata?: Json | null;
        created_at?: string | null;
    };
    Update: {
        id?: string;
        conversation_id?: string;
        role?: 'user' | 'assistant' | 'system';
        content?: string;
        metadata?: Json | null;
        created_at?: string | null;
    };
    Relationships: [];
};

// AI Memories Table
export type ai_memories = {
    Row: {
        id: string;
        user_id: string;
        memory_type: 'user_preference' | 'conversation_summary' | 'fact' | 'relationship';
        content: string;
        importance: number;
        expires_at: string | null;
        created_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        memory_type?: 'user_preference' | 'conversation_summary' | 'fact' | 'relationship';
        content: string;
        importance?: number;
        expires_at?: string | null;
        created_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        memory_type?: 'user_preference' | 'conversation_summary' | 'fact' | 'relationship';
        content?: string;
        importance?: number;
        expires_at?: string | null;
        created_at?: string | null;
    };
    Relationships: [];
};

// AI Tasks Table
export type ai_tasks = {
    Row: {
        id: string;
        user_id: string;
        task_type: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        input_data: Json | null;
        result_data: Json | null;
        started_at: string | null;
        completed_at: string | null;
        created_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        task_type: string;
        status?: 'pending' | 'running' | 'completed' | 'failed';
        input_data?: Json | null;
        result_data?: Json | null;
        started_at?: string | null;
        completed_at?: string | null;
        created_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        task_type?: string;
        status?: 'pending' | 'running' | 'completed' | 'failed';
        input_data?: Json | null;
        result_data?: Json | null;
        started_at?: string | null;
        completed_at?: string | null;
        created_at?: string | null;
    };
    Relationships: [];
};

// Content Engagements Table
export type content_engagements = {
    Row: {
        id: string;
        user_id: string;
        content_id: string;
        engagement_type: 'view' | 'like' | 'share' | 'save' | 'comment';
        metadata: Json | null;
        created_at: string | null;
    };
    Insert: {
        id?: string;
        user_id: string;
        content_id: string;
        engagement_type?: 'view' | 'like' | 'share' | 'save' | 'comment';
        metadata?: Json | null;
        created_at?: string | null;
    };
    Update: {
        id?: string;
        user_id?: string;
        content_id?: string;
        engagement_type?: 'view' | 'like' | 'share' | 'save' | 'comment';
        metadata?: Json | null;
        created_at?: string | null;
    };
    Relationships: [];
};

// Extend Database type with new tables
export type DatabaseExtended = Database & {
    public: {
        Tables: Database['public']['Tables'] & {
            platform_pages: platform_pages;
            user_identity: user_identity;
            user_installed_agents: user_installed_agents;
            ai_subscriptions: ai_subscriptions;
            ai_conversations: ai_conversations;
            ai_messages: ai_messages;
            ai_memories: ai_memories;
            ai_tasks: ai_tasks;
            content_engagements: content_engagements;
        };
    };
};
