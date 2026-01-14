import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Layout,
  Globe,
  Monitor,
  Cloud,
  Code
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  category: string;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  order_index: number;
  is_active: boolean;
  page_slug: string;
}

const categories = [
  { value: "documentation", label: "Documentation" },
  { value: "company", label: "Company (About, Careers)" },
  { value: "product", label: "Product (Features, Pricing)" },
  { value: "resources", label: "Resources (Guides, Help)" },
  { value: "legal", label: "Legal (Terms, Privacy)" },
  { value: "blog", label: "Blog Posts" },
  { value: "changelog", label: "Changelog" },
];

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [landingSections, setLandingSections] = useState<LandingSection[]>([]);
  const [pageFilter, setPageFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingLanding, setEditingLanding] = useState<LandingSection | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    category: "documentation",
    is_published: false,
    notify_users: false,
  });

  const [landingFormData, setLandingFormData] = useState({
    section_key: "",
    title: "",
    subtitle: "",
    content: "", // JSON stringified
    is_active: true,
    order_index: 0,
    page_slug: "home"
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "general") {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        setContent(data || []);
      } else if (activeTab === "landing") {
        let query = supabase
          .from("landing_sections")
          .select("*")
          .order("order_index", { ascending: true });

        if (pageFilter !== "all") {
          query = query.eq('page_slug', pageFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLandingSections((data as LandingSection[]) || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("content_items")
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            category: formData.category,
            is_published: formData.is_published,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Content updated successfully");
      } else {
        const { error } = await supabase
          .from("content_items")
          .insert({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            category: formData.category,
            is_published: formData.is_published,
          });

        if (error) throw error;
        toast.success("Content created successfully");
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save content";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLandingSubmit = async () => {
    setSaving(true);
    try {
      let jsonContent = {};
      try {
        jsonContent = JSON.parse(landingFormData.content || "{}");
      } catch {
        toast.error("Invalid JSON content");
        setSaving(false);
        return;
      }

      if (editingLanding) {
        const { error } = await supabase
          .from("landing_sections")
          .update({
            title: landingFormData.title,
            subtitle: landingFormData.subtitle,
            content: jsonContent,
            is_active: landingFormData.is_active,
            order_index: landingFormData.order_index,
            page_slug: landingFormData.page_slug,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingLanding.id);
        if (error) throw error;
        toast.success("Landing section updated");
      } else {
        const { error } = await supabase
          .from("landing_sections")
          .insert({
            section_key: landingFormData.section_key,
            title: landingFormData.title,
            subtitle: landingFormData.subtitle,
            content: jsonContent,
            is_active: landingFormData.is_active,
            order_index: landingFormData.order_index,
            page_slug: landingFormData.page_slug
          });
        if (error) throw error;
        toast.success("Landing section created");
      }
      setIsDialogOpen(false);
      setEditingLanding(null);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save landing section";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Content Orchestration"
          description="Control public facing narratives, documentation assets, and landing page components."
          icon={Globe}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/30 p-1.5 rounded-[1.25rem] mb-8 gap-2 border border-border/50 backdrop-blur-xl">
            <TabsTrigger value="general" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">General Content</span>
            </TabsTrigger>
            <TabsTrigger value="landing" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2 h-10">
              <Layout className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">Landing Sections</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all"
                />
              </div>
              <Button onClick={() => {
                setEditingItem(null);
                setFormData({ title: "", slug: "", content: "", category: "documentation", is_published: false, notify_users: false });
                setIsDialogOpen(true);
              }} className="bg-primary shadow-lg shadow-primary/20 rounded-xl hover:scale-105 transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Article
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {content.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group hover:-translate-x-1">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${item.is_published ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'} group-hover:scale-110 transition-transform`}>
                            {item.is_published ? <Cloud className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-base tracking-tight">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/30">/{item.slug}</span>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingItem(item);
                            setFormData({ title: item.title, slug: item.slug, content: item.content || "", category: item.category, is_published: !!item.is_published, notify_users: false });
                            setIsDialogOpen(true);
                          }} className="hover:bg-primary/10 hover:text-primary rounded-lg"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, "content_items")} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {content.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No content found. Create your first article to get started.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="landing" className="mt-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">View Context</Label>
                    <Select value={pageFilter} onValueChange={(val) => { setPageFilter(val); fetchData(); }}>
                      <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-none bg-transparent hover:bg-muted/30 focus:ring-0 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="about">About</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={() => {
                setEditingLanding(null);
                setJsonError(null);
                setLandingFormData({ section_key: "", title: "", subtitle: "", content: "{}", is_active: true, order_index: 0, page_slug: pageFilter === 'all' ? 'home' : pageFilter });
                setIsDialogOpen(true);
              }} className="bg-primary shadow-lg shadow-primary/20 rounded-xl hover:scale-105 transition-all">
                <Plus className="w-4 h-4 mr-2" /> Add Section
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {landingSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2 font-display">
                            {section.title || <span className="text-muted-foreground italic">Untitled Section</span>}
                            {!section.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wider">Hidden</span>}
                          </CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => {
                            setEditingLanding(section);
                            setLandingFormData({
                              section_key: section.section_key,
                              title: section.title,
                              subtitle: section.subtitle,
                              content: JSON.stringify(section.content || {}, null, 2),
                              is_active: section.is_active,
                              order_index: section.order_index,
                              page_slug: section.page_slug || 'home'
                            });
                            setJsonError(null);
                            setIsDialogOpen(true);
                          }}><Edit className="w-4 h-4" /></Button>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">{section.subtitle || "No description provided."}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Code className="w-3 h-3 opacity-50" />
                            <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">{section.section_key}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded uppercase text-[9px] font-bold tracking-wider border border-primary/10">{section.page_slug}</span>
                            <span className="font-mono opacity-50 text-[10px]">#{section.order_index}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {landingSections.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
                    <p>No landing sections found for this filter.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dynamic Dialog for both types */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border-border/50">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {activeTab === 'landing'
                  ? (editingLanding ? 'Edit Landing Section' : 'Create Landing Section')
                  : (editingItem ? 'Edit Article' : 'New Article')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {activeTab === 'landing' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section Key (ID)</Label>
                      <Input
                        disabled={!!editingLanding}
                        value={landingFormData.section_key}
                        onChange={e => setLandingFormData({ ...landingFormData, section_key: e.target.value })}
                        placeholder="e.g., hero, features"
                        className="bg-background/50 border-border/50 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Index</Label>
                      <Input
                        type="number"
                        value={landingFormData.order_index}
                        onChange={e => setLandingFormData({ ...landingFormData, order_index: parseInt(e.target.value) })}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Page ID (Slug)</Label>
                    <Select
                      value={landingFormData.page_slug}
                      onValueChange={(val) => setLandingFormData({ ...landingFormData, page_slug: val })}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="about">About</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={landingFormData.title}
                      onChange={e => setLandingFormData({ ...landingFormData, title: e.target.value })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle / Description</Label>
                    <Textarea
                      value={landingFormData.subtitle}
                      onChange={e => setLandingFormData({ ...landingFormData, subtitle: e.target.value })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Additional Configuration (JSON)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] font-bold uppercase tracking-wider"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(landingFormData.content);
                            setLandingFormData({ ...landingFormData, content: JSON.stringify(parsed, null, 2) });
                            toast.success("JSON Formatted");
                          } catch {
                            toast.error("Invalid JSON");
                          }
                        }}
                      >
                        <Code className="w-3 h-3 mr-1" /> Prettify
                      </Button>
                    </div>
                    <Textarea
                      className={`font-mono text-xs bg-background/50 border-border/50 ${jsonError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      rows={8}
                      value={landingFormData.content}
                      onChange={e => {
                        setLandingFormData({ ...landingFormData, content: e.target.value });
                        try {
                          JSON.parse(e.target.value);
                          setJsonError(null);
                        } catch {
                          setJsonError("Invalid JSON format");
                        }
                      }}
                      placeholder='{ "badge": "New Feature!", "cta_primary": "Join Now" }'
                    />
                    {jsonError && <p className="text-xs text-red-500 font-bold">{jsonError}</p>}
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <Switch
                      checked={landingFormData.is_active}
                      onCheckedChange={checked => setLandingFormData({ ...landingFormData, is_active: checked })}
                    />
                    <Label>Active (Visible on site)</Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value, slug: editingItem ? formData.slug : generateSlug(e.target.value) })}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        className="bg-background/50 border-border/50 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content (Markdown)</Label>
                    <Textarea
                      rows={10}
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      className="bg-background/50 border-border/50 font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <Switch checked={formData.is_published} onCheckedChange={c => setFormData({ ...formData, is_published: c })} />
                    <Label>Published</Label>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={activeTab === 'landing' ? handleLandingSubmit : handleSubmit} disabled={saving} className="rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
