import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Download,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  details: Record<string, unknown> | null;
  created_at: string;
  processed_at: string | null;
  download_url: string | null;
  user_email?: string;
}

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default function AdminGDPR() {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GDPRRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [dialogType, setDialogType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails
      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

      setRequests(
        (data || []).map((r) => ({
          ...r,
          user_email: userMap.get(r.user_id) || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching GDPR requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;

    setProcessing(true);
    try {
      // Process the request based on type
      if (selectedRequest.request_type === "export") {
        // Generate export data
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", selectedRequest.user_id)
          .single();

        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", selectedRequest.user_id);

        const { data: activities } = await supabase
          .from("activities")
          .select("*")
          .in("workspace_id", (workspaces || []).map((w) => w.id));

        const exportData = {
          user: userData,
          workspaces,
          activities,
          exported_at: new Date().toISOString(),
        };

        // In production, you'd upload this to storage and generate a signed URL
        const dataUrl = `data:application/json;base64,${btoa(JSON.stringify(exportData, null, 2))}`;

        await supabase
          .from("gdpr_requests")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            processed_by: currentUser.id,
            download_url: dataUrl,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .eq("id", selectedRequest.id);
      } else if (selectedRequest.request_type === "delete") {
        // Delete user data
        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", selectedRequest.user_id);

        // Delete activities
        if (workspaces?.length) {
          await supabase
            .from("activities")
            .delete()
            .in("workspace_id", workspaces.map((w) => w.id));

          await supabase
            .from("sessions")
            .delete()
            .in("workspace_id", workspaces.map((w) => w.id));
        }

        // Delete workspaces
        await supabase
          .from("workspaces")
          .delete()
          .eq("user_id", selectedRequest.user_id);

        // Anonymize user
        await supabase
          .from("users")
          .update({
            email: `deleted_${selectedRequest.user_id}@deleted.local`,
            name: "Deleted User",
            api_token: "deleted",
          })
          .eq("id", selectedRequest.user_id);

        await supabase
          .from("gdpr_requests")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            processed_by: currentUser.id,
          })
          .eq("id", selectedRequest.id);
      } else {
        // For other types, just mark as completed
        await supabase
          .from("gdpr_requests")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            processed_by: currentUser.id,
          })
          .eq("id", selectedRequest.id);
      }

      toast.success("Request processed successfully");
      setDialogType(null);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser) return;

    setProcessing(true);
    try {
      await supabase
        .from("gdpr_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          processed_by: currentUser.id,
          details: { ...selectedRequest.details, rejection_reason: rejectReason },
        })
        .eq("id", selectedRequest.id);

      toast.success("Request rejected");
      setDialogType(null);
      setSelectedRequest(null);
      setRejectReason("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "export":
        return <Download className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
      case "correction":
        return <Edit3 className="w-4 h-4" />;
      case "access":
        return <Eye className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="GDPR Requests"
          description="Process data access, export, correction, and deletion requests."
          icon={Shield}
        />

        {/* Pending Requests */}
        <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50" />
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto pr-2 -mr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Scanning for new requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">All Clear!</p>
                    <p className="text-sm text-muted-foreground">No pending GDPR requests require your attention.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                          {getTypeIcon(request.request_type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold capitalize">{request.request_type}</p>
                            <Badge variant="outline" className="text-[10px] uppercase h-4 px-1">{request.id.split('-')[0]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">{request.user_email}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            Submitted {format(new Date(request.created_at), "MMM d, HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-destructive/10 hover:text-destructive transition-colors px-4"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogType("reject");
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all px-6 border border-primary/20"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogType("approve");
                          }}
                        >
                          Process Request
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processed Requests */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto pr-2 -mr-2">
              {processedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No processed requests</p>
              ) : (
                <div className="divide-y divide-border">
                  {processedRequests.map((request) => (
                    <div key={request.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
                          {getTypeIcon(request.request_type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium capitalize truncate">{request.request_type} Request</p>
                          <p className="text-sm text-muted-foreground truncate">{request.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Processed {request.processed_at ? format(new Date(request.processed_at), "MMM d, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end sm:justify-start">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={dialogType === "approve"} onOpenChange={() => setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to process this {selectedRequest?.request_type} request for {selectedRequest?.user_email}?
                {selectedRequest?.request_type === "delete" && (
                  <span className="block mt-2 text-destructive">
                    Warning: This will permanently delete all user data.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={dialogType === "reject"} onOpenChange={() => setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
