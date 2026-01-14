import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageCircle,
  X,
  Send,
  Loader2,
  MapPin,
  CreditCard,
  Rocket,
  Shield,
  Heart,
  Users,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface FAQArticle {
  id: string;
  category_id: string;
  question: string;
  answer: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  shield: Shield,
  map: MapPin,
  heart: Heart,
  users: Users,
  "credit-card": CreditCard,
  chat: MessageSquare
};

export default function HelpCenter() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFAQ();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchFAQ = async () => {
    try {
      const [catResult, artResult] = await Promise.all([
        supabase.from("faq_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("faq_articles").select("*").eq("is_published", true).order("sort_order"),
      ]);

      const filteredCategories = (catResult.data || []).filter(c => !c.name.toLowerCase().includes("terminal") && !c.name.toLowerCase().includes("command"));
      setCategories(filteredCategories);
      setArticles(artResult.data || []);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.question.toLowerCase().includes(search.toLowerCase()) ||
      a.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvvdkbqxeypqkfllhlar.supabase.co';
      const response = await fetch(
        `${supabaseUrl}/functions/v1/support-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again or check our FAQ below.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return MessageCircle;
    return iconMap[iconName] || MessageCircle;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              How can we <span className="text-gradient">help you?</span>
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for social OS help..."
                className="pl-12 h-14 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : search ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-xl font-bold mb-6">
                {filteredArticles.length} result{filteredArticles.length !== 1 ? "s" : ""} for "{search}"
              </h2>
              {filteredArticles.length === 0 ? (
                <Card className="bg-muted/30">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">No articles found matching your search.</p>
                    <Button onClick={() => setChatOpen(true)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ask Social AI Assistant
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
                  {filteredArticles.map((article) => (
                    <AccordionItem
                      key={article.id}
                      value={article.id}
                      className="border rounded-lg bg-gradient-card px-4"
                    >
                      <AccordionTrigger className="hover:no-underline text-left">
                        {article.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                        {article.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {categories.map((category, index) => {
                const categoryArticles = articles.filter((a) => a.category_id === category.id);
                const Icon = getIcon(category.icon);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gradient-card border-border/50 h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-display font-semibold">{category.name}</h3>
                        </div>
                        <Accordion type="single" collapsible className="space-y-2">
                          {categoryArticles.slice(0, 4).map((article) => (
                            <AccordionItem
                              key={article.id}
                              value={article.id}
                              className="border-b-0"
                            >
                              <AccordionTrigger className="hover:no-underline text-sm py-2 text-left">
                                {article.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {article.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        {categoryArticles.length > 4 && (
                          <Button
                            variant="link"
                            className="mt-2 p-0 h-auto text-primary"
                            onClick={() => setSearch(category.name)}
                          >
                            View all {categoryArticles.length} guides
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Still need assistance?</h2>
          <p className="text-muted-foreground mb-6">
            Our Social AI assistant is always ready to guide you.
          </p>
          <Button size="lg" onClick={() => setChatOpen(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Talk to AI Assistant
          </Button>
        </div>
      </section>

      <Footer />

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-primary/20">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-primary rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Hup Assistant</h3>
                    <p className="text-xs text-white/80">Social App Guide</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="h-[350px] p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Welcome to Hup!</p>
                    <p className="text-sm mt-2">I can help you with matching, map features, and events.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about Hup..."
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="icon" disabled={chatLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!chatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary shadow-lg flex items-center justify-center text-white"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}
