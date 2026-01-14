import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift, Plus, Edit, Trash2, Star, Users, Trophy,
  Loader2, MoreHorizontal, Eye, ArrowUp, ArrowDown,
  Award
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Giveaway {
  id: string;
  name: string;
  description: string | null;
  giveaway_type: string;
  prize_type: string;
  prize_value: Record<string, unknown>;
  plan_id: string | null;
  max_winners: number;
  current_winners: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  image_url: string | null;
  entry_count: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
}

export default function AdminGiveaways() {
  const [loading, setLoading] = useState(true);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [saving, setSaving] = useState(false);
  const [entriesDialogOpen, setEntriesDialogOpen] = useState(false);
  const [selectedGiveawayId, setSelectedGiveawayId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    giveaway_type: "raffle",
    prize_type: "subscription",
    prize_value: { amount: 0, duration_months: 1 },
    plan_id: "",
    max_winners: 1,
    starts_at: "",
    ends_at: "",
    is_active: true,
    is_featured: false,
    sort_order: 0,
    image_url: "",
  });

  useEffect(() => {
    fetchGiveaways();
    fetchPlans();
  }, []);

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiveaways((data as Giveaway[]) || []);
    } catch (error) {
      console.error("Error fetching giveaways:", error);
      toast.error("Failed to load giveaways");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .eq("is_active", true);

      if (error) throw error;
      setPlans((data as Plan[]) || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchEntries = async (giveawayId: string) => {
    try {
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("*, users(email, name)")
        .eq("giveaway_id", giveawayId)
        .order("entered_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const openEditDialog = (giveaway?: Giveaway) => {
    if (giveaway) {
      setEditingGiveaway(giveaway);
      setFormData({
        name: giveaway.name,
        description: giveaway.description || "",
        giveaway_type: giveaway.giveaway_type,
        prize_type: giveaway.prize_type,
        prize_value: giveaway.prize_value,
        plan_id: giveaway.plan_id || "",
        max_winners: giveaway.max_winners || 1,
        starts_at: giveaway.starts_at ? giveaway.starts_at.slice(0, 16) : "",
        ends_at: giveaway.ends_at ? giveaway.ends_at.slice(0, 16) : "",
        is_active: giveaway.is_active,
        is_featured: giveaway.is_featured,
        sort_order: giveaway.sort_order,
        image_url: giveaway.image_url || "",
      });
    } else {
      setEditingGiveaway(null);
      setFormData({
        name: "",
        description: "",
        giveaway_type: "raffle",
        prize_type: "subscription",
        prize_value: { amount: 0, duration_months: 1 },
        plan_id: "",
        max_winners: 1,
        starts_at: "",
        ends_at: "",
        is_active: true,
        is_featured: false,
        sort_order: 0,
        image_url: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const giveawayData = {
        name: formData.name,
        description: formData.description || null,
        giveaway_type: formData.giveaway_type,
        prize_type: formData.prize_type,
        prize_value: formData.prize_value,
        plan_id: formData.plan_id || null,
        max_winners: formData.max_winners,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        sort_order: formData.sort_order,
        image_url: formData.image_url || null,
      };

      if (editingGiveaway) {
        const { error } = await supabase
          .from("giveaways")
          .update(giveawayData)
          .eq("id", editingGiveaway.id);

        if (error) throw error;
        toast.success("Giveaway updated");
      } else {
        const { error } = await supabase
          .from("giveaways")
          .insert(giveawayData);

        if (error) throw error;
        toast.success("Giveaway created");
      }

      setDialogOpen(false);
      fetchGiveaways();
      setDialogOpen(false);
      fetchGiveaways();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save giveaway";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this giveaway?")) return;

    try {
      const { error } = await supabase
        .from("giveaways")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Giveaway deleted");
      fetchGiveaways();
      toast.success("Giveaway deleted");
      fetchGiveaways();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete giveaway";
      toast.error(message);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("giveaways")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      fetchGiveaways();
    } catch {
      toast.error("Failed to update giveaway");
    }
  };

  const toggleFeatured = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("giveaways")
        .update({ is_featured: !currentState })
        .eq("id", id);

      if (error) throw error;
      fetchGiveaways();
    } catch {
      toast.error("Failed to update giveaway");
    }
  };

  const updateSortOrder = async (id: string, direction: "up" | "down") => {
    const giveaway = giveaways.find(g => g.id === id);
    if (!giveaway) return;

    const newOrder = direction === "up" ? giveaway.sort_order - 1 : giveaway.sort_order + 1;

    try {
      const { error } = await supabase
        .from("giveaways")
        .update({ sort_order: newOrder })
        .eq("id", id);

      if (error) throw error;
      fetchGiveaways();
    } catch {
      toast.error("Failed to update order");
    }
  };

  const viewEntries = (giveawayId: string) => {
    setSelectedGiveawayId(giveawayId);
    fetchEntries(giveawayId);
    setEntriesDialogOpen(true);
  };

  const pickWinner = async () => {
    if (!selectedGiveawayId || entries.length === 0) return;

    const eligibleEntries = entries.filter(e => !e.is_winner);
    if (eligibleEntries.length === 0) {
      toast.error("No eligible entries remaining");
      return;
    }

    const randomEntry = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];

    try {
      const { error } = await supabase
        .from("giveaway_entries")
        .update({ is_winner: true, won_at: new Date().toISOString() })
        .eq("id", randomEntry.id);

      if (error) throw error;

      // Update winner count
      const giveaway = giveaways.find(g => g.id === selectedGiveawayId);
      if (giveaway) {
        await supabase
          .from("giveaways")
          .update({ current_winners: (giveaway.current_winners || 0) + 1 })
          .eq("id", selectedGiveawayId);

        // Send notification email
        try {
          await supabase.functions.invoke("send-giveaway-winner-email", {
            body: {
              winnerEmail: randomEntry.users?.email,
              winnerName: randomEntry.users?.name || "Winner",
              giveawayName: giveaway.name,
              prizeDisplay: giveaway.prize_type === "subscription" ? "Premium Subscription" : giveaway.prize_type,
            }
          });
          toast.success("Notification email sent to winner!");
        } catch (emailError) {
          console.error("Failed to send winner email:", emailError);
          toast.error("Winner picked, but failed to send email notification.");
        }
      }

      toast.success(`Winner selected: ${randomEntry.users?.email || "Unknown"}`);
      fetchEntries(selectedGiveawayId);
      fetchGiveaways();
    } catch {
      toast.error("Failed to pick winner");
    }
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
          title="Giveaways & Prizes"
          description="Orchestrate platform-wide giveaways, manage reward inventory, and select winners with precision."
          icon={Gift}
          actions={
            <Button onClick={() => openEditDialog()} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              New Giveaway
            </Button>
          }
        />

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            label="Total Campaigns"
            value={giveaways.length}
            icon={Gift}
            color="text-indigo-500"
            gradient="from-indigo-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Live Giveaways"
            value={giveaways.filter(g => g.is_active).length}
            icon={Eye}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            delay={0.05}
          />
          <StatusCard
            label="Total User Entries"
            value={giveaways.reduce((sum, g) => sum + (g.entry_count || 0), 0)}
            icon={Users}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.1}
          />
          <StatusCard
            label="Prizes Awarded"
            value={giveaways.reduce((sum, g) => sum + (g.current_winners || 0), 0)}
            icon={Trophy}
            color="text-purple-500"
            gradient="from-purple-500/10 to-transparent"
            delay={0.15}
          />
        </div>

        {/* Giveaways Command Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card border-border/50 overflow-hidden relative backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/30" />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b border-border/50 hover:bg-transparent">
                    <TableHead className="w-[100px] font-bold py-5">Priority</TableHead>
                    <TableHead className="font-bold">Campaign Entity</TableHead>
                    <TableHead className="font-bold">Prize structure</TableHead>
                    <TableHead className="font-bold text-center">Engagement</TableHead>
                    <TableHead className="font-bold">Distribution</TableHead>
                    <TableHead className="font-bold">Featured</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giveaways.map((giveaway) => (
                    <TableRow
                      key={giveaway.id}
                      className="hover:bg-indigo-500/5 transition-all duration-300 group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5 bg-background/50 rounded-full px-2 py-1 border border-border/50 w-fit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary transition-all rounded-full"
                            onClick={() => updateSortOrder(giveaway.id, "up")}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <span className="text-xs font-bold font-mono min-w-[1ch] text-center">{giveaway.sort_order}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary transition-all rounded-full"
                            onClick={() => updateSortOrder(giveaway.id, "down")}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          {giveaway.image_url ? (
                            <img src={giveaway.image_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-border/50 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                              <Gift className="w-5 h-5" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm tracking-tight">{giveaway.name}</p>
                            <p className="text-[11px] text-muted-foreground/70 line-clamp-1 max-w-[200px]">
                              {giveaway.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1.5 py-1 px-3 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-semibold capitalize">
                          {giveaway.prize_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-4 py-1.5 h-auto text-sm font-bold hover:bg-emerald-500/10 hover:text-emerald-500 transition-all rounded-lg group/btn"
                          onClick={() => viewEntries(giveaway.id)}
                        >
                          <Users className="w-3.5 h-3.5 mr-2 opacity-50 group-hover/btn:opacity-100" />
                          {giveaway.entry_count || 0}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                            <span>Yield</span>
                            <span>{Math.round(((giveaway.current_winners || 0) / giveaway.max_winners) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                              style={{ width: `${((giveaway.current_winners || 0) / giveaway.max_winners) * 100}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70">
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>{giveaway.current_winners || 0} / {giveaway.max_winners} Winners</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-amber-500/10 transition-all rounded-full group/star"
                          onClick={() => toggleFeatured(giveaway.id, giveaway.is_featured)}
                        >
                          <Star className={`w-4.5 h-4.5 transition-all ${giveaway.is_featured ? "fill-amber-400 text-amber-500 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-muted-foreground opacity-30 group-hover/star:opacity-100"}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={giveaway.is_active}
                          onCheckedChange={() => toggleActive(giveaway.id, giveaway.is_active)}
                          className="data-[state=checked]:bg-emerald-500 shadow-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all rounded-full">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 border-border/50 bg-background/80 backdrop-blur-2xl">
                            <DropdownMenuItem onClick={() => openEditDialog(giveaway)} className="rounded-lg gap-3 py-2.5 cursor-pointer">
                              <Edit className="w-4.5 h-4.5 opacity-60" />
                              <span className="font-medium">Modify Parameters</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => viewEntries(giveaway.id)} className="rounded-lg gap-3 py-2.5 cursor-pointer">
                              <Users className="w-4.5 h-4.5 opacity-60" />
                              <span className="font-medium">Participant List</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-border/40 my-1.5" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(giveaway.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg gap-3 py-2.5 cursor-pointer"
                            >
                              <Trash2 className="w-4.5 h-4.5 opacity-80" />
                              <span className="font-bold">Terminate Campaign</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGiveaway ? "Edit Giveaway" : "Create Giveaway"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Holiday Giveaway"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Win a free subscription!"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giveaway Type</Label>
                  <Select
                    value={formData.giveaway_type}
                    onValueChange={(v) => setFormData({ ...formData, giveaway_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raffle">Random Raffle</SelectItem>
                      <SelectItem value="first_come">First Come First Served</SelectItem>
                      <SelectItem value="contest">Contest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prize Type</Label>
                  <Select
                    value={formData.prize_type}
                    onValueChange={(v) => setFormData({ ...formData, prize_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="credits">Credits</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="custom">Custom Prize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.prize_type === "subscription" && (
                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(v) => setFormData({ ...formData, plan_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.prize_type === "credits" && (
                <div className="space-y-2">
                  <Label>Credits Amount</Label>
                  <Input
                    type="number"
                    value={(formData.prize_value as Record<string, unknown>).amount || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize_value: { ...formData.prize_value, amount: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Winners</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_winners}
                    onChange={(e) => setFormData({ ...formData, max_winners: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingGiveaway ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Entries Dialog */}
        <Dialog open={entriesDialogOpen} onOpenChange={setEntriesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Giveaway Entries</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {entries.length} total entries
                </p>
                <Button onClick={pickWinner}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Pick Random Winner
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Entered</TableHead>
                    <TableHead>Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.users?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{entry.users?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.entered_at ? format(new Date(entry.entered_at), "PPp") : "-"}
                      </TableCell>
                      <TableCell>
                        {entry.is_winner ? (
                          <Badge className="bg-success text-success-foreground">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
