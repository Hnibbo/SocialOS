import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import {
    Bell,
    X,
    Heart,
    MessageSquare,
    UserPlus,
    Zap,
    Eye,
    Share2,
    CheckCircle2,
    Filter,
    Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
    id: string;
    user_id: string;
    type: string;
    content: string;
    related_id?: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        id: string;
        display_name: string;
        avatar_url: string;
    };
}

const notificationIcons: Record<string, React.ReactNode> = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageSquare className="w-4 h-4 text-primary" />,
    follow: <UserPlus className="w-4 h-4 text-green-500" />,
    mention: <Zap className="w-4 h-4 text-yellow-400" />,
    message: <MessageSquare className="w-4 h-4 text-blue-500" />,
    share: <Share2 className="w-4 h-4 text-purple-500" />,
    view: <Eye className="w-4 h-4 text-gray-400" />
};

const notificationColors: Record<string, string> = {
    like: 'text-red-500 border-red-500/20 bg-red-500/10',
    comment: 'text-primary border-primary/20 bg-primary/10',
    follow: 'text-green-500 border-green-500/20 bg-green-500/10',
    mention: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
    message: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
    share: 'text-purple-500 border-purple-500/20 bg-purple-500/10',
    view: 'text-gray-400 border-gray-400/20 bg-gray-400/10'
};

export const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    
    const { user } = useAuth();
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && isOpen) {
            fetchNotifications();
        }
    }, [user, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    // Add sender data if available (we'd need to fetch this separately or include in the payload)
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    // Show toast notification
                    toast({
                        title: getNotificationText(newNotification),
                        description: new Date(newNotification.created_at).toLocaleTimeString(),
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    id,
                    user_id,
                    type,
                    content,
                    related_id,
                    is_read,
                    created_at,
                    sender:user_profiles!notifications_sender_id_fkey(id, display_name, avatar_url)
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user?.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Handle notification click actions
        switch (notification.type) {
            case 'message':
                window.location.href = '/messages';
                break;
            case 'like':
            case 'comment':
            case 'share':
                if (notification.related_id) {
                    window.location.href = `/post/${notification.related_id}`;
                }
                break;
            case 'follow':
                if (notification.sender?.id) {
                    window.location.href = `/profile/${notification.sender.id}`;
                }
                break;
            default:
                break;
        }
    };

    const getNotificationText = (notification: Notification) => {
        switch (notification.type) {
            case 'like':
                return `${notification.sender?.display_name || 'Someone'} liked your post`;
            case 'comment':
                return `${notification.sender?.display_name || 'Someone'} commented on your post`;
            case 'follow':
                return `${notification.sender?.display_name || 'Someone'} started following you`;
            case 'mention':
                return `${notification.sender?.display_name || 'Someone'} mentioned you`;
            case 'message':
                return `${notification.sender?.display_name || 'Someone'} sent you a message`;
            case 'share':
                return `${notification.sender?.display_name || 'Someone'} shared your post`;
            case 'view':
                return `Your post was viewed ${notification.content} times`;
            default:
                return notification.content;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-end p-4 md:p-8">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Notification Panel */}
            <div 
                ref={notificationRef}
                className="relative w-full max-w-md animate-in slide-in-from-right-10 duration-300"
            >
                <GlassCard className="p-0 overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" /> Notifications
                            {unreadCount > 0 && (
                                <span className="px-2 py-1 bg-primary text-dark rounded-full text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </h3>
                        <div className="flex gap-2">
                            {/* Filter */}
                            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                                <ElectricButton
                                    variant={filter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilter('all')}
                                    className="text-xs font-bold px-3"
                                >
                                    All
                                </ElectricButton>
                                <ElectricButton
                                    variant={filter === 'unread' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilter('unread')}
                                    className="text-xs font-bold px-3"
                                >
                                    Unread
                                </ElectricButton>
                            </div>

                            {unreadCount > 0 && (
                                <ElectricButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold"
                                >
                                    Mark All Read
                                </ElectricButton>
                            )}
                            <ElectricButton
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4" />
                            </ElectricButton>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading...</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            (filter === 'all' ? notifications : notifications.filter(n => !n.is_read)).map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5 group",
                                        notification.is_read 
                                            ? "border-white/5 opacity-60" 
                                            : "border-primary/20 bg-primary/5 opacity-100"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            notificationColors[notification.type] || "border-white/10 bg-white/5"
                                        )}>
                                            {notification.sender?.avatar_url ? (
                                                <img 
                                                    src={notification.sender.avatar_url} 
                                                    className="w-full h-full rounded-full object-cover"
                                                    alt={notification.sender.display_name}
                                                />
                                            ) : (
                                                notificationIcons[notification.type] || <Bell className="w-5 h-5" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-relaxed">
                                                <span className="font-bold text-white">
                                                    {getNotificationText(notification)}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(notification.created_at).toLocaleDateString([], { 
                                                    month: 'short', 
                                                    day: 'numeric', 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 mx-auto text-primary opacity-20 mb-4" />
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    No Notifications
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    You're all caught up! Check back later for updates.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-black/40 border-t border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
