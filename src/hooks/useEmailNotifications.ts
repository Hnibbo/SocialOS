import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SendGridService } from '@/lib/sendgrid-service';
import { toast } from 'sonner';

// Email notification preferences type
export interface EmailNotificationPreferences {
  enable_email_notifications: boolean;
  email_notification_types: {
    daily_digest: boolean;
    weekly_summary: boolean;
    important_updates: boolean;
    marketing: boolean;
  };
}

export function useEmailNotifications() {
  const [preferences, setPreferences] = useState<EmailNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize SendGrid service
  const sendGridService = new SendGridService({
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY || '',
  });

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        setPreferences(data?.email_notification_types ? {
          enable_email_notifications: data.enable_email_notifications ?? true,
          email_notification_types: data.email_notification_types ?? {
            daily_digest: true,
            weekly_summary: false,
            important_updates: true,
            marketing: false,
          },
        } : {
          enable_email_notifications: true,
          email_notification_types: {
            daily_digest: true,
            weekly_summary: false,
            important_updates: true,
            marketing: false,
          },
        });
      } catch (error) {
        console.error('Error loading email notification preferences:', error);
        toast.error('Failed to load email notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: EmailNotificationPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          enable_email_notifications: newPreferences.enable_email_notifications,
          email_notification_types: newPreferences.email_notification_types,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Email notification preferences updated!');
    } catch (error) {
      console.error('Error updating email notification preferences:', error);
      toast.error('Failed to update email notification preferences');
    }
  }, []);

  // Send test email notification
  const sendTestEmail = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has email
      if (!user.email) {
        toast.error('Please add an email to your profile');
        return;
      }

      const result = await sendGridService.sendNotificationEmail(
        user.email,
        'Welcome to Hup!',
        `
          <p>🎉 Welcome to Hup, your new social experience!</p>
          <p>Here are a few things you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Find and connect with friends</li>
            <li>Join communities and events</li>
            <li>Share your moments</li>
          </ul>
          <p>We're excited to have you on board!</p>
        `,
        'success'
      );

      if (result.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  }, []);

  // Send daily digest email (called by cron job or scheduled task)
  const sendDailyDigest = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if daily digest is enabled
      if (!preferences?.enable_email_notifications || !preferences.email_notification_types.daily_digest) {
        console.log('Daily digest disabled for user');
        return;
      }

      // Check if user has email
      if (!user.email) {
        console.log('User has no email');
        return;
      }

      // Fetch user activity for the day
      const { data: activities, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (activityError) throw activityError;

      // Calculate digest statistics
      const totalLikes = activities?.filter(a => a.type === 'like').length || 0;
      const totalComments = activities?.filter(a => a.type === 'comment').length || 0;
      const newFollowers = activities?.filter(a => a.type === 'follow').length || 0;
      const popularPosts = activities?.filter(a => a.type === 'post')
        .map(post => ({
          title: post.content.slice(0, 50) + '...',
          likes: activities?.filter(a => a.type === 'like' && a.related_id === post.id).length || 0,
          comments: activities?.filter(a => a.type === 'comment' && a.related_id === post.id).length || 0,
        }))
        .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
        .slice(0, 3) || [];

      // Send digest email
      const result = await sendGridService.sendDailyDigestEmail(user.email, {
        totalLikes,
        totalComments,
        newFollowers,
        popularPosts,
      });

      if (result.success) {
        console.log('Daily digest email sent successfully');
      } else {
        console.error('Failed to send daily digest email:', result.error);
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }, [preferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    sendTestEmail,
    sendDailyDigest,
  };
}
