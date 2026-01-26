import { useState, useEffect } from 'react';
import { Users, Calendar, Settings, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  private: boolean;
  member_count: number;
  created_at: string;
  category: string;
  tags: string[];
  admin: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  membership?: {
    id: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: string;
  };
}

interface GroupsPanelProps {
  onCreateGroup?: () => void;
}

export default function GroupsPanel({ onCreateGroup }: GroupsPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Groups' },
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'creative', label: 'Creative' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    let filtered = groups;

    if (searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }

    setFilteredGroups(filtered);
  }, [groups, searchQuery, selectedCategory]);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          admin:profiles!groups_admin_id_fkey(id, username, avatar_url),
          membership:group_members(id, role, joined_at)
        `)
        .or(`private.eq.false, membership.user_id.eq.${user.id}`)
        .order('member_count', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      await supabase.rpc('increment_group_members', { group_id: groupId });

      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.rpc('decrement_group_members', { group_id: groupId });

      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Groups</h2>
        <Button onClick={onCreateGroup} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="group hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={group.avatar_url} alt={group.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      {group.member_count} members
                      {group.private && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {group.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {group.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {group.category}
                </span>
              </div>
              
              <div className="flex gap-2">
                {group.membership ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Group
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => leaveGroup(group.id)}
                    >
                      Leave
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                    size="sm"
                    onClick={() => joinGroup(group.id)}
                  >
                    Join Group
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters, or create a new group.
          </p>
          <Button onClick={onCreateGroup} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Create First Group
          </Button>
        </div>
      )}
    </div>
  );
}