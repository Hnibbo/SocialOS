import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  CheckCircle,
  Users,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Heart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Removed DashboardLayout import

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  created_at: string;
}

interface Reward {
  id: string;
  description: string | null;
  reward_value: number;
  reward_type: string;
  min_referrals: number;
  is_active: boolean;
}

export default function Referrals() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const referralLink = `${window.location.origin}/signup?ref=${user?.id?.slice(0, 8) || 'join'}`;

  const fetchData = async () => {
    if (!user) return;

    try {
      const [userResult, referralsResult, rewardsResult] = await Promise.all([
        supabase.from("users").select("referral_code").eq("id", user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("referral_rewards").select("*").eq("is_active", true).order("min_referrals", { ascending: true }),
      ]);

      setReferralCode(userResult.data?.referral_code || null);
      setReferrals(referralsResult.data || []);
      setRewards(rewardsResult.data || []);
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
    } finally {
      // Done fetching
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !referralCode || !user) return;

    setSending(true);
    try {
      const existing = referrals.find(r => r.referred_email === inviteEmail);
      if (existing) {
        toast.error("You've already invited this email");
        return;
      }

      const { error } = await supabase.from("referrals").insert({
        referrer_id: user.id,
        referred_email: inviteEmail,
        referral_code: referralCode,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Social invitation recorded!");
      setInviteEmail("");
      fetchData();
    } catch (error: unknown) {
      console.error("Error sending invite:", error);
      toast.error("Failed to record invite");
    } finally {
      setSending(false);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent("I'm using Hup to find real-world connections and local mixers. It's the future of social networking! Check it out:");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Join me on Hup - The Social App for Real Connections");
    const body = encodeURIComponent(`Hey!\n\nI've been using Hup to find local events and meet people with similar values. It's been a great way to expand my social circle.\n\nCheck it out here: ${referralLink}\n\nLet's connect there!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const stats = {
    total: referrals.length,
    signedUp: referrals.filter(r => r.status === "signed_up" || r.status === "converted").length,
    converted: referrals.filter(r => r.status === "converted").length,
  };

  return (
    <>

      <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">Invite your Circle</h1>
          <p className="text-muted-foreground">
            Invite your friends to Hup and earn exclusive rewards.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Social Invites", value: stats.total, color: "text-primary", icon: Users },
            { label: "Joined Network", value: stats.signedUp, color: "text-green-500", icon: CheckCircle },
            { label: "Premium Unlocks", value: stats.converted, color: "text-yellow-500", icon: Gift },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-gradient-card border-border/50 overflow-hidden relative group">
                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                  <stat.icon className="w-16 h-16" />
                </div>
                <CardContent className="p-6">
                  <p className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {rewards.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Social Rewards</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => {
                const progress = Math.min((stats.signedUp / reward.min_referrals) * 100, 100);
                const isClaimed = stats.signedUp >= reward.min_referrals;

                return (
                  <Card key={reward.id} className={`bg-gradient-card border-border/50 relative overflow-hidden ${isClaimed ? 'ring-2 ring-primary/20' : ''}`}>
                    {isClaimed && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/20 text-primary border-primary/20 pointer-events-none">Unlocked</Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-2xl ${isClaimed ? 'bg-primary' : 'bg-muted'} flex items-center justify-center mb-4 transition-colors`}>
                        <Gift className={`w-6 h-6 ${isClaimed ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{reward.description || "Social Reward"}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {reward.reward_value} {reward.reward_type === 'credits' ? 'Credits' : 'Month Pro'}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{stats.signedUp} / {reward.min_referrals} members</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Your Invitation Link
            </CardTitle>
            <CardDescription>
              Share this link with your friends to bring them into the Social App.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline" className="shrink-0">
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareOnTwitter} className="gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={shareOnLinkedIn} className="gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={shareViaEmail} className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Invite to Map
            </CardTitle>
            <CardDescription>
              Send a direct invitation to join your social network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@email.com"
              />
              <Button onClick={handleSendInvite} disabled={sending || !inviteEmail}>
                {sending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {referrals.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Social Circle History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {referrals.map((referral) => (
                  <div key={referral.id} className="py-3 flex items-center justify-between">
                    <span className="text-sm">{referral.referred_email}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${referral.status === "converted"
                      ? "bg-green-500/20 text-green-500"
                      : referral.status === "signed_up"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-muted text-muted-foreground"
                      }`}>
                      {referral.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>

  );
}
