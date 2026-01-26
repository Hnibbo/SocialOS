import { useState, useEffect } from "react";
import { Link, useParams, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import {
  Book,
  MapPin,
  Heart,
  Users,
  Shield,
  Zap,
  CheckCircle,
  Menu,
  X,
  MessageSquare,
  Copy,
  Star,
  Loader2,
  AlertCircle,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import hupLogo from "@/assets/hup-logo.png";
import { cn } from "@/lib/utils";

// Sidebar navigation structure for Social App
const sections = [
  { id: "getting-started", label: "Introduction", icon: Zap },
  { id: "user-profiles", label: "User Profiles", icon: Users },
  { id: "live-map", label: "Live Social Map", icon: MapPin },
  { id: "groups-activities", label: "Groups & Events", icon: Star },
  { id: "dating-matching", label: "Dating & Matching", icon: Heart },
  { id: "random-chat", label: "Random Connections", icon: MessageSquare },
  { id: "monetization", label: "Creator Economy", icon: Coins },
  { id: "safety-privacy", label: "Safety & Privacy", icon: Shield },
];

export default function Docs() {
  const { slug } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoc() {
      if (!slug) return;

      setIsLoading(true);
      setError(false);
      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("title, content")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();

        if (error) throw error;

        if (data && !data.content.toLowerCase().includes("terminal")) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          // If the doc is about terminal or remote control, we hide it/show error
          console.warn(`Documentation for slug "${slug}" is outdated or missing.`);
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching docs:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoc();
  }, [slug]);


  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markdownComponents = {
    h1: ({ ...props }: any) => (
      <h1 className="text-3xl font-bold mb-6 text-foreground tracking-tight" {...props} />
    ),
    h2: ({ ...props }: any) => (
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground tracking-tight" {...props} />
    ),
    h3: ({ ...props }: any) => (
      <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground" {...props} />
    ),
    p: ({ ...props }: any) => (
      <p className="mb-4 text-muted-foreground leading-relaxed" {...props} />
    ),
    ul: ({ ...props }: any) => (
      <ul className="mb-4 pl-6 space-y-2 list-none" {...props} />
    ),
    ol: ({ ...props }: any) => <ol className="list-decimal list-inside space-y-2 mb-6 text-muted-foreground" {...props} />,
    li: ({ ...props }: any) => (
      <li className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/50" {...props} />
    ),
    a: ({ ...props }: any) => (
      <a className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-all" {...props} />
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeText = String(children).replace(/\n$/, '');

      if (!inline && match) {
        return (
          <div className="relative group/code mt-4 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity rounded-xl pointer-events-none" />
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background/80 hover:text-primary rounded-lg backdrop-blur-sm"
                onClick={() => copyCode(codeText)}
              >
                {copiedCode === codeText ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="p-5 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/50 overflow-x-auto text-[13px] font-mono leading-relaxed transition-all group-hover/code:border-primary/20">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        )
      }
      return <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
    },
    blockquote: ({ ...props }: any) => (
      <blockquote className="border-l-4 border-primary/20 pl-4 py-1 my-6 italic bg-muted/10 rounded-r-lg" {...props} />
    ),
  };

  if (!slug && location.pathname === "/docs") {
    return <Navigate to="/docs/getting-started" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-b border-border/60 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-4 lg:px-8 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-lg group-hover:bg-primary/30 transition-colors" />
                <img src={hupLogo} alt="Hup" className="relative h-8 w-8 rounded-lg" />
              </div>
              <span className="font-display text-lg font-bold text-gradient">Hup Docs</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Guide</span>
              <span className="text-[10px] bg-background px-1.5 py-0.5 rounded text-muted-foreground/70 border border-border/50">v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/20">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex pt-16 max-w-screen-2xl mx-auto">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-background/50 backdrop-blur-xl border-r border-border/40 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 h-full overflow-y-auto no-scrollbar">
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-6 px-3">
              Social Operating System
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={`/docs/${section.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    slug === section.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <section.icon className={cn(
                    "w-4 h-4 transition-colors",
                    slug === section.id ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                  )} />
                  {section.label}
                  {slug === section.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-border/40">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-6 px-3">
                Help & Support
              </div>
              <nav className="space-y-1">
                <Link to="/help-center" className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                  <Book className="w-4 h-4 opacity-70" /> Help Center
                </Link>
                <Link to="/community" className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                  <Users className="w-4 h-4 opacity-70" /> Community
                </Link>
                <Link to="/contact" className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors">
                  <MessageSquare className="w-4 h-4 opacity-70" /> Support
                </Link>
              </nav>
            </div>

            <div className="mt-12 p-1">
              <div className="relative rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-5 border border-primary/10 rounded-2xl bg-background/40 backdrop-blur-sm">
                  <h4 className="text-xs font-bold mb-2 flex items-center gap-2">
                    <Star className="w-3 h-3 text-primary" /> Premium Access
                  </h4>
                  <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                    Everything you need to know about using Hup to connect with the world.
                    with a Pro subscription.
                  </p>
                  <Link to="/signup">
                    <Button size="sm" variant="secondary" className="w-full text-xs font-bold h-8 bg-background/50 hover:bg-background border border-border/50 shadow-sm">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-10 lg:py-12">
          <div className="max-w-4xl mx-auto pl-0 lg:pl-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Scanning social network...</p>
              </div>
            ) : error || !content ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">Guide Not Found</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    The requested guide section doesn't exist or is currently being updated for the Social App.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link to="/docs/getting-started">
                    <Button>Back to Intro</Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline">Contact Support</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24"
              >
                <div className="mb-4 text-sm text-primary font-medium flex items-center gap-2">
                  <span>Guides</span>
                  Welcome to the <span className="text-gradient">Hup</span> Docs
                  <span className="capitalize">{slug?.replace(/-/g, ' ')}</span>
                </div>
                <h1 className="font-display text-4xl lg:text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70">
                  {title}
                </h1>
                <ReactMarkdown components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </motion.article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
