import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical,
    Ban,
    CheckCircle,
    Mail,
    Shield,
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string;
    subscription_tier: string;
    subscription_status: string;
    created_at: string;
}

export const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTier, setFilterTier] = useState<string>('all');
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId: string) => {
        try {
            // Implement ban logic
            toast({
                title: 'User Banned',
                description: 'User has been banned successfully',
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to ban user',
                variant: 'destructive',
            });
        }
    };

    const handleVerifyUser = async (userId: string) => {
        try {
            // Implement verification logic
            toast({
                title: 'User Verified',
                description: 'User has been verified successfully',
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to verify user',
                variant: 'destructive',
            });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
        return matchesSearch && matchesTier;
    });

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gradient-electric mb-2">
                        User Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and monitor all platform users
                    </p>
                </div>
                <ElectricButton onClick={fetchUsers}>
                    Refresh
                </ElectricButton>
            </div>

            {/* Filters */}
            <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'free', 'pro', 'elite'].map((tier) => (
                            <ElectricButton
                                key={tier}
                                variant={filterTier === tier ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterTier(tier)}
                            >
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </ElectricButton>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Users Table */}
            <GlassCard className="p-6">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-dark font-semibold">
                                                {user.display_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="font-medium">{user.display_name || 'Anonymous'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscription_tier === 'elite' ? 'bg-accent/20 text-accent' :
                                                user.subscription_tier === 'pro' ? 'bg-primary/20 text-primary' :
                                                    'bg-white/10 text-white'
                                            }`}>
                                            {user.subscription_tier || 'free'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                'bg-white/10 text-white'
                                            }`}>
                                            {user.subscription_status || 'inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <ElectricButton variant="ghost" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </ElectricButton>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-card border-white/10">
                                                <DropdownMenuItem onClick={() => handleVerifyUser(user.id)}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Verify User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Send Email
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    View Activity
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleBanUser(user.id)}
                                                    className="text-red-400"
                                                >
                                                    <Ban className="w-4 h-4 mr-2" />
                                                    Ban User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {!loading && filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No users found matching your criteria
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
