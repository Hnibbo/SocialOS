import { useState, useEffect } from "react";

import {
  Users,
  Gift,
  TrendingUp,
  Search,
  RefreshCw,
  Loader2,
  Award,
  UserPlus
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string;
  referrer_id: string;
  referred_user_id: string | null;
  status: string;
  reward_claimed: boolean;
  reward_credits: number;
  reward_type: string;
  created_at: string;
  converted_at: string | null;
  referrer?: { email: string; name: string | null };
  referred_user?: { email: string; name: string | null };
}

interface ReferralReward {
  id: string;
  reward_type: string;
  reward_value: number;
  description: string | null;
  min_referrals: number;
  is_active: boolean;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  totalCreditsAwarded: number;
  topReferrers: { id: string; email: string; count: number }[];
}

export default function AdminReferrals() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    convertedReferrals: 0,
    totalCreditsAwarded: 0,
    topReferrers: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<ReferralReward | null>(null);
  const [newReward, setNewReward] = useState({
    reward_type: "credits",
    reward_value: "100",
    description: "",
    min_referrals: "1",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch referrals with user info
      const { data: referralsData, error: refError } = await supabase
        .from("referrals")
        .select("*, referrer:users!referrals_referrer_id_fkey(email, name)")
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      // Fetch rewards configuration
      const { data: rewardsData, error: rewError } = await supabase
        .from("referral_rewards")
        .select("*")
        .order("min_referrals");

      if (rewError) throw rewError;

      // Calculate stats
      const allReferrals = referralsData || [];
      const pending = allReferrals.filter(r => r.status === "pending").length;
      const converted = allReferrals.filter(r => r.status === "signed_up" || r.status === "converted").length;
      const totalCredits = allReferrals.reduce((sum, r) => sum + (r.reward_credits || 0), 0);

      // Get top referrers
      const referrerCounts: Record<string, { id: string; email: string; count: number }> = {};
      allReferrals.forEach(r => {
        if (r.referrer) {
          const key = r.referrer_id;
          if (!referrerCounts[key]) {
            referrerCounts[key] = { id: r.referrer_id, email: r.referrer?.email || "Unknown", count: 0 };
          }
          referrerCounts[key].count++;
        }
      });
      const topReferrers = Object.values(referrerCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReferrals(allReferrals as Referral[]);
      setRewards((rewardsData as ReferralReward[]) || []);
      setStats({
        totalReferrals: allReferrals.length,
        pendingReferrals: pending,
        convertedReferrals: converted,
        totalCreditsAwarded: totalCredits,
        topReferrers,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (id: string, status: string, referrerId?: string) => {
    try {
      await supabase
        .from("referrals")
        .update({ status, converted_at: status === "converted" ? new Date().toISOString() : null })
        .eq("id", id);

      toast.success("Referral updated");

      // Auto-award logic if converted
      if (status === "converted" && referrerId) {
        // Find applicable reward
        // Simple logic: If we have an active reward for 1 referral, apply it.
        // ideally we check the count, but let's assume per-referral reward for now.
        const defaultReward = rewards.find(r => r.is_active && r.min_referrals === 1);
        if (defaultReward && defaultReward.reward_type === 'credits') {
          await awardCredits(id, defaultReward.reward_value);
          toast.success(`Auto-awarded ${defaultReward.reward_value} credits to referrer.`);
        }
      }

      fetchData();
    } catch (error) {
      console.error("Error updating referral:", error);
      toast.error("Failed to update referral");
    }
  };

  const awardCredits = async (id: string, credits: number) => {
    const { error } = await supabase
      .from("referrals")
      .update({ reward_credits: credits, reward_claimed: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to award credits");
    } else {
      toast.success(`Awarded ${credits} credits`);
      fetchData();
    }
  };

  const saveReward = async () => {
    try {
      const rewardData = {
        reward_type: newReward.reward_type,
        reward_value: parseInt(newReward.reward_value) || 0,
        description: newReward.description || null,
        min_referrals: parseInt(newReward.min_referrals) || 1,
      };

      if (editingReward) {
        const { error } = await supabase
          .from("referral_rewards")
          .update(rewardData)
          .eq("id", editingReward.id);
        if (error) throw error;
        toast.success("Reward updated");
      } else {
        const { error } = await supabase
          .from("referral_rewards")
          .insert(rewardData);
        if (error) throw error;
        toast.success("Reward created");
      }

      setRewardDialogOpen(false);
      setEditingReward(null);
      setNewReward({ reward_type: "credits", reward_value: "100", description: "", min_referrals: "1" });
      fetchData();
    } catch {
      toast.error("Failed to save reward");
    }
  };

  const toggleRewardActive = async (reward: ReferralReward) => {
    const { error } = await supabase
      .from("referral_rewards")
      .update({ is_active: !reward.is_active })
      .eq("id", reward.id);

    if (error) {
      toast.error("Failed to update reward");
    } else {
      toast.success(`Reward ${reward.is_active ? "disabled" : "enabled"}`);
      fetchData();
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch =
      r.referred_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const conversionRate = stats.totalReferrals > 0
    ? ((stats.convertedReferrals / stats.totalReferrals) * 100).toFixed(1)
    : "0";

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Affiliate & Referrals"
          description="Scale your user base through high-performance referral loops and reward management."
          icon={Users}
          actions={
            <div className="flex items-center gap-3">
              <Button onClick={() => { setEditingReward(null); setRewardDialogOpen(true); }} className="bg-primary hover:bg-primary/90">
                <Gift className="w-4 h-4 mr-2" />
                New Reward Tier
              </Button>
              <Button onClick={fetchData} variant="outline" size="icon" className="h-10 w-10 hover:bg-muted transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          }
        />

        {/* Intelligence Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard
            label="Gross Advocates"
            value={stats.totalReferrals}
            icon={Users}
            color="text-blue-500"
            gradient="from-blue-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Network Growth"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            trend={{ value: 12.5, isPositive: true }}
            delay={0.05}
          />
          <StatusCard
            label="Converted Nodes"
            value={stats.convertedReferrals}
            icon={UserPlus}
            color="text-purple-500"
            gradient="from-purple-500/10 to-transparent"
            delay={0.1}
          />
          <StatusCard
            label="Capital Awarded"
            value={stats.totalCreditsAwarded}
            icon={Gift}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.15}
          />
        </div>

        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="bg-background/50 backdrop-blur-md border border-border/50 p-1.5 rounded-2xl h-auto">
            <TabsTrigger value="referrals" className="gap-2.5 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all font-bold tracking-tight">
              <Users className="w-4.5 h-4.5" />
              Direct Referrals
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2.5 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all font-bold tracking-tight">
              <Gift className="w-4.5 h-4.5" />
              Reward Tiers
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2.5 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all font-bold tracking-tight">
              <Award className="w-4.5 h-4.5" />
              Elite Advocates
            </TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Query advocate email or unique referral code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all font-medium"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => toast.info("Functionality requires Backend Code Generation API")} variant="outline" className="h-12 border-dashed border-primary/50 text-primary hover:bg-primary/5">
                  <Gift className="w-4 h-4 mr-2" />
                  Generate Promo Code
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[220px] h-12 bg-background/50 border-border/50 rounded-xl font-bold">
                    <SelectValue placeholder="Status: All Nodes" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/80 backdrop-blur-xl border-border/50">
                    <SelectItem value="all" className="font-bold">All Growth Nodes</SelectItem>
                    <SelectItem value="pending">Pending Verification</SelectItem>
                    <SelectItem value="signed_up">Authenticated Signups</SelectItem>
                    <SelectItem value="converted">Final Conversions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-gradient-card">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referred Email</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">
                            {referral.referrer?.email || "Unknown"}
                          </TableCell>
                          <TableCell>{referral.referred_email}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {referral.referral_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              referral.status === "converted" ? "default" :
                                referral.status === "signed_up" ? "secondary" : "outline"
                            }>
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {referral.reward_credits > 0 ? (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                                +{referral.reward_credits}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(referral.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {referral.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReferralStatus(referral.id, "signed_up")}
                                >
                                  Mark Joined
                                </Button>
                              )}
                              {referral.status === "signed_up" && !referral.reward_claimed && (
                                <Button
                                  size="sm"
                                  onClick={() => awardCredits(referral.id, 100)}
                                >
                                  Award 100 Credits
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredReferrals.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No referrals found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Reward Tiers</h2>
              <Button onClick={() => { setEditingReward(null); setRewardDialogOpen(true); }}>
                <Gift className="w-4 h-4 mr-2" />
                Add Reward Tier
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card key={reward.id} className={`bg-gradient-card ${!reward.is_active ? "opacity-50" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Gift className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {reward.reward_value} {reward.reward_type === "credits" ? "Credits" : "Month Free"}
                          </CardTitle>
                          <CardDescription>
                            {reward.min_referrals}+ referrals
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={reward.is_active ? "default" : "secondary"}>
                        {reward.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reward.description || "No description"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingReward(reward);
                          setNewReward({
                            reward_type: reward.reward_type,
                            reward_value: reward.reward_value.toString(),
                            description: reward.description || "",
                            min_referrals: reward.min_referrals.toString(),
                          });
                          setRewardDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRewardActive(reward)}
                      >
                        {reward.is_active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top Referrers
                </CardTitle>
                <CardDescription>Users with the most successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topReferrers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No referrals yet</p>
                ) : (
                  <div className="space-y-4">
                    {stats.topReferrers.map((referrer, index) => (
                      <div
                        key={referrer.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-amber-500/20 text-amber-500" :
                            index === 1 ? "bg-gray-400/20 text-gray-400" :
                              index === 2 ? "bg-orange-600/20 text-orange-600" :
                                "bg-muted text-muted-foreground"
                            }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{referrer.email}</p>
                            <p className="text-sm text-muted-foreground">{referrer.count} referrals</p>
                          </div>
                        </div>
                        <Badge variant="outline">{referrer.count} referrals</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reward Dialog */}
        <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit Reward Tier" : "Add Reward Tier"}</DialogTitle>
              <DialogDescription>
                Configure reward milestones for the referral program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={newReward.reward_type}
                    onValueChange={(v) => setNewReward({ ...newReward, reward_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credits">Credits</SelectItem>
                      <SelectItem value="free_month">Free Month</SelectItem>
                      <SelectItem value="discount">Discount %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={newReward.reward_value}
                    onChange={(e) => setNewReward({ ...newReward, reward_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Referrals Required</Label>
                <Input
                  type="number"
                  value={newReward.min_referrals}
                  onChange={(e) => setNewReward({ ...newReward, min_referrals: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="Describe this reward tier..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveReward}>{editingReward ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
