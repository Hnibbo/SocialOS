import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    custom_domain: string | null;
    is_active: boolean;
}

interface Plan {
    id: string;
    name: string;
}

interface OrganizationFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Organization | null;
    onSuccess: () => void;
}

export default function OrganizationFormDialog({
    open,
    onOpenChange,
    initialData,
    onSuccess,
}: OrganizationFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        primary_color: "#8B5CF6",
        logo_url: "",
        custom_domain: "",
        plan_id: "none" // For provisioning
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                slug: initialData.slug,
                primary_color: initialData.primary_color || "#8B5CF6",
                logo_url: initialData.logo_url || "",
                custom_domain: initialData.custom_domain || "",
                plan_id: "none"
            });
            fetchCurrentPlan(initialData.id);
        } else {
            setFormData({
                name: "",
                slug: "",
                primary_color: "#8B5CF6",
                logo_url: "",
                custom_domain: "",
                plan_id: "none"
            });
        }
        fetchPlans();
    }, [initialData, open]);

    const fetchPlans = async () => {
        const { data } = await supabase.from('subscription_plans').select('id, name').eq('is_active', true);
        if (data) setPlans(data);
    }

    const fetchCurrentPlan = async (orgId: string) => {
        const { data, error } = await supabase
            .from('organization_subscriptions')
            .select('plan_id')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .maybeSingle();

        if (data && !error) {
            setFormData(prev => ({ ...prev, plan_id: data.plan_id }));
        }
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and slug are required");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
                primary_color: formData.primary_color,
                logo_url: formData.logo_url || null,
                custom_domain: formData.custom_domain || null,
            };

            if (initialData) {
                const { error } = await supabase
                    .from("organizations")
                    .update(payload)
                    .eq("id", initialData.id);

                if (error) throw error;
                toast.success("Organization updated");

                // Update Plan if changed
                if (formData.plan_id) {
                    // Check if plan matches current active plan
                    const { data: currentSub } = await supabase
                        .from('organization_subscriptions')
                        .select('plan_id, id')
                        .eq('organization_id', initialData.id)
                        .eq('status', 'active')
                        .maybeSingle();

                    // If plan changed (or no current plan and new plan selected)
                    if (formData.plan_id !== (currentSub?.plan_id || 'none')) {
                        // Deactivate old plan if exists
                        if (currentSub) {
                            await supabase
                                .from('organization_subscriptions')
                                .update({ status: 'canceled', ends_at: new Date().toISOString() })
                                .eq('id', currentSub.id);
                        }

                        // Create new subscription if not 'none'
                        if (formData.plan_id !== 'none') {
                            const { error: subError } = await supabase
                                .from('organization_subscriptions')
                                .insert({
                                    organization_id: initialData.id,
                                    plan_id: formData.plan_id,
                                    status: 'active'
                                });

                            if (subError) {
                                console.error("Error updating plan:", subError);
                                toast.error("Organization updated but plan change failed");
                            } else {
                                toast.success("Subscription plan updated");
                            }
                        }
                    }
                }
            } else {
                const { error, data } = await supabase
                    .from("organizations")
                    .insert({
                        ...payload,
                        is_active: true
                    })
                    .select()
                    .single();

                if (error) throw error;
                toast.success("Organization created");

                // Handle Plan Provisioning for new Org if selected
                if (formData.plan_id && formData.plan_id !== 'none' && data) {
                    const { error: subError } = await supabase
                        .from('organization_subscriptions')
                        .insert({
                            organization_id: data.id,
                            plan_id: formData.plan_id,
                            status: 'active'
                        });

                    if (subError) {
                        console.error("Error provisioning plan:", subError);
                        toast.error("Organization created but plan provisioning failed");
                    } else {
                        toast.success("Plan provisioned successfully");
                    }
                }
            }

            onSuccess();
        } catch (error: unknown) {
            console.error("Error saving organization:", error);
            const message = error instanceof Error ? error.message : "Failed to save organization";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Organization" : "Create Organization"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update organization details and settings." : "Add a new enterprise or white-label client."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input
                                placeholder="Acme Corp"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                placeholder="acme-corp"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Custom Domain</Label>
                        <Input
                            placeholder="portal.acme.com"
                            value={formData.custom_domain}
                            onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            placeholder="https://..."
                            value={formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Brand Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={formData.primary_color}
                                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                className="w-12 h-10 p-1"
                            />
                            <Input
                                value={formData.primary_color}
                                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{initialData ? "Subscription Plan" : "Provision Plan (Initial)"}</Label>
                        <Select
                            value={formData.plan_id}
                            onValueChange={(val) => setFormData({ ...formData, plan_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a plan..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Plan</SelectItem>
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {initialData ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
