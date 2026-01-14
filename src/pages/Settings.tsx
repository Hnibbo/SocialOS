import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Key,
  Shield,
  Loader2,
  Save,
  Copy,
  CheckCircle,
  RefreshCw,
  Lock,
  Settings2,
  Fingerprint,
  Bell,
  Smartphone,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
// Removed DashboardLayout import

import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function Settings() {
  const { user, updatePassword, apiToken, refreshApiToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Push Notifications
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unregisterPushToken,
    sendTestNotification
  } = usePushNotifications();

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Social OS Profile state
  const [intentSignal, setIntentSignal] = useState("quiet");
  const [visibilityMatrix, setVisibilityMatrix] = useState({
    map: true,
    swipe: true,
    dating: true,
    nearby_chat: true
  });

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setEmail(user.email || "");

      // Fetch extended profile data
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("intent_signal, visibility_matrix")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          setIntentSignal(data.intent_signal || "quiet");
          setVisibilityMatrix(data.visibility_matrix || {
            map: true,
            swipe: true,
            dating: true,
            nearby_chat: true
          });
        }
      };

      fetchProfile();
    }
  }, [user]);

  // apiToken is handled by AuthContext

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          intent_signal: intentSignal,
          visibility_matrix: visibilityMatrix
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      toast.success("Identity profile updated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyApiToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken);
      setCopied(true);
      toast.success("API token copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGDPRRequest = async (type: 'export' | 'delete') => {
    if (!user) return;

    if (!confirm(type === 'delete'
      ? "Are you sure? This will request permanent account deletion."
      : "Request a data export? You will be notified when it is ready.")) return;

    try {
      const { error } = await supabase
        .from("gdpr_requests")
        .insert({
          user_id: user.id,
          request_type: type,
          status: 'pending'
        });

      if (error) throw error;
      toast.success(`${type === 'export' ? 'Export' : 'Deletion'} request submitted`);
    } catch (error) {
      toast.error("Failed to submit request");
      console.error(error);
    }
  };

  const regenerateToken = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("regenerate_api_token", {
        user_uuid: user.id,
      });

      if (error) throw error;

      await refreshApiToken();
      toast.success("API token regenerated!");
    } catch (error: unknown) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate token");
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      await requestPermission();
    } else {
      await unregisterPushToken();
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">

      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <AdminPageHeader
          title="Identity Control"
          description="Manage your cryptographic keys, digital footprint, and notification protocols."
          icon={Fingerprint}
        />

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted/30 p-1.5 rounded-[1.25rem] mb-8 gap-2 border border-border/50 backdrop-blur-xl flex-wrap h-auto">
              <TabsTrigger value="profile" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <User className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Identity</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <Bell className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Security</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <Key className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Interface</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <Lock className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <CreditCard className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="creator" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
                <DollarSign className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Creator</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Identity Profile</h3>
                      <p className="text-sm text-muted-foreground">Modify your public identifiers.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-md">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Intent Signal</Label>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { id: 'quiet', icon: '🤫', label: 'Quiet' },
                          { id: 'chat', icon: '💬', label: 'Chat' },
                          { id: 'hang', icon: '👥', label: 'Hang' },
                          { id: 'date', icon: '❤️', label: 'Date' },
                          { id: 'party', icon: '🥳', label: 'Party' }
                        ].map((intent) => (
                          <button
                            key={intent.id}
                            type="button"
                            onClick={() => setIntentSignal(intent.id)}
                            className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${intentSignal === intent.id
                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                                : 'bg-background/50 border-border/50 hover:bg-muted/30'
                              }`}
                          >
                            <span className="text-2xl">{intent.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">{intent.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 py-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Visibility Matrix</Label>
                      <div className="space-y-4">
                        {[
                          { id: 'map', label: 'World Map Presence', desc: 'Appear as an avatar to nearby users.' },
                          { id: 'swipe', label: 'Swipe Stack', desc: 'Show up in the proximity swipe feed.' },
                          { id: 'dating', label: 'Dating Feed', desc: 'Enable dating-specific visibility.' },
                          { id: 'nearby_chat', label: 'Nearby Random Chat', desc: 'Allow people nearby to start random chats.' }
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold">{item.label}</h4>
                              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                            </div>
                            <Switch
                              checked={(visibilityMatrix as any)[item.id]}
                              onCheckedChange={(checked) => setVisibilityMatrix(prev => ({ ...prev, [item.id]: checked }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Pipeline</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="h-12 rounded-xl bg-muted/30 border-border/30 text-muted-foreground font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground/60 font-medium ml-1">
                        Electronic mail address cannot be mutated.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-primary text-white font-bold tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Update Identity
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">Stay updated with real-time alerts.</p>
                  </div>
                </div>

                <div className="space-y-8 max-w-2xl">
                  {!isSupported ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
                      <Smartphone className="w-5 h-5" />
                      <p className="font-medium text-sm">Push notifications are not supported in this browser.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/10 border border-border/50">
                        <div className="space-y-1">
                          <h4 className="font-bold flex items-center gap-2">
                            Enable Push Notifications
                            {permission === 'granted' && subscription && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-[10px] uppercase font-black tracking-wider">Active</span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">Receive alerts for new messages, matches, and activity.</p>
                        </div>
                        <Switch
                          checked={permission === 'granted' && !!subscription}
                          onCheckedChange={toggleNotifications}
                        />
                      </div>

                      {permission === 'granted' && subscription && (
                        <div className="flex items-center gap-4">
                          <Button variant="outline" onClick={sendTestNotification} className="gap-2">
                            <Bell className="w-4 h-4" />
                            Send Test Notification
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Sends a local notification to test your device settings.
                          </p>
                        </div>
                      )}

                      {permission === 'denied' && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                          <p className="font-bold">Notifications Blocked</p>
                          <p className="opacity-80">You have blocked notifications for this site. Please check your browser settings to enable them.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Access Protocol</h3>
                    <p className="text-sm text-muted-foreground">Rotate your account master key.</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Passphrase</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-all font-mono"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Passphrase</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-all font-mono"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-foreground text-background font-bold tracking-tight hover:opacity-90 transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shield className="mr-2 w-4 h-4" />
                        Update Protocol
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2.5rem] glass-card border-border/50 space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <Settings2 className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Data Sovereignty</h3>
                      <p className="text-sm text-muted-foreground">Manage your information footprint.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 group/item hover:bg-muted/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold">Historical Export</h4>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => handleGDPRRequest('export')}>
                          Request File
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Download a comprehensive archive of your autonomous traces and account metadata.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 group/item hover:bg-destructive/10 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-destructive">Termination Protocol</h4>
                        <Button variant="destructive" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => handleGDPRRequest('delete')}>
                          Execute
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Permanently purge your digital existence from our repositories. This action is terminal.</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] glass-card border-border/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Consent Gates</h3>
                      <p className="text-sm text-muted-foreground">Toggle pipeline integrations.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <Label className="font-bold">Telemetry Communications</Label>
                        <p className="text-[11px] text-muted-foreground font-medium">Product updates and technical bulletins.</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={() => toast.success("Communications updated")} />
                    </div>
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <Label className="font-bold">Analytical Traversal</Label>
                        <p className="text-[11px] text-muted-foreground font-medium">Anonymous usage patterns for optimization.</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={() => toast.success("Optimization updated")} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Key className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Interface Credentials</h3>
                    <p className="text-sm text-muted-foreground">Cryptographic tokens for external integration.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-8 rounded-3xl bg-muted/20 border border-border/50 relative group/token overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/token:opacity-100 transition-opacity" />
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block ml-1">Active Authentication Token</Label>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="flex-1 px-5 py-4 rounded-2xl bg-background/50 border border-border/50 font-mono text-sm truncate shadow-inner">
                        {apiToken || "•".repeat(32)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-2xl border-border/50 bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                        onClick={copyApiToken}
                        disabled={!apiToken}
                      >
                        {copied ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="mt-4 text-[11px] text-muted-foreground/60 font-medium ml-1">
                      This token provides administrative access to your infrastructure via the CLI and REST gateways.
                    </p>
                  </div>

                  <div className="p-8 rounded-3xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h4 className="font-bold text-destructive flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Regeneration Pipeline
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                          Executing this will invalidate the current token across all deployments. Update your environments immediately after.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-destructive/10"
                        onClick={regenerateToken}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Regenerate Key"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-black tracking-tight mb-2">Billing & Subscription</h3>
                  <p className="text-muted-foreground mb-6">Manage your node capacity, payment methods, and historical invoices.</p>
                  <Link to="/dashboard/billing">
                    <Button className="h-14 px-8 rounded-2xl font-bold gap-2">
                      Open Billing Terminal
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>

            {/* Creator Tab */}
            <TabsContent value="creator" className="mt-0">
              <div className="p-8 rounded-[2.5rem] glass-card border-border/50 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-black tracking-tight mb-2">Creator Portal</h3>
                  <p className="text-muted-foreground mb-6">Monetize your network influence and receive secure cryptographic payouts.</p>
                  <Link to="/dashboard/creator">
                    <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold gap-2">
                      Launch Creator Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>

  );
}
