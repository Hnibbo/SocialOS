import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Content } from '@/types/social-os';
import { toast } from 'sonner';
import { useAI } from './useAI';

export interface RecommendationScore {
  contentId: string;
  score: number;
  reasons: string[];
}

export function useContentRecommendations() {
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [predictedScores, setPredictedScores] = useState<RecommendationScore[]>([]);
  const { execute: getAIRecommendations } = useAI({ feature: 'activity_recommendations' });

  const fetchRecommendations = useCallback(async (userId: string, limit: number = 10) => {
    setLoading(true);
    try {
      // First, try to get AI-based recommendations
      const { data: aiRecommendations, error: aiError } = await supabase.rpc('get_content_recommendations', {
        p_user_id: userId,
        p_limit: limit
      });

      if (aiError) {
        console.error('Error fetching AI recommendations:', aiError);
      }

      if (aiRecommendations && aiRecommendations.length > 0) {
        setRecommendations(aiRecommendations as Content[]);
        // Predict scores for recommendations
        await predictRecommendationScores(aiRecommendations as Content[], userId);
      } else {
        // Fallback to trending content if no AI recommendations
        const { data: trendingContent, error: trendingError } = await supabase
          .from('content')
          .select('*')
          .eq('status', 'published')
          .order('likes_count', { ascending: false })
          .limit(limit);

        if (trendingError) {
          console.error('Error fetching trending content:', trendingError);
          toast.error('Failed to load recommendations');
        } else {
          setRecommendations(trendingContent as Content[]);
          await predictRecommendationScores(trendingContent as Content[], userId);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  const predictRecommendationScores = useCallback(async (contentList: Content[], userId: string) => {
    try {
      const scores: RecommendationScore[] = [];
      
      // Get user preferences from localStorage (set during onboarding)
      const userInterests = JSON.parse(localStorage.getItem('user_interests') || '[]');
      const userGoals = JSON.parse(localStorage.getItem('user_goals') || '[]');

      // Predict scores based on content attributes and user preferences
      contentList.forEach(content => {
        let score = 0.5; // Base score
        
        // Match content category with user interests
        if (content.category && userInterests.includes(content.category)) {
          score += 0.3;
        }
        
        // Match content type with user goals
        if (content.type && userGoals.some(goal => 
          (goal.includes('Learn') && content.type.includes('educational')) ||
          (goal.includes('Network') && content.type.includes('professional')) ||
          (goal.includes('Discover') && content.type.includes('event'))
        )) {
          score += 0.2;
        }

        // Boost score for recent content
        const daysSincePublished = (new Date() - new Date(content.created_at)) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 1) {
          score += 0.1;
        }

        scores.push({
          contentId: content.id,
          score: Math.min(1, score), // Cap score at 1
          reasons: []
        });
      });

      // Sort by predicted score
      scores.sort((a, b) => b.score - a.score);
      setPredictedScores(scores);
    } catch (error) {
      console.error('Error predicting scores:', error);
    }
  }, []);

  const fetchPersonalizedFeed = useCallback(async (userId: string, limit: number = 20) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: userId,
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching personalized feed:', error);
        toast.error('Failed to load personalized feed');
        // Fallback to global feed
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('content')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!fallbackError && fallbackData) {
          setRecommendations(fallbackData as Content[]);
          await predictRecommendationScores(fallbackData as Content[], userId);
        }
      } else {
        setRecommendations(data as Content[]);
        await predictRecommendationScores(data as Content[], userId);
      }
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      toast.error('Failed to load personalized feed');
    } finally {
      setLoading(false);
    }
  }, []);

  const getContentScore = useCallback((contentId: string): number => {
    const scoreInfo = predictedScores.find(score => score.contentId === contentId);
    return scoreInfo?.score || 0.5;
  }, [predictedScores]);

  return {
    recommendations,
    loading,
    predictedScores,
    fetchRecommendations,
    fetchPersonalizedFeed,
    getContentScore
  };
}
