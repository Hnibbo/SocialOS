import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Plus, Edit, Eye, Code, Zap, LayoutTemplate } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { motion } from "framer-motion";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminEmailTemplates = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subject: "",
    html_content: "",
    text_content: "",
    variables: "",
    category: "transactional",
    is_active: true
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const variables = data.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload = {
        name: data.name,
        slug: data.slug,
        subject: data.subject,
        html_content: data.html_content,
        text_content: data.text_content || null,
        variables,
        category: data.category,
        is_active: data.is_active
      };

      if (data.id) {
        const { error } = await supabase
          .from("email_templates")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template saved");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message)
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template updated");
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      subject: "",
      html_content: "",
      text_content: "",
      variables: "",
      category: "transactional",
      is_active: true
    });
    setSelectedTemplate(null);
  };

  const openEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || "",
      variables: Array.isArray(template.variables) ? template.variables.join(", ") : "",
      category: template.category,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Copied {{${variable}}}`);
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const categoryLabels: Record<string, string> = {
    onboarding: "Onboarding",
    auth: "Authentication",
    billing: "Billing",
    gdpr: "GDPR",
    referral: "Referral",
    transactional: "Transactional"
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Communications Hub"
          description="Automate and personalize system-wide email dispatch via programmable templates."
          icon={Mail}
          actions={
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          }
        />

        {/* Email Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            label="Active Templates"
            value={templates?.filter(t => t.is_active).length || 0}
            icon={Zap}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Total Library"
            value={templates?.length || 0}
            icon={LayoutTemplate}
            color="text-primary"
            gradient="from-primary/10 to-transparent"
            delay={0.05}
          />
          <StatusCard
            label="Category Clusters"
            value={Object.keys(groupedTemplates || {}).length}
            icon={Code}
            color="text-purple-500"
            gradient="from-purple-500/10 to-transparent"
            delay={0.1}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {selectedTemplate ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                {selectedTemplate ? "Edit Template" : "New Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Email"
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="welcome"
                    className="bg-background/50 border-border/50 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="gdpr">GDPR</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="user_name, app_name"
                    className="bg-background/50 border-border/50 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {{app_name}}!"
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>HTML Content</Label>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  rows={10}
                  className="font-mono text-sm bg-background/50 border-border/50"
                  placeholder="<h1>Welcome {{user_name}}!</h1>"
                />
              </div>
              <div className="space-y-2">
                <Label>Plain Text Content (optional)</Label>
                <Textarea
                  value={formData.text_content}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  rows={4}
                  placeholder="Welcome {{user_name}}!"
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/50">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button
                onClick={() => saveMutation.mutate({ ...formData, id: selectedTemplate?.id })}
                disabled={saveMutation.isPending}
                className="w-full h-10 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all font-display tracking-tight"
              >
                {saveMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <p className="text-muted-foreground animate-pulse">Loading templates...</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTemplates || {}).map(([category, categoryTemplates], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * categoryIndex }}
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80 font-display">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {categoryLabels[category] || category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="glass-panel border-border/40 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2 font-display">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                              <Mail className="h-3.5 w-3.5" />
                            </div>
                            {template.name}
                          </CardTitle>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: template.id, is_active: checked })}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground truncate opacity-80 pl-8">{template.subject}</p>
                        <div className="flex flex-wrap gap-1.5 pl-8 min-h-[2rem]">
                          {(Array.isArray(template.variables) ? template.variables : []).slice(0, 3).map((variable) => (
                            <Badge
                              key={variable}
                              variant="secondary"
                              className="cursor-pointer text-[10px] font-mono bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border/30"
                              onClick={() => copyVariable(variable)}
                            >
                              {variable}
                            </Badge>
                          ))}
                          {(Array.isArray(template.variables) ? template.variables : []).length > 3 && (
                            <Badge variant="outline" className="text-[10px] opacity-50">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(template)} className="flex-1 h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary">
                            <Edit className="h-3 w-3 mr-1.5" />Edit
                          </Button>
                          <Dialog open={isPreviewOpen && selectedTemplate?.id === template.id} onOpenChange={(open) => { setIsPreviewOpen(open); if (!open) setSelectedTemplate(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(template)} className="flex-1 h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary">
                                <Eye className="h-3 w-3 mr-1.5" />Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-panel border-border/50">
                              <DialogHeader>
                                <DialogTitle className="font-display">Preview: {template.name}</DialogTitle>
                              </DialogHeader>
                              <div className="border border-border/50 rounded-lg p-6 bg-background/50 backdrop-blur-sm shadow-inner">
                                <div
                                  dangerouslySetInnerHTML={{ __html: template.html_content }}
                                  className="prose prose-sm max-w-none dark:prose-invert font-sans"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout >
  );
};

export default AdminEmailTemplates;
