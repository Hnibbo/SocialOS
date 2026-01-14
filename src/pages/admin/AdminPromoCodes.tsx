import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Tag, Plus, Edit, Trash2, Copy, Check,
  Loader2, MoreHorizontal, Percent, DollarSign, Clock,
  LayoutGrid
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";

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


interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  plan_id: string | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  subscription_plans?: { name: string } | null;
}

interface Plan {
  id: string;
  name: string;
}

export default function AdminPromoCodes() {
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    plan_id: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchPlans();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      // Fetch Promo Codes
      const { data: promoData, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (promoError) throw promoError;

      // Fetch Plans to map names
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("id, name");

      if (plansError) throw plansError;

      const plansMap = new Map(plansData?.map(p => [p.id, p.name]));

      const formattedData = (promoData || []).map((p) => ({
        ...p,
        subscription_plans: p.plan_id ? { name: plansMap.get(p.plan_id) || "Unknown Plan" } : null
      }));

      setPromoCodes((formattedData as PromoCode[]) || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to load promo codes");
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

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const openEditDialog = (promoCode?: PromoCode) => {
    if (promoCode) {
      setEditingCode(promoCode);
      setFormData({
        code: promoCode.code,
        description: promoCode.description || "",
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value,
        plan_id: promoCode.plan_id || "",
        max_uses: promoCode.max_uses?.toString() || "",
        valid_from: promoCode.valid_from ? promoCode.valid_from.slice(0, 16) : "",
        valid_until: promoCode.valid_until ? promoCode.valid_until.slice(0, 16) : "",
        is_active: promoCode.is_active,
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 10,
        plan_id: "",
        max_uses: "",
        valid_from: "",
        valid_until: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code) {
      toast.error("Code is required");
      return;
    }

    setSaving(true);
    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        plan_id: (formData.plan_id && formData.plan_id !== "all") ? formData.plan_id : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_active: formData.is_active,
      };

      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Promo code updated (Local)");
      } else {
        // Create in Stripe first
        const { error: stripeErr } = await supabase.functions.invoke('stripe-admin', {
          body: {
            action: 'create-coupon',
            params: {
              code: formData.code.toUpperCase(),
              discount_type: formData.discount_type,
              discount_value: formData.discount_value,
              duration: 'forever' // default
            }
          }
        });

        if (stripeErr) throw stripeErr;

        const { error } = await supabase
          .from("promo_codes")
          .insert({
            ...promoData,
            // You could store stripe_coupon_id here if column existed
          });

        if (error) throw error;
        toast.success("Promo code created and synced with Stripe");
      }

      setDialogOpen(false);
      fetchPromoCodes();
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === "23505") {
        toast.error("This code already exists");
      } else {
        const message = error instanceof Error ? error.message : "Failed to save promo code";
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Promo code deleted (Local)");
      fetchPromoCodes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete promo code";
      toast.error(message);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      fetchPromoCodes();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const getDiscountDisplay = (code: PromoCode) => {
    switch (code.discount_type) {
      case "percentage":
        return `${code.discount_value}% off`;
      case "fixed":
        return `$${code.discount_value} off`;
      case "free_trial":
        return `${code.discount_value} days free`;
      case "free_month":
        return `${code.discount_value} month(s) free`;
      default:
        return code.discount_value.toString();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 data-testid="loader" className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Promo Codes"
          description="Create and manage promotional codes with discounts and free trials."
          icon={Tag}
          actions={
            <Button data-testid="new-promo-btn" onClick={() => openEditDialog()} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              New Promo Code
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            label="Total Platform Codes"
            value={promoCodes.length}
            icon={Tag}
            color="text-blue-500"
            gradient="from-blue-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Active Campaigns"
            value={promoCodes.filter(c => c.is_active).length}
            icon={Check}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            delay={0.05}
          />
          <StatusCard
            label="Total Redemptions"
            value={promoCodes.reduce((sum, c) => sum + (c.current_uses || 0), 0)}
            icon={Percent}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.1}
          />
          <StatusCard
            label="Expired / Total"
            value={`${promoCodes.filter(c => c.valid_until && new Date(c.valid_until) < new Date()).length} / ${promoCodes.length}`}
            icon={Clock}
            color="text-muted-foreground"
            gradient="from-muted/10 to-transparent"
            delay={0.15}
          />
        </div>

        {/* Promo Codes Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-panel rounded-2xl border-border/40 overflow-hidden relative shadow-2xl shadow-black/20">
            {/* Table Header/Toolbar could go here */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b border-border/50 hover:bg-muted/30">
                    <TableHead className="font-bold py-4 text-xs tracking-wider uppercase pl-6">Code</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider uppercase">Discount</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider uppercase">Visibility</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider uppercase">Usage</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider uppercase">Status</TableHead>
                    <TableHead className="text-right font-bold pr-6 text-xs tracking-wider uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((code) => (
                    <TableRow
                      key={code.id}
                      className="hover:bg-primary/5 transition-colors group border-border/40"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative group/code cursor-pointer" onClick={() => copyCode(code.code)}>
                            <div className="absolute inset-0 bg-primary/20 blur-md rounded-lg opacity-0 group-hover/code:opacity-100 transition-opacity" />
                            <code className="relative px-3 py-1.5 bg-background/50 border border-border/50 rounded-lg text-sm font-mono font-bold tracking-tight flex items-center gap-2 group-hover/code:border-primary/30 transition-colors">
                              {code.code}
                              {copied === code.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-50" />}
                            </code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 border-border/40 bg-muted/40 font-medium">
                          {code.discount_type === "percentage" && <Percent className="w-3 h-3 text-blue-400" />}
                          {code.discount_type === "fixed" && <DollarSign className="w-3 h-3 text-emerald-400" />}
                          {code.discount_type === "free_trial" && <Clock className="w-3 h-3 text-purple-400" />}
                          {getDiscountDisplay(code)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground/80">
                          <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
                          <span className="text-sm font-medium">
                            {code.subscription_plans?.name || "Global Access"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[120px] max-w-[160px]">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                            <span>Claimed</span>
                            <span>{code.max_uses ? `${Math.round((code.current_uses / code.max_uses) * 100)}%` : "UNLIMITED"}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-1000 ease-out rounded-full"
                              style={{ width: code.max_uses ? `${(code.current_uses / code.max_uses) * 100}%` : '100%' }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={code.is_active}
                            onCheckedChange={() => toggleActive(code.id, code.is_active)}
                            className="scale-90 data-[state=checked]:bg-emerald-500"
                          />
                          {new Date(code.valid_until || '2099-12-31') < new Date() && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1.5 border-border/50 bg-background/90 backdrop-blur-xl rounded-xl">
                            <DropdownMenuItem onClick={() => openEditDialog(code)} className="rounded-lg gap-2 text-xs font-semibold h-9 focus:bg-primary/10 focus:text-primary cursor-pointer">
                              <Edit className="w-3.5 h-3.5" />
                              Edit Parameters
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyCode(code.code)} className="rounded-lg gap-2 text-xs font-semibold h-9 focus:bg-primary/10 focus:text-primary cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                              Copy Code
                            </DropdownMenuItem>
                            <div className="h-px bg-border/40 my-1 mx-2" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(code.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg gap-2 text-xs font-semibold h-9 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Archive Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {promoCodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No active promo codes found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg glass-panel border-border/50 p-0 overflow-hidden gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2 font-display text-xl">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {editingCode ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                {editingCode ? "Edit Campaign" : "New Campaign"}
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 pt-2 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Campaign Code</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="promo-code"
                      data-testid="promo-code-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      className="font-mono pl-10 uppercase font-bold tracking-wider bg-background/50 border-border/50 focus:border-primary/50"
                    />
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  </div>
                  <Button type="button" variant="outline" onClick={generateCode} className="border-border/50 hover:bg-primary/5 hover:text-primary">
                    <Check className="w-4 h-4 mr-2" />
                    Auto-Gen
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-description">Internal Note (Description)</Label>
                <Textarea
                  id="promo-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Seasonal discount for new users..."
                  rows={2}
                  className="bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      <SelectItem value="free_trial">Free Trial (Days)</SelectItem>
                      <SelectItem value="free_month">Free Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-value">Value</Label>
                  <div className="relative">
                    <Input
                      id="promo-value"
                      data-testid="promo-value-input"
                      type="number"
                      min="0"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                      className="bg-background/50 border-border/50 font-mono text-right pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-xs font-bold">
                      {formData.discount_type === 'percentage' ? '%' : (formData.discount_type === 'fixed' ? '$' : '#')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Plan</Label>
                <Select
                  value={formData.plan_id}
                  onValueChange={(v) => setFormData({ ...formData, plan_id: v })}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Global (All Plans)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global (All Plans)</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Usage Limit (Max Redemptions)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="bg-background/50 border-border/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="bg-background/50 border-border/50 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="bg-background/50 border-border/50 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex flex-col">
                  <Label className="font-bold">Active Campaign</Label>
                  <span className="text-[10px] text-muted-foreground">Disabled codes cannot be redeemed.</span>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-2 bg-muted/10 border-t border-border/30 gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl hover:bg-background">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl shadow-lg shadow-primary/20 bg-primary font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCode ? "Update Campaign" : "Launch Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
