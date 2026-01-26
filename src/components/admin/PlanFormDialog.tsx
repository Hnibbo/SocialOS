import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
}

interface ExtendedPlan extends Plan {
  stripe_product_id?: string;
  stripe_price_monthly?: string;
  stripe_price_yearly?: string;
  is_custom?: boolean;
  cta_text?: string;
}



interface FormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  features: string[];
  limits: {
    workspaces: string;
    commands_per_day: string;
    history_days: string;
  };
  is_active: boolean;
  is_featured: boolean;
  trial_days: string;
  sort_order: string;
  stripe_product_id: string;
  stripe_price_monthly: string;
  stripe_price_yearly: string;
  is_custom: boolean;
  cta_text: string;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  description: "",
  price_monthly: "0",
  price_yearly: "0",
  features: [""],
  limits: {
    workspaces: "1",
    commands_per_day: "100",
    history_days: "7",
  },
  is_active: true,
  is_featured: false,
  trial_days: "0",
  sort_order: "0",
  stripe_product_id: "",
  stripe_price_monthly: "",
  stripe_price_yearly: "",
  is_custom: false,
  cta_text: "Subscribe",
};

export default function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: PlanFormDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState("");


  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || "",
        price_monthly: plan.price_monthly.toString(),
        price_yearly: plan.price_yearly.toString(),
        features: plan.features.length > 0 ? plan.features : [""],
        limits: {
          workspaces: plan.limits.workspaces.toString(),
          commands_per_day: plan.limits.commands_per_day.toString(),
          history_days: plan.limits.history_days.toString(),
        },
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        trial_days: plan.trial_days.toString(),
        sort_order: plan.sort_order.toString(),

        stripe_product_id: (plan as ExtendedPlan).stripe_product_id || "",
        stripe_price_monthly: (plan as ExtendedPlan).stripe_price_monthly || "",
        stripe_price_yearly: (plan as ExtendedPlan).stripe_price_yearly || "",
        is_custom: (plan as ExtendedPlan).is_custom || false,
        cta_text: (plan as ExtendedPlan).cta_text || "Subscribe",
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [plan, open]);






  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setSaving(true);
    try {
      // 1. Stripe Product Sync is manual for now via the ID fields.
      // In the future, we could add auto-provisioning here.


      // 2. Save to Supabase
      const planData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || null,
        price_monthly: parseFloat(formData.price_monthly) || 0,
        price_yearly: parseFloat(formData.price_yearly) || 0,
        features: formData.features.filter((f) => f.trim() !== ""),
        limits: {
          workspaces: parseInt(formData.limits.workspaces) || 1,
          commands_per_day: parseInt(formData.limits.commands_per_day) || 100,
          history_days: parseInt(formData.limits.history_days) || 7,
        },
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        trial_days: parseInt(formData.trial_days) || 0,
        sort_order: parseInt(formData.sort_order) || 0,
        // Save Stripe IDs
        stripe_product_id: formData.stripe_product_id || null,
        stripe_price_monthly: formData.stripe_price_monthly || null,
        stripe_price_yearly: formData.stripe_price_yearly || null,
        is_custom: formData.is_custom,
        cta_text: formData.cta_text,
      };

      if (plan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert(planData);

        if (error) throw error;
        toast.success("Plan created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Error saving plan:", err);
      const message = err instanceof Error ? err.message : "Failed to save plan";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name *</Label>
              <Input
                id="plan-name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: plan ? formData.slug : name.toLowerCase().replace(/\s+/g, "-"),
                  });
                }}
                placeholder="Pro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-slug">Slug *</Label>
              <Input
                id="plan-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="pro"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Perfect for professional developers"
              rows={2}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-monthly">Monthly Price ($)</Label>
              <Input
                id="price-monthly"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) =>
                  setFormData({ ...formData, price_monthly: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-yearly">Yearly Price ($)</Label>
              <Input
                id="price-yearly"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_yearly}
                onChange={(e) =>
                  setFormData({ ...formData, price_yearly: e.target.value })
                }
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label>Features</Label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Feature description"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                    disabled={formData.features.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add new feature"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" onClick={addFeature}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-3">
            <Label>Limits (-1 for unlimited)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Workspaces</Label>
                <Input
                  type="number"
                  value={formData.limits.workspaces}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, workspaces: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Commands/Day</Label>
                <Input
                  type="number"
                  value={formData.limits.commands_per_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, commands_per_day: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">History Days</Label>
                <Input
                  type="number"
                  value={formData.limits.history_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, history_days: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trial Days</Label>
              <Input
                type="number"
                min="0"
                value={formData.trial_days}
                onChange={(e) =>
                  setFormData({ ...formData, trial_days: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked })
                }
              />
            </div>
          </div>

          {/* Enterprise / Custom */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_custom}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_custom: checked })
                }
              />
              <div className="space-y-0.5">
                <Label>Enterprise / Custom</Label>
                <p className="text-xs text-muted-foreground">Hides price, shows "Contact Sales"</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Call to Action</Label>
              <Input
                value={formData.cta_text}
                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                placeholder="Subscribe"
              />
            </div>
          </div>


          {/* Stripe Integration */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#635BFF] flex items-center justify-center text-[10px] text-white font-bold">S</div>
                  Stripe Configuration
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Required if using Stripe as payment provider.
                </p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Product ID (prod_...)</Label>
                <Input
                  value={formData.stripe_product_id}
                  onChange={(e) => setFormData({ ...formData, stripe_product_id: e.target.value })}
                  placeholder="prod_..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Price ID (price_...)</Label>
                  <Input
                    value={formData.stripe_price_monthly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_monthly: e.target.value })}
                    placeholder="price_..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Yearly Price ID (price_...)</Label>
                  <Input
                    value={formData.stripe_price_yearly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_yearly: e.target.value })}
                    placeholder="price_..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {plan ? "Update Plan" : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
