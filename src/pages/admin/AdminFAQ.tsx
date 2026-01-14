import { useState, useEffect } from "react";

import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,

} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface FAQArticle {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  views: number;
  is_published: boolean;
  sort_order: number;
}

export default function AdminFAQ() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<FAQArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    category_id: "",
    question: "",
    answer: "",
    keywords: "",
    is_published: true,
  });

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    icon: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catResult, artResult] = await Promise.all([
        supabase.from("faq_categories").select("*").order("sort_order"),
        supabase.from("faq_articles").select("*").order("sort_order"),
      ]);

      if (catResult.error) throw catResult.error;
      if (artResult.error) throw artResult.error;

      setCategories(catResult.data || []);
      setArticles(artResult.data || []);
    } catch (error) {
      console.error("Error fetching FAQ data:", error);
      toast.error("Failed to load FAQ data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    setSaving(true);
    try {
      const keywordsArray = articleForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      const articleData = {
        category_id: articleForm.category_id,
        question: articleForm.question,
        answer: articleForm.answer,
        keywords: keywordsArray,
        is_published: articleForm.is_published,
      };

      if (editingArticle) {
        const { error } = await supabase
          .from("faq_articles")
          .update(articleData)
          .eq("id", editingArticle.id);
        if (error) throw error;
        toast.success("Article updated");
      } else {
        const { error } = await supabase.from("faq_articles").insert(articleData);
        if (error) throw error;
        toast.success("Article created");
      }

      setArticleDialogOpen(false);
      resetArticleForm();
      fetchData();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    try {
      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        icon: categoryForm.icon || null,
        is_active: categoryForm.is_active,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("faq_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("faq_categories").insert(categoryData);
        if (error) throw error;
        toast.success("Category created");
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase.from("faq_articles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Article deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  const handleTogglePublished = async (article: FAQArticle) => {
    try {
      const { error } = await supabase
        .from("faq_articles")
        .update({ is_published: !article.is_published })
        .eq("id", article.id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error toggling article:", error);
    }
  };

  const resetArticleForm = () => {
    setEditingArticle(null);
    setArticleForm({
      category_id: "",
      question: "",
      answer: "",
      keywords: "",
      is_published: true,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      icon: "",
      is_active: true,
    });
  };

  const openEditArticle = (article: FAQArticle) => {
    setEditingArticle(article);
    setArticleForm({
      category_id: article.category_id,
      question: article.question,
      answer: article.answer,
      keywords: article.keywords?.join(", ") || "",
      is_published: article.is_published,
    });
    setArticleDialogOpen(true);
  };

  const openEditCategory = (category: FAQCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      icon: category.icon || "",
      is_active: category.is_active,
    });
    setCategoryDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Information Architecture"
          description="Manage platform documentation, FAQ clusters, and self-service knowledge nodes."
          icon={HelpCircle}
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setCategoryDialogOpen(true)} className="border-border/50 hover:bg-muted/50 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
              <Button onClick={() => setArticleDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </div>
          }
        />

        {/* Knowledge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            label="Knowledge Clusters"
            value={categories.length}
            icon={BookOpen}
            color="text-indigo-500"
            gradient="from-indigo-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Total Articles"
            value={articles.length}
            icon={FileText}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            delay={0.05}
          />
          <StatusCard
            label="User Engagement"
            value={articles.reduce((sum, a) => sum + (a.views || 0), 0)}
            icon={Eye}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.1}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {categories.map((category) => {
              const categoryArticles = articles.filter((a) => a.category_id === category.id);
              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-gradient-card">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-primary/5 transition-all text-left">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base tracking-tight">{category.name}</h3>
                        <p className="text-xs text-muted-foreground opacity-70">
                          {categoryArticles.length} active knowledge nodes
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {!category.is_active && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px]">
                            HIDDEN
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategory(category);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="flex justify-end mb-4">
                      <Button size="sm" variant="outline" onClick={() => openEditCategory(category)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Category
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {categoryArticles.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">
                          No articles in this category
                        </p>
                      ) : (
                        categoryArticles.map((article) => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{article.question}</p>
                                <p className="text-xs text-muted-foreground">
                                  {article.views} views
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleTogglePublished(article)}
                              >
                                {article.is_published ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditArticle(article)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteArticle(article.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Article Dialog */}
        <Dialog open={articleDialogOpen} onOpenChange={(open) => {
          setArticleDialogOpen(open);
          if (!open) resetArticleForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "New Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={articleForm.category_id}
                  onValueChange={(v) => setArticleForm({ ...articleForm, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={articleForm.question}
                  onChange={(e) => setArticleForm({ ...articleForm, question: e.target.value })}
                  placeholder="How do I..."
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea
                  value={articleForm.answer}
                  onChange={(e) => setArticleForm({ ...articleForm, answer: e.target.value })}
                  placeholder="Write the answer here..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  value={articleForm.keywords}
                  onChange={(e) => setArticleForm({ ...articleForm, keywords: e.target.value })}
                  placeholder="help, guide, tutorial"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={articleForm.is_published}
                  onCheckedChange={(checked) => setArticleForm({ ...articleForm, is_published: checked })}
                />
                <Label>Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveArticle} disabled={saving || !articleForm.category_id || !articleForm.question}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) resetCategoryForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Getting Started"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="getting-started"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon (Lucide icon name)</Label>
                <Input
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="rocket"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} disabled={saving || !categoryForm.name || !categoryForm.slug}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
