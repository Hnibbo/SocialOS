import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { History, Search, Filter, Eye, User, Settings, FileText, CreditCard, Gift, Users, Activity, Terminal, ShieldAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";


interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin?: { email: string; name: string | null };
}

const AdminAuditLog = () => {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", search, resourceFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          admin:users!admin_id(email, name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (resourceFilter !== "all") {
        query = query.eq("resource_type", resourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data as AuditLog[];
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.action.toLowerCase().includes(searchLower) ||
            log.resource_type.toLowerCase().includes(searchLower) ||
            log.admin?.email?.toLowerCase().includes(searchLower)
        );
      }
      return filtered;
    }
  });

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-green-500/10 text-green-500";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-500/10 text-blue-500";
    if (action.includes("delete") || action.includes("remove")) return "bg-red-500/10 text-red-500";
    return "bg-muted text-muted-foreground";
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "user": return <User className="h-4 w-4" />;
      case "plan": return <CreditCard className="h-4 w-4" />;
      case "giveaway": return <Gift className="h-4 w-4" />;
      case "organization": return <Users className="h-4 w-4" />;
      case "content": return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const resourceTypes = [
    "all",
    "user",
    "plan",
    "giveaway",
    "promo_code",
    "organization",
    "content",
    "email_template",
    "settings"
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Audit & Transparency"
          description="Immutable record of administrative operations, identity traces, and system modifications."
          icon={History}
        />

        {/* Audit Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            label="Gross Events"
            value={logs?.length || 0}
            icon={Activity}
            color="text-indigo-500"
            gradient="from-indigo-500/10 to-transparent"
            delay={0}
          />
          <StatusCard
            label="Security Alerts"
            value={logs?.filter(l => l.action.includes('delete')).length || 0}
            icon={ShieldAlert}
            color="text-rose-500"
            gradient="from-rose-500/10 to-transparent"
            delay={0.05}
          />
          <StatusCard
            label="Active Entities"
            value={new Set(logs?.map(l => l.resource_type)).size}
            icon={Terminal}
            color="text-emerald-500"
            gradient="from-emerald-500/10 to-transparent"
            delay={0.1}
          />
          <StatusCard
            label="Unique Admins"
            value={new Set(logs?.map(l => l.admin_id)).size}
            icon={User}
            color="text-amber-500"
            gradient="from-amber-500/10 to-transparent"
            delay={0.15}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, resources, admins..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Resources" : type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : logs?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs found</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
                <div className="space-y-3">
                  {logs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {getResourceIcon(log.resource_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium truncate">{log.admin?.name || log.admin?.email || "Unknown"}</span>
                            <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {log.resource_type}
                            {log.resource_id && ` • ${log.resource_id.slice(0, 8)}...`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, HH:mm")}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Admin</p>
                                  <p className="font-medium">{log.admin?.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Action</p>
                                  <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Resource Type</p>
                                  <p className="font-medium">{log.resource_type}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Resource ID</p>
                                  <p className="font-medium font-mono text-sm">{log.resource_id || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Timestamp</p>
                                  <p className="font-medium">{format(new Date(log.created_at), "PPpp")}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">IP Address</p>
                                  <p className="font-medium font-mono text-sm">{log.ip_address || "N/A"}</p>
                                </div>
                              </div>
                              {log.old_value && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Previous Value</p>
                                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(log.old_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">New Value</p>
                                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.user_agent && (
                                <div>
                                  <p className="text-sm text-muted-foreground">User Agent</p>
                                  <p className="text-xs text-muted-foreground">{log.user_agent}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
