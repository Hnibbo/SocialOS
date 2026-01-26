import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellRing, Check, CheckCheck, Trash2, UserPlus, CreditCard, AlertTriangle, MessageSquare, Shield, Gift, Plus, Send } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: "", content: "", type: "info" });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["admin-notifications", showUnreadOnly],
    queryFn: async () => {
      let query = supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (showUnreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AdminNotification[];
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          const newNotification = payload.new as AdminNotification;
          toast.info(newNotification.title, { description: newNotification.message });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification deleted");
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_user": return <UserPlus className="h-5 w-5 text-green-500" />;
      case "new_subscription": return <CreditCard className="h-5 w-5 text-blue-500" />;
      case "support_ticket": return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case "gdpr_request": return <Shield className="h-5 w-5 text-purple-500" />;
      case "giveaway_winner": return <Gift className="h-5 w-5 text-pink-500" />;
      case "alert": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BellRing className="h-8 w-8" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated on important platform events</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="unread-filter"
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              />
              <Label htmlFor="unread-filter">Unread only</Label>
            </div>
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
            <Button onClick={() => setSendDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : notifications?.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {notifications?.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${notification.is_read ? "bg-background" : "bg-primary/5 border-primary/20"
                            }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{notification.title}</p>
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markReadMutation.mutate(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">New User</p>
                    <p className="text-xs text-muted-foreground">When someone signs up</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Subscription</p>
                    <p className="text-xs text-muted-foreground">New or changed subscriptions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Support Ticket</p>
                    <p className="text-xs text-muted-foreground">New support requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">GDPR Request</p>
                    <p className="text-xs text-muted-foreground">Data export/deletion requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="font-medium">Giveaway Winner</p>
                    <p className="text-xs text-muted-foreground">When winners are selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Alert</p>
                    <p className="text-xs text-muted-foreground">Important system alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{notifications?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unread</span>
                  <span className="font-medium">{unreadCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Read</span>
                  <span className="font-medium">{(notifications?.length || 0) - unreadCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Global Announcement</DialogTitle>
            <DialogDescription>
              This will send a notification to ALL users and an optional email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={announcement.type}
                onValueChange={(val) => setAnnouncement({ ...announcement, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Success / New Feature</SelectItem>
                  <SelectItem value="warning">Maintenance / Warning</SelectItem>
                  <SelectItem value="alert">Critical Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="New Feature Released!"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="We've just launched something amazing..."
                rows={4}
                value={announcement.content}
                onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!announcement.title || !announcement.content) {
                  toast.error("Please fill in all fields");
                  return;
                }
                setSending(true);
                try {
                  const { error } = await supabase.functions.invoke('notify-users', {
                    body: {
                      title: announcement.title,
                      content: announcement.content,
                      type: announcement.type,
                      target: 'all'
                    }
                  });
                  if (error) throw error;
                  toast.success("Announcement sent successfully");
                  setSendDialogOpen(false);
                  setAnnouncement({ title: "", content: "", type: "info" });
                } catch (err) {
                  toast.error("Failed to send announcement");
                  console.error(err);
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending}
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send to All Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNotifications;
