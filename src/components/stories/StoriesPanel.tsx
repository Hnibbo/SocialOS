import { useState, useEffect, useRef } from 'react';
import { Plus, X, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import StoryViewer, { StoryCircle } from './StoryViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  stories: Story[];
  isViewed: boolean;
}

export default function StoriesPanel() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [selectedStory, setSelectedStory] = useState<{ stories: Story[]; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:profiles(id, username, avatar_url)
        `)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .or(`user_id.eq.${user.id},user_id.in.(
          select following_id from follows 
          where follower_id = ${user.id} and status = 'active'
        )`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = data?.reduce((acc: StoryGroup[], story) => {
        const existingGroup = acc.find(g => g.user.id === story.user.id);
        const storyData = {
          id: story.id,
          media_url: story.media_url,
          media_type: story.media_type,
          caption: story.caption,
          created_at: story.created_at,
          expires_at: story.expires_at,
          views: story.views,
          user: story.user
        };

        if (existingGroup) {
          existingGroup.stories.push(storyData);
        } else {
          acc.push({
            user: story.user,
            stories: [storyData],
            isViewed: false
        };
        if (existingGroup) {
          existingGroup.stories.push(storyData);
        } else {
          acc.push({
            user: story.user,
            stories: [storyData],
            isViewed: false
          });
        }
        return acc;
      }, []) || [];

      const sorted = grouped.sort((a, b) => {
        const aIsUser = a.user.id === user.id;
        const bIsUser = b.user.id === user.id;
        if (aIsUser && !bIsUser) return -1;
        if (!aIsUser && bIsUser) return 1;
        return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
      });

      setStoryGroups(sorted);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a story");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: file.type.startsWith('video') ? 'video' : 'image',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          active: true
        });

      if (dbError) throw dbError;

      toast.success("Story shared with the world!");
      fetchStories();
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast.error(error.message || "Failed to share story");
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedStory) {
    return (
      <StoryViewer
        stories={selectedStory.stories}
        initialIndex={selectedStory.index}
        onClose={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stories</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <div className="text-center py-6">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">Create Story</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Share a moment that disappears after 24 hours
              </p>
              <div className="flex gap-2 justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleCreateStory}
                />
                <Button onClick={triggerFileUpload} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={triggerFileUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : storyGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No stories yet</p>
            <p className="text-sm">Create your first story to see it here</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {storyGroups.map((group, groupIndex) => (
              <div key={group.user.id} className="flex flex-col items-center gap-1">
                {group.stories.map((story, storyIndex) => (
                  <StoryCircle
                    key={story.id}
                    story={story}
                    isViewed={group.isViewed}
                    onClick={() => setSelectedStory({ 
                      stories: group.stories, 
                      index: storyIndex 
                    })}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}