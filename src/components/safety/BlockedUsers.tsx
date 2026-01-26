import { useState, useEffect } from 'react';
import { useSafety } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, UserX, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_at: string;
  reason?: string;
  profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function BlockedUsers() {
  const { blocks, fetchBlocks, unblockUser, loading } = useSafety();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBlockedUsers = async () => {
      setIsLoading(true);
      await fetchBlocks();
      // Fetch user profiles for blocked users
      if (blocks.length > 0) {
        const blockedIds = blocks.map(block => block.blocked_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', blockedIds);

        const usersWithProfiles = blocks.map(block => ({
          ...block,
          profiles: profiles?.find(profile => profile.id === block.blocked_id)
        }));
        setBlockedUsers(usersWithProfiles);
      } else {
        setBlockedUsers([]);
      }
      setIsLoading(false);
    };

    loadBlockedUsers();
  }, [fetchBlocks, blocks]);

  const handleUnblock = async (blockedId: string) => {
    await unblockUser(blockedId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Blocked Users</h3>
        <p className="text-muted-foreground">You haven't blocked any users yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Blocked Users</h3>
      <div className="space-y-3">
        {blockedUsers.map(block => (
          <Card key={block.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {block.profiles?.avatar_url ? (
                    <img
                      src={block.profiles.avatar_url}
                      alt={block.profiles.display_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserX className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {block.profiles?.display_name || block.profiles?.username || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Blocked on {new Date(block.blocked_at).toLocaleDateString()}
                  </p>
                  {block.reason && (
                    <p className="text-sm text-muted-foreground mt-1">Reason: {block.reason}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(block.blocked_id)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Unblock
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
