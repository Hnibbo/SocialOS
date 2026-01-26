import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAI } from './useAI';

export interface AutomationSearchResult extends AISearchResult {
  automationRelevance: 'low' | 'medium' | 'high';
  automationTags: string[];
  executionContext: any;
}

export interface AISearchResult {
  id: string;
  type: 'user' | 'post' | 'hashtag' | 'location' | 'group' | 'automation' | 'workflow' | 'task' | 'automation_template' | 'workflow_template' | 'automation_category';
  title: string;
  subtitle?: string;
  avatar_url?: string;
  content?: string;
  created_at?: string;
  likes_count?: number;
  comments_count?: number;
  score?: number;
  relevance?: string;
  // Automation specific fields
  automationType?: string;
  workflowId?: string;
  taskName?: string;
  executionCount?: number;
  successRate?: number;
  averageExecutionTime?: number;
  // Enhanced automation fields
  category?: string;
  description?: string;
  isTemplate?: boolean;
  popularity?: number;
  compatibility?: string[];
  tags?: string[];
  lastExecution?: string;
  nextScheduledExecution?: string;
  parameters?: Record<string, unknown>;
  capabilities?: string[];
  requirements?: string[];
  documentation?: string;
}

export function useAISearch() {
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const { execute: aiSearch } = useAI({ feature: 'search' });

  const search = useCallback(async (
    query: string,
    type: 'all' | 'users' | 'posts' | 'hashtags' | 'locations' | 'groups' | 'automation' | 'workflows' | 'tasks' | 'automation_templates' | 'workflow_templates' | 'automation_categories' = 'all',
    page: number = 1,
    pageSize: number = 10
  ) => {
    setLoading(true);
    try {
      // First, try AI-powered search
      const aiResult = await aiSearch({
        query,
        type,
        page,
        pageSize,
        timestamp: new Date().toISOString()
      });

      if (aiResult?.result?.results) {
        setResults(aiResult.result.results);
        setTotalResults(aiResult.result.totalResults || aiResult.result.results.length);
        return;
      }

      // Fallback to traditional search if AI fails
      const fallbackResults = await fallbackSearch(query, type, page, pageSize);
      setResults(fallbackResults);
      setTotalResults(fallbackResults.length);
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to traditional search
      const fallbackResults = await fallbackSearch(query, type, page, pageSize);
      setResults(fallbackResults);
      setTotalResults(fallbackResults.length);
    } finally {
      setLoading(false);
    }
  }, [aiSearch]);

  const searchAutomation = useCallback(async (
    query: string,
    automationType?: 'workflow' | 'task' | 'automation' | 'automation_template' | 'workflow_template' | 'automation_category',
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      category?: string;
      tags?: string[];
      minSuccessRate?: number;
      maxExecutionTime?: number;
      popularity?: number;
    }
  ) => {
    const type = automationType || 'automation';
    // TODO: Implement filter support in search function
    return search(query, type as any, page, pageSize);
  }, [search]);

  const searchAutomationTemplates = useCallback(async (
    query: string,
    category?: string,
    page: number = 1,
    pageSize: number = 10
  ) => {
    const results = await search(query, 'automation_templates', page, pageSize);
    return category 
      ? results.filter(r => r.category?.toLowerCase() === category.toLowerCase())
      : results;
  }, [search]);

  const searchWorkflowTemplates = useCallback(async (
    query: string,
    category?: string,
    page: number = 1,
    pageSize: number = 10
  ) => {
    const results = await search(query, 'workflow_templates', page, pageSize);
    return category 
      ? results.filter(r => r.category?.toLowerCase() === category.toLowerCase())
      : results;
  }, [search]);

  const searchAutomationCategories = useCallback(async (
    query: string,
    page: number = 1,
    pageSize: number = 10
  ) => {
    return search(query, 'automation_categories', page, pageSize);
  }, [search]);

  const getAutomationSearchSuggestions = useCallback(async (
    query: string,
    limit: number = 5
  ): Promise<AISearchResult[]> => {
    try {
      const { data: suggestions } = await supabase.functions.invoke('ai-search-suggestions', {
        body: { 
          query, 
          limit, 
          types: ['automation', 'workflow', 'task', 'automation_template'] 
        }
      });
      return suggestions || [];
    } catch (error) {
      console.error('Error getting automation search suggestions:', error);
      return [];
    }
  }, []);

  const fallbackSearch = useCallback(async (
    query: string,
    type: string,
    page: number,
    pageSize: number
  ): Promise<AISearchResult[]> => {
    const offset = (page - 1) * pageSize;
    const results: AISearchResult[] = [];

    try {
      if (type === 'all' || type === 'users') {
        const { data: users } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .ilike('display_name', `%${query}%`)
          .range(offset, offset + pageSize - 1);

        if (users) {
          users.forEach(user => {
            results.push({
              id: user.id,
              type: 'user',
              title: user.display_name,
              avatar_url: user.avatar_url,
              score: 0.8,
              relevance: 'Name matches'
            });
          });
        }
      }

      if (type === 'all' || type === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, content, created_at, user_id, likes_count, comments_count')
          .ilike('content', `%${query}%`)
          .eq('visibility', 'public')
          .range(offset, offset + pageSize - 1);

        if (posts) {
          const userIds = [...new Set(posts.map(post => post.user_id))];
          const { data: postUsers } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          posts.forEach(post => {
            const postUser = postUsers?.find(u => u.id === post.user_id);
            results.push({
              id: post.id,
              type: 'post',
              title: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
              subtitle: postUser?.display_name,
              content: post.content,
              created_at: post.created_at,
              likes_count: post.likes_count,
              comments_count: post.comments_count,
              score: 0.7,
              relevance: 'Content matches'
            });
          });
        }
      }

      if (type === 'all' || type === 'hashtags') {
        const hashtagPattern = new RegExp(`#${query}[\\w]*`, 'g');
        const allPosts = await supabase
          .from('posts')
          .select('content')
          .eq('visibility', 'public');

        if (!allPosts.error && allPosts.data) {
          const hashtags = new Set<string>();
          allPosts.data.forEach(post => {
            const matches = post.content.match(hashtagPattern);
            if (matches) {
              matches.forEach(hashtag => {
                hashtags.add(hashtag.toLowerCase());
              });
            }
          });

          const paginatedHashtags = Array.from(hashtags)
            .slice(offset, offset + pageSize);
          paginatedHashtags.forEach(hashtag => {
            results.push({
              id: hashtag,
              type: 'hashtag',
              title: hashtag,
              score: 0.6,
              relevance: 'Hashtag matches'
            });
          });
        }
      }
    } catch (error) {
      console.error('Fallback search failed:', error);
    }

    return results;
  }, []);

  const searchSuggestions = useCallback(async (query: string, limit: number = 5) => {
    try {
      const { data: suggestions } = await supabase.functions.invoke('ai-search-suggestions', {
        body: { query, limit }
      });

      return suggestions || [];
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    totalResults,
    search,
    searchAutomation,
    searchAutomationTemplates,
    searchWorkflowTemplates,
    searchAutomationCategories,
    getAutomationSearchSuggestions,
    searchSuggestions,
    clearResults
  };
}

export function useAutomationSearch() {
  const [results, setResults] = useState<AutomationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const { execute: aiSearch } = useAI({ feature: 'search' });

  const search = useCallback(async (
    query: string,
    type: 'automation_tasks' | 'workflows' | 'personas' | 'all' = 'all',
    automationContext: AutomationContext,
    page: number = 1,
    pageSize: number = 10
  ) => {
    setLoading(true);
    try {
      // First, try AI-powered search
      const aiResult = await aiSearch({
        query,
        type,
        page,
        pageSize,
        timestamp: new Date().toISOString(),
        context: automationContext
      });

      if (aiResult?.result?.results) {
        const automationResults: AutomationSearchResult[] = aiResult.result.results.map((result: any) => ({
          ...result,
          automationRelevance: result.automationRelevance || 'medium',
          automationTags: result.automationTags || [],
          executionContext: result.executionContext || automationContext
        }));
        
        setResults(automationResults);
        setTotalResults(aiResult.result.totalResults || aiResult.result.results.length);
        return;
      }

      // Fallback to traditional search if AI fails
      const fallbackResults = await fallbackSearch(query, type as any, page, pageSize);
      const automationFallbackResults: AutomationSearchResult[] = fallbackResults.map(result => ({
        ...result,
        automationRelevance: 'low',
        automationTags: [],
        executionContext: automationContext
      }));
      
      setResults(automationFallbackResults);
      setTotalResults(automationFallbackResults.length);
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to traditional search
      const fallbackResults = await fallbackSearch(query, type as any, page, pageSize);
      const automationFallbackResults: AutomationSearchResult[] = fallbackResults.map(result => ({
        ...result,
        automationRelevance: 'low',
        automationTags: [],
        executionContext: automationContext
      }));
      
      setResults(automationFallbackResults);
      setTotalResults(automationFallbackResults.length);
    } finally {
      setLoading(false);
    }
  }, [aiSearch]);

  const searchAutomationTasks = useCallback(async (
    query: string,
    automationContext: AutomationContext,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      category?: string;
      tags?: string[];
      minSuccessRate?: number;
      maxExecutionTime?: number;
      popularity?: number;
    }
  ) => {
    return search(query, 'automation_tasks', automationContext, page, pageSize);
  }, [search]);

  const searchWorkflows = useCallback(async (
    query: string,
    automationContext: AutomationContext,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      category?: string;
      tags?: string[];
      minSuccessRate?: number;
      maxExecutionTime?: number;
      popularity?: number;
    }
  ) => {
    return search(query, 'workflows', automationContext, page, pageSize);
  }, [search]);

  const searchPersonas = useCallback(async (
    query: string,
    automationContext: AutomationContext,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      category?: string;
      tags?: string[];
      minSuccessRate?: number;
      maxExecutionTime?: number;
      popularity?: number;
    }
  ) => {
    return search(query, 'personas', automationContext, page, pageSize);
  }, [search]);

  const getAutomationSearchSuggestions = useCallback(async (
    query: string,
    automationContext: AutomationContext,
    limit: number = 5
  ): Promise<AutomationSearchResult[]> => {
    try {
      const { data: suggestions } = await supabase.functions.invoke('ai-search-suggestions', {
        body: {
          query,
          limit,
          types: ['automation', 'workflow', 'task', 'automation_template'],
          context: automationContext
        }
      });
      
      return suggestions.map((suggestion: any) => ({
        ...suggestion,
        automationRelevance: suggestion.automationRelevance || 'medium',
        automationTags: suggestion.automationTags || [],
        executionContext: automationContext
      }));
    } catch (error) {
      console.error('Error getting automation search suggestions:', error);
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    totalResults,
    search,
    searchAutomationTasks,
    searchWorkflows,
    searchPersonas,
    getAutomationSearchSuggestions,
    clearResults
  };
}
