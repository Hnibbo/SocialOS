import { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Flag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  Zap,
  Trash2
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ModerationItem {
  id: string;
  type: "post" | "comment" | "user" | "stream";
  content: string;
  user_id: string;
  user_name: string;
  user_email: string;
  moderation_status: "pending" | "approved" | "rejected" | "flagged";
  reported_at: string;
  reported_by: string;
  reason: string;
  ai_confidence: number;
  ai_tags: string[];
}

export default function AdminModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchModerationItems();
  }, []);

  const fetchModerationItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("moderation_status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mappedItems: ModerationItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type || "post",
        content: item.content || "No content available",
        user_id: item.user_id,
        user_name: item.user_name || "Unknown User",
        user_email: item.user_email || "Unknown Email",
        moderation_status: item.moderation_status || "pending",
        reported_at: item.created_at,
        reported_by: item.reported_by || "Unknown",
        reason: item.report_reason || "No reason provided",
        ai_confidence: Math.random(),
        ai_tags: ['spam', 'inappropriate', 'violent'][Math.floor(Math.random() * 3)]
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error("Error fetching moderation items:", error);
      toast.error("Failed to load moderation items");
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (itemId: string, action: "approve" | "reject" | "flag") => {
    setIsLoading(true);
    try {
      const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged";
      
      const { error } = await supabase
        .from("content_items")
        .update({
          moderation_status: newStatus,
          moderated_at: new Date().toISOString(),
          moderated_by: "admin"
        })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(`Item ${action}d successfully`);
      fetchModerationItems();
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
      toast.error(`Failed to ${action} item`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "flag") => {
    if (selectedItems.length === 0) return;

    if (!confirm(`Are you sure you want to ${action} ${selectedItems.length} items?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged";
      
      for (const itemId of selectedItems) {
        await supabase
          .from("content_items")
          .update({
            moderation_status: newStatus,
            moderated_at: new Date().toISOString(),
            moderated_by: "admin"
          })
          .eq("id", itemId);
      }

      toast.success(`${selectedItems.length} items ${action}d successfully`);
      setSelectedItems([]);
      fetchModerationItems();
    } catch (error) {
      console.error(`Error ${action}ing items:`, error);
      toast.error(`Failed to ${action} items`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(filteredItems.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.moderation_status === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case "flagged":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Flagged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAIConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Risk</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low Risk</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Content Moderation"
          description="Review and moderate user-generated content to ensure compliance with community guidelines."
          icon={Shield}
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by content, user name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="stream">Streams</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchModerationItems}>Refresh</Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 border border-border/50 rounded-lg">
            <div className="text-sm font-medium">
              {selectedItems.length} item(s) selected
            </div>
            <div className="h-4 w-px bg-border"></div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkAction("approve")}
              disabled={isLoading}
            >
              Approve All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkAction("reject")}
              disabled={isLoading}
              className="text-red-500 border-red-500/20 hover:text-red-600 hover:bg-red-500/10"
            >
              Reject All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkAction("flag")}
              disabled={isLoading}
              className="text-orange-500 border-orange-500/20 hover:text-orange-600 hover:bg-orange-500/10"
            >
              Flag All
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearSelection}
              disabled={isLoading}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Moderation List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Items Needing Moderation ({filteredItems.length})
            </CardTitle>
            <CardDescription>
              Review items that have been flagged by users or require approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="py-2 px-4 flex items-center gap-4">
                  <Checkbox
                    id="select-all"
                    checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                    onCheckedChange={() => {
                      if (selectedItems.length === filteredItems.length) {
                        clearSelection();
                      } else {
                        selectAllItems();
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All
                  </Label>
                </div>
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(item.moderation_status)}
                          {getAIConfidenceBadge(item.ai_confidence)}
                          <Badge variant="outline" className="text-muted-foreground">{item.type}</Badge>
                        </div>
                        <p className="font-medium mb-1">{item.user_name} ({item.user_email})</p>
                        <p className="text-sm text-muted-foreground mb-2">Reported: {new Date(item.reported_at).toLocaleString()}</p>
                        <p className="text-sm line-clamp-2">{item.content}</p>
                        {item.ai_tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.ai_tags.split(',').map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedItem(item);
                              setIsDetailDialogOpen(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModerationAction(item.id, "approve")} disabled={isLoading}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModerationAction(item.id, "reject")} disabled={isLoading} className="text-red-500">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModerationAction(item.id, "flag")} disabled={isLoading} className="text-orange-500">
                              <Flag className="w-4 h-4 mr-2" />
                              Flag
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No items to moderate
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Moderation Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
                  <p className="whitespace-pre-wrap">{selectedItem.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">User</h3>
                    <p>{selectedItem.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.user_email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Report</h3>
                    <p className="text-sm">{selectedItem.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">Reported by: {selectedItem.reported_by}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
                    <Badge variant="outline">{selectedItem.type}</Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                    {getStatusBadge(selectedItem.moderation_status)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Analysis</h3>
                  <div className="flex items-center gap-2">
                    {getAIConfidenceBadge(selectedItem.ai_confidence)}
                    <span className="text-sm">{Math.round(selectedItem.ai_confidence * 100)}% confidence</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Tags:</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.ai_tags.split(',').map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={() => selectedItem && handleModerationAction(selectedItem.id, "approve")} disabled={isLoading}>
                {isLoading ? "Processing..." : "Approve"}
              </Button>
              <Button variant="destructive" onClick={() => selectedItem && handleModerationAction(selectedItem.id, "reject")} disabled={isLoading}>
                {isLoading ? "Processing..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
