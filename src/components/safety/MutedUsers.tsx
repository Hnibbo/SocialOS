import { useState, useEffect } from 'react';
import { useSafety } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VolumeX, UserX, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MutedUser {
  id: string;
  muted_id: string;
  muted_at: string;
  reason?: string;
  profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function MutedUsers() {
  const { mutes, fetchMutes, unmuteUser, loading } = useSafety();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMutedUsers = async () => {
      setIsLoading(true);
      await fetchMutes();
      // Fetch user profiles for muted users
      if (mutes.length > 0) {
        const mutedIds = mutes.map(mute => mute.muted_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', mutedIds);

        const usersWithProfiles = mutes.map(mute => ({
          ...mute,
          profiles: profiles?.find(profile => profile.id === mute.muted_id)
        }));
        setMutedUsers(usersWithProfiles);
      } else {
        setMutedUsers([]);
      }
      setIsLoading(false);
    };

    loadMutedUsers();
  }, [fetchMutes, mutes]);

  const handleUnmute = async (mutedId: string) => {
    await unmuteUser(mutedId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (mutedUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <VolumeX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Muted Users</h3>
        <p className="text-muted-foreground">You haven't muted any users yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Muted Users</h3>
      <div className="space-y-3">
        {mutedUsers.map(mute => (
          <Card key={mute.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {mute.profiles?.avatar_url ? (
                    <img
                      src={mute.profiles.avatar_url}
                      alt={mute.profiles.display_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserX className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {mute.profiles?.display_name || mute.profiles?.username || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Muted on {new Date(mute.muted_at).toLocaleDateString()}
                  </p>
                  {mute.reason && (
                    <p className="text-sm text-muted-foreground mt-1">Reason: {mute.reason}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnmute(mute.muted_id)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Unmute
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
