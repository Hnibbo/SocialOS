import { useState, useEffect } from "react";

import {
  Download,
  Trash2,
  Bell,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Fingerprint,
  FileSearch,
  History
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,

  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Removed DashboardLayout import

import { toast } from "sonner";
import { format } from "date-fns";

interface ConsentRecord {
  id: string;
  consent_type: string;
  granted: boolean;
  created_at: string;
}

interface GDPRRequest {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  download_url: string | null;
  expires_at: string | null;
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [consentResult, requestResult] = await Promise.all([
        supabase
          .from("consent_records")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("gdpr_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      // Get latest consent for each type
      const latestConsents = new Map<string, ConsentRecord>();
      (consentResult.data || []).forEach((c) => {
        if (!latestConsents.has(c.consent_type)) {
          latestConsents.set(c.consent_type, c);
        }
      });
      setConsents(Array.from(latestConsents.values()));
      setRequests(requestResult.data || []);
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consentType: string, granted: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("consent_records").insert({
        user_id: user.id,
        consent_type: consentType,
        granted,
      });

      if (error) throw error;
      toast.success(`${consentType} consent ${granted ? "enabled" : "disabled"}`);
      fetchData();
    } catch (error: unknown) {
      console.error("Error updating consent:", error);
      toast.error("Failed to update consent");
    }
  };

  const getConsentValue = (type: string): boolean => {
    const consent = consents.find((c) => c.consent_type === type);
    return consent?.granted || false;
  };

  const handleRequestDataExport = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      // Check for existing pending request
      const existingPending = requests.find(
        (r) => r.request_type === "export" && r.status === "pending"
      );
      if (existingPending) {
        toast.error("You already have a pending export request");
        return;
      }

      const { error } = await supabase.from("gdpr_requests").insert({
        user_id: user.id,
        request_type: "export",
        status: "pending",
        details: { requested_at: new Date().toISOString() },
      });

      if (error) throw error;
      toast.success("Data export requested. You'll receive it within 24 hours.");
      fetchData();
    } catch (error: unknown) {
      console.error("Error requesting export:", error);
      toast.error("Failed to request data export");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmEmail !== user.email) {
      toast.error("Email doesn't match");
      return;
    }

    setActionLoading(true);
    try {
      // Create deletion request
      const { error } = await supabase.from("gdpr_requests").insert({
        user_id: user.id,
        request_type: "delete",
        status: "pending",
        details: {
          requested_at: new Date().toISOString(),
          confirmed_email: confirmEmail
        },
      });

      if (error) throw error;

      toast.success("Account deletion requested. Your account will be deleted within 30 days.");
      setDeleteDialogOpen(false);
      setConfirmEmail("");
      fetchData();
    } catch (error: unknown) {
      console.error("Error requesting deletion:", error);
      toast.error("Failed to request account deletion");
    } finally {
      setActionLoading(false);
    }
  };

  const consentTypes = [
    {
      type: "marketing",
      title: "Marketing Communications",
      description: "Receive product updates, tips, and promotional offers via email.",
    },
    {
      type: "analytics",
      title: "Analytics & Improvements",
      description: "Allow us to collect usage data to improve our services.",
    },
    {
      type: "third_party",
      title: "Third-Party Integrations",
      description: "Share data with trusted partners for enhanced features.",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">

      <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
        <AdminPageHeader
          title="Privacy Protocols"
          description="Manage your historical traces, data sovereignty, and pipeline consent records."
          icon={Fingerprint}
        />

        {/* Consent Preferences */}
        <div className="p-8 rounded-[2.5rem] glass-panel border-border/50 relative overflow-hidden group shadow-2xl shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
                <Bell className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Consent Gates</h3>
                <p className="text-sm text-muted-foreground">Regulate your digital authorization records.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {consentTypes.map((consent) => (
                <div
                  key={consent.type}
                  className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all group/item"
                >
                  <div className="space-y-1 pr-4">
                    <Label className="text-sm font-bold block mb-1">{consent.title}</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{consent.description}</p>
                  </div>
                  <Switch
                    checked={getConsentValue(consent.type)}
                    onCheckedChange={(checked) => handleConsentChange(consent.type, checked)}
                    disabled={loading}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="p-8 rounded-[2.5rem] glass-panel border-border/50 relative overflow-hidden group shadow-2xl shadow-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Historical Archive</h3>
                <p className="text-sm text-muted-foreground font-medium">Download your complete system interaction traces.</p>
              </div>
            </div>
            <Button
              onClick={handleRequestDataExport}
              disabled={actionLoading || requests.some(r => r.request_type === "export" && r.status === "pending")}
              className="h-14 rounded-2xl bg-foreground text-background font-black tracking-widest uppercase text-[10px] px-8 hover:opacity-90 transition-all shadow-xl"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-3" />
                  Initialize Export
                </>
              )}
            </Button>
          </div>

          {/* Previous exports */}
          {requests.filter(r => r.request_type === "export").length > 0 ? (
            <div className="space-y-4">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 pb-4 border-b border-border/20 mb-4 ml-1">Archive Synchronizations</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests
                  .filter(r => r.request_type === "export")
                  .slice(0, 6)
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-5 rounded-3xl bg-muted/20 border border-border/50 group/item hover:bg-muted/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${request.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          <FileSearch className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight">
                            {format(new Date(request.created_at), "MMM d, yyyy")}
                          </p>
                          {request.expires_at && request.status === "completed" && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Exp: {format(new Date(request.expires_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(request.status)}
                        {request.download_url && request.status === "completed" && (
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-background/80" asChild>
                            <a href={request.download_url} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[2rem] bg-muted/10 border border-border/30 border-dashed flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <FileSearch className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-bold text-muted-foreground italic">No historical archives generated.</p>
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div className="p-10 rounded-[2.5rem] bg-destructive/5 border border-destructive/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 blur-[120px] rounded-full -mr-32 -mt-32" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shadow-inner">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight text-destructive">Termination Protocol</h3>
                <p className="text-sm text-muted-foreground font-medium">Irreversible deletion of your entire digital presence.</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={requests.some(r => r.request_type === "delete" && r.status === "pending")}
            >
              {requests.some(r => r.request_type === "delete" && r.status === "pending")
                ? "Authorization Pending"
                : "Execute Purge"}
            </Button>
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-destructive/5 border border-destructive/10 relative z-10">
            <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest mb-4">
              <AlertTriangle className="w-4 h-4" />
              Critical Termination Warning
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">All autonomous workspace metadata and configurations will be atomized.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">System-wide interaction logs and historical traces will be purged.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">Your cryptographic API keys will be immediately decommissioned.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">Any connected neural nodes will lose operational synchronization.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-destructive/20 bg-background/95 backdrop-blur-2xl rounded-[2.5rem]">
            <div className="p-10 border-b border-destructive/10 bg-destructive/5">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-6 shadow-xl shadow-destructive/10">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-destructive mb-2 uppercase italic">Purge Confirmation</DialogTitle>
              <DialogDescription className="text-red-900/60 font-medium leading-relaxed italic">
                This operation is terminal. Type your registered electronic mail address to authorize account atomization.
              </DialogDescription>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity Verification Protocol</Label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] font-mono text-muted-foreground/80 mb-2">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {user?.email}
                </div>
                <Input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="AUTHORIZE TERMINATION"
                  className="h-14 rounded-2xl bg-background border-border/50 focus:border-destructive/40 transition-all font-mono text-center uppercase tracking-widest text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="ghost" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => setDeleteDialogOpen(false)}>
                  Abort
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-destructive/10"
                  onClick={handleDeleteAccount}
                  disabled={actionLoading || confirmEmail !== user?.email}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decommission"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

  );
}
