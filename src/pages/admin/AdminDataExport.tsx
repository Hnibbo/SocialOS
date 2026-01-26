import { useState, useEffect } from "react";

import {
  Download,
  Users,
  BarChart3,
  FileText,
  Shield,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface ConsentStats {
  type: string;
  granted: number;
  denied: number;
  total: number;
}

export default function AdminDataExport() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [consentStats, setConsentStats] = useState<ConsentStats[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [consentedUserCount, setConsentedUserCount] = useState(0);

  // Notification form
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [sendToConsented, setSendToConsented] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSlack, setSendSlack] = useState(false);
  const [sendDiscord, setSendDiscord] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      setUserCount(totalUsers || 0);

      // Get consent statistics
      const { data: consents } = await supabase
        .from("consent_records")
        .select("consent_type, granted");

      // Process consent stats
      const statsMap: Record<string, { granted: number; denied: number }> = {};
      (consents || []).forEach(c => {
        if (!statsMap[c.consent_type]) {
          statsMap[c.consent_type] = { granted: 0, denied: 0 };
        }
        if (c.granted) {
          statsMap[c.consent_type].granted++;
        } else {
          statsMap[c.consent_type].denied++;
        }
      });

      const stats = Object.entries(statsMap).map(([type, data]) => ({
        type,
        granted: data.granted,
        denied: data.denied,
        total: data.granted + data.denied,
      }));
      setConsentStats(stats);

      // Count users with marketing consent
      const { count: marketingConsent } = await supabase
        .from("consent_records")
        .select("*", { count: "exact", head: true })
        .eq("consent_type", "marketing")
        .eq("granted", true);
      setConsentedUserCount(marketingConsent || 0);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    setExporting(true);
    try {
      let data: Record<string, unknown>[] = [];
      let filename = "";

      switch (type) {
        case "users": {
          const { data: users } = await supabase
            .from("users")
            .select("id, email, name, referral_code, created_at");
          data = (users as unknown as Record<string, unknown>[]) || [];
          filename = "users_export.json";
          break;
        }
        case "consents": {
          const { data: consents } = await supabase
            .from("consent_records")
            .select("*, users(email)");
          data = (consents as unknown as Record<string, unknown>[]) || [];
          filename = "consent_records.json";
          break;
        }
        case "analytics": {
          const { data: activities } = await supabase
            .from("activities")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10000);
          data = (activities as unknown as Record<string, unknown>[]) || [];
          filename = "analytics_export.json";
          break;
        }
        case "referrals": {
          const { data: referrals } = await supabase
            .from("referrals")
            .select("*, users!referrals_referrer_id_fkey(email)");
          data = (referrals as unknown as Record<string, unknown>[]) || [];
          filename = "referrals_export.json";
          break;
        }
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} records`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationSubject || !notificationContent) {
      toast.error("Subject and content are required");
      return;
    }

    setSending(true);
    try {
      await supabase.auth.getSession();

      const response = await supabase.functions.invoke("notify-users", {
        body: {
          title: notificationSubject,
          content: notificationContent,
          target: sendToConsented ? "consented" : "all",
          send_email: sendEmail,
          send_slack: sendSlack,
          send_discord: sendDiscord,
        },
      });

      if (response.error) throw response.error;

      toast.success(`Notification sent to ${response.data.targetCount} users`);
      setNotificationSubject("");
      setNotificationContent("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send notification";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const getConsentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      marketing: "Marketing Communications",
      analytics: "Analytics & Improvements",
      third_party: "Third-Party Integrations",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Data & Sovereignity"
          description="Orchestrate user data portability, consent lifecycles, and system-wide notifications."
          icon={Database}
          actions={
            <Button variant="outline" onClick={fetchData} className="border-border/50 hover:bg-muted/50 rounded-xl">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Vitals
            </Button>
          }
        />

        {/* Governance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            label="Total Data Nodes"
            value={userCount}
            icon={Users}
            color="text-blue-500"
            gradient="from-blue-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Consented Vectors"
            value={consentedUserCount}
            icon={Shield}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            trend={{ value: Math.round((consentedUserCount / userCount) * 100), isPositive: true }}
            delay={0.05}
          />
          <StatusCard
            label="Consent Protocol"
            value={consentStats.length}
            icon={Lock}
            color="text-purple-500"
            gradient="from-purple-500/10 to-transparent"
            delay={0.1}
          />
          <StatusCard
            label="GDPR Integrity"
            value="100%"
            icon={CheckCircle2}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.15}
          />
        </div>


        <Tabs defaultValue="consents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="consents" className="gap-2">
              <Shield className="w-4 h-4" />
              Consent Analytics
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Data Export
            </TabsTrigger>
            <TabsTrigger value="notify" className="gap-2">
              <Send className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consents" className="space-y-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Consent Statistics</CardTitle>
                <CardDescription>
                  Overview of user consent preferences across different data categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {consentStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No consent records yet.</p>
                ) : (
                  consentStats.map((stat) => (
                    <div key={stat.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getConsentTypeLabel(stat.type)}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-success">{stat.granted} granted</span>
                          <span className="text-destructive">{stat.denied} denied</span>
                        </div>
                      </div>
                      <Progress
                        value={stat.total > 0 ? (stat.granted / stat.total) * 100 : 0}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {stat.total > 0 ? Math.round((stat.granted / stat.total) * 100) : 0}% consent rate
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Download data for analysis, reporting, or compliance purposes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => exportData("users")}
                    disabled={exporting}
                  >
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">User Data</p>
                      <p className="text-xs text-muted-foreground">Emails, names, referral codes</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => exportData("consents")}
                    disabled={exporting}
                  >
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Consent Records</p>
                      <p className="text-xs text-muted-foreground">All consent preferences</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => exportData("analytics")}
                    disabled={exporting}
                  >
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Analytics Data</p>
                      <p className="text-xs text-muted-foreground">Activity logs, usage data</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => exportData("referrals")}
                    disabled={exporting}
                  >
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Referral Data</p>
                      <p className="text-xs text-muted-foreground">Referral codes, conversions</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Legal Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exported data is subject to GDPR, CCPA, and other applicable privacy regulations.
                  Ensure you have appropriate legal basis before sharing or selling user data.
                  Users who have not consented to third-party sharing should be excluded from any
                  data monetization activities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>
                  Notify users about policy changes, new features, or important updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={notificationSubject}
                    onChange={(e) => setNotificationSubject(e.target.value)}
                    placeholder="Important Update to Our Terms of Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={notificationContent}
                    onChange={(e) => setNotificationContent(e.target.value)}
                    placeholder="We've updated our terms of service. Please visit our website to review the changes..."
                    rows={5}
                  />
                </div>
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Target Audience</p>
                      <p className="text-sm text-muted-foreground">
                        {sendToConsented ? `Only consented users (${consentedUserCount})` : `All users (${userCount})`}
                      </p>
                    </div>
                    <Switch
                      checked={sendToConsented}
                      onCheckedChange={setSendToConsented}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send via Email</p>
                    </div>
                    <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send to Slack</p>
                    </div>
                    <Switch checked={sendSlack} onCheckedChange={setSendSlack} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send to Discord</p>
                    </div>
                    <Switch checked={sendDiscord} onCheckedChange={setSendDiscord} />
                  </div>
                </div>
                <Button
                  onClick={sendNotification}
                  disabled={sending || (!sendEmail && !sendSlack && !sendDiscord)}
                  className="w-full"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
