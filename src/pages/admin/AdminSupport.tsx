import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  MessageSquare,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Bot,
  MoreVertical
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";


import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Conversation {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  satisfaction_rating: number | null;
  user_email?: string;
  message_count?: number;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function AdminSupport() {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get user emails
      const userIds = [...new Set((data || []).filter(c => c.user_id).map((c) => c.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds as string[]);

      const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

      // Get message counts
      const { data: msgCounts } = await supabase
        .from("support_messages")
        .select("conversation_id");

      const countMap = new Map<string, number>();
      (msgCounts || []).forEach((m) => {
        countMap.set(m.conversation_id, (countMap.get(m.conversation_id) || 0) + 1);
      });

      setConversations(
        (data || []).map((c) => ({
          ...c,
          user_email: c.user_id ? userMap.get(c.user_id) || "Unknown" : "Anonymous",
          message_count: countMap.get(c.id) || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleResolve = async (conversation: Conversation) => {
    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({
          status: "resolved",
          resolved_by: currentUser?.id,
        })
        .eq("id", conversation.id);

      if (error) throw error;

      toast.success("Conversation marked as resolved");
      fetchConversations();
      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation({ ...conversation, status: "resolved" });
      }
    } catch (error) {
      console.error("Error resolving conversation:", error);
      toast.error("Failed to resolve conversation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case "closed":
        return <Badge className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
    }
  };



  const filteredConversations = conversations.filter(
    (c) =>
      c.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.includes(search)
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-theme(spacing.16))] flex overflow-hidden bg-background">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 border-r border-border/50 flex flex-col bg-muted/10 backdrop-blur-sm">
          <div className="p-6 space-y-4">
            <h1 className="font-display text-xl lg:text-2xl font-black flex items-center gap-3 tracking-tight">
              <div className="p-2 rounded-xl bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              Assistance Hub
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:ring-primary/20"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 data-testid="loader" className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative group ${selectedConversation?.id === conv.id
                        ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5"
                        : "hover:bg-muted/50 border border-transparent"
                        }`}
                      onClick={() => {
                        setSelectedConversation(conv);
                        fetchMessages(conv.id);
                      }}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        {conv.status === 'active' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm truncate">{conv.user_email}</p>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(conv.updated_at), "HH:mm")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate opacity-70">
                          {conv.message_count} messages • {conv.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">Choose a session to view the message history.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold">{selectedConversation.user_email}</h2>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedConversation.status)}
                      <span className="text-xs text-muted-foreground font-mono">ID: {selectedConversation.id}</span>
                    </div>
                  </div>
                </div>
                {selectedConversation.status === "active" && (
                  <Button
                    onClick={() => handleResolve(selectedConversation)}
                    className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-bold px-6"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-6 pb-12">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex gap-4 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === "assistant"
                            ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                            : "bg-muted text-muted-foreground border border-border/50"
                            }`}
                        >
                          {msg.role === "assistant" ? (
                            <Bot className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative group ${msg.role === "assistant"
                            ? "bg-muted/50 text-foreground border border-border/30"
                            : "bg-gradient-primary text-white"
                            }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className={`mt-2 flex items-center gap-2 opacity-50 text-[10px] font-medium ${msg.role === "assistant" ? "text-muted-foreground" : "text-white/80"
                            }`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(msg.created_at), "HH:mm • MMM d, yyyy")}
                          </div>

                          {/* Message Tail Decorative Aspect */}
                          <div className={`absolute top-4 w-2 h-2 rotate-45 ${msg.role === "assistant"
                            ? "-left-1 bg-muted/50 border-l border-b border-border/30"
                            : "-right-1 bg-gradient-primary"
                            }`} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Notification Placeholder for Real-time */}
              <div className="p-4 bg-muted/5 text-[10px] uppercase font-bold tracking-widest text-center text-muted-foreground border-t border-border/30 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Secure end-to-end encrypted connection
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
