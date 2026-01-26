import { useState, useEffect } from 'react';
import { X, Play, Volume2, VolumeX, Eye, Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  views: number;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  reactions?: {
    type: 'like' | 'love' | 'laugh' | 'wow';
    user_id: string;
  }[];
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isPaused && currentStory) {
      const duration = currentStory.media_type === 'video' ? 15000 : 5000;
      const increment = 100 / (duration / 100);
      
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + increment;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPaused, currentStory]);

  useEffect(() => {
    if (currentStory && !hasViewed) {
      markAsViewed(currentStory.id);
      setHasViewed(true);
    }
  }, [currentStory]);

  const markAsViewed = async (storyId: string) => {
    try {
      await supabase.rpc('increment_story_views', { story_id: storyId });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setHasViewed(false);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setHasViewed(false);
    }
  };

  const handleReaction = async (type: 'like' | 'love' | 'laugh' | 'wow') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingReaction = currentStory.reactions?.find(r => r.user_id === user.id);
      
      if (existingReaction) {
        await supabase
          .from('story_reactions')
          .delete()
          .eq('story_id', currentStory.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('story_reactions')
          .insert({
            story_id: currentStory.id,
            user_id: user.id,
            type
          });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="absolute top-4 left-4 right-16 flex gap-1 z-40">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="relative w-full h-full flex items-center justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt={currentStory.caption}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/api/placeholder/400/800';
            }}
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
            onEnded={nextStory}
          />
        )}

        {isPaused && currentStory.media_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-16 w-16 text-white/80" />
          </div>
        )}
      </div>

      {/* User Info and Caption */}
      <div className="absolute top-16 left-4 right-4 flex items-end justify-between text-white z-40">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={currentStory.user.avatar_url} alt={currentStory.user.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {currentStory.user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{currentStory.user.username}</p>
            <p className="text-sm opacity-80">{formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStory.media_type === 'video' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Caption and Actions */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-4 right-16 text-white z-40">
          <p className="text-sm mb-4">{currentStory.caption}</p>
        </div>
      )}

      {/* Story Actions */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-4 text-white z-40">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <span className="text-sm">{currentStory.views}</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => handleReaction('like')}
        >
          <Heart className={`h-6 w-6 ${currentStory.reactions?.some(r => r.type === 'like') ? 'fill-white' : ''}`} />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <Share className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="absolute inset-0 flex z-30">
        <button
          className="flex-1 cursor-pointer"
          style={{ left: '0', width: '33.33%' }}
          onClick={prevStory}
        />
        <button
          className="flex-1 cursor-pointer"
          style={{ right: '0', width: '33.33%' }}
          onClick={nextStory}
        />
      </div>
    </div>
  );
}

interface StoryCircleProps {
  story: Story;
  isViewed: boolean;
  onClick: () => void;
}

export function StoryCircle({ story, isViewed, onClick }: StoryCircleProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-1 hover:opacity-80 transition-opacity"
    >
      <div className={`relative p-0.5 rounded-full ${isViewed ? 'bg-gray-400' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
        <Avatar className="w-16 h-16 border-2 border-background">
          <AvatarImage src={story.user.avatar_url} alt={story.user.username} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {story.user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="text-xs text-foreground truncate max-w-[60px]">
        {story.user.username}
      </span>
    </button>
  );
}