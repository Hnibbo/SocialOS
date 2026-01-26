import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type UserProfile = Tables<'user_profiles'>;
export type UserIdentity = {
  user_id: string;
  pronouns: string[];
  gender_identity: string;
  sexual_orientation: string;
  languages: string[];
  bio: string;
  interests: string[];
};

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchIdentity = async (userId: string): Promise<UserIdentity | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_identity')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error fetching user identity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user identity');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followersError) throw followersError;

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      // Get posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      if (postsError) throw postsError;

      // Get matches count
      const { count: matchesCount, error: matchesError } = await supabase
        .from('dating_matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (matchesError) throw matchesError;

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0,
        matches: matchesCount || 0
      };
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
      return {
        followers: 0,
        following: 0,
        posts: 0,
        matches: 0
      };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: content, error: contentError } = await supabase
        .from('content')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (contentError) throw contentError;

      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('creator_id', userId)
        .order('start_time', { ascending: false })
        .limit(5);

      if (activitiesError) throw activitiesError;

      return {
        content,
        activities
      };
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user activity');
      return {
        content: [],
        activities: []
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateIdentity = async (userId: string, updates: Partial<UserIdentity>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_identity')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating user identity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user identity');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setProfiles(data || []);
      return data || [];
    } catch (err) {
      console.error('Error searching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to search profiles');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProfiles = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's interests
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('interests')
        .eq('id', userId)
        .single();

      // Get users with similar interests
      if (currentUserProfile?.interests?.length > 0) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .neq('id', userId)
          .overlaps('interests', currentUserProfile.interests)
          .limit(10);

        if (error) throw error;

        setProfiles(data || []);
        return data || [];
      }

      // Fallback to random users if no interests
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('id', userId)
        .limit(10);

      if (error) throw error;

      setProfiles(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching recommended profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommended profiles');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
          notifications_enabled: true
        })
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error following user:', err);
      setError(err instanceof Error ? err.message : 'Failed to follow user');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to unfollow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async (followerId: string, followingId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (err) {
      console.error('Error checking following status:', err);
      return false;
    }
  };

  return {
    profiles,
    loading,
    error,
    fetchProfile,
    fetchIdentity,
    fetchUserStats,
    fetchUserActivity,
    updateProfile,
    updateIdentity,
    searchProfiles,
    fetchRecommendedProfiles,
    followUser,
    unfollowUser,
    checkFollowingStatus
  };
};
