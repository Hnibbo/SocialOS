import { useState, useEffect } from "react";

import {
  Users,
  Search,
  MoreVertical,
  UserMinus,
  Crown,
  Loader2,
  Mail,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  referral_code: string | null;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { UserPlus, Filter } from "lucide-react";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, UserRole[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch from public.user_profiles (Social Source of Truth)
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Map user_profiles to UI User interface
      const mappedUsers: User[] = (usersData || []).map((p: any) => ({
        id: p.id,
        email: p.email || "No Email", // Backfilled now
        name: p.full_name || p.username || "Anonymous",
        created_at: p.created_at || new Date().toISOString(),
        referral_code: null // user_profiles might not have this yet
      }));

      setUsers(mappedUsers);

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        // If user_roles table missing or failed, just ignore for now to prevent crash
        console.warn("Could not fetch roles:", rolesError);
      } else {
        const rolesMap = new Map<string, UserRole[]>();
        (rolesData || []).forEach((role) => {
          const existing = rolesMap.get(role.user_id) || [];
          existing.push(role as UserRole);
          rolesMap.set(role.user_id, existing);
        });
        setUserRoles(rolesMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !currentUser) return;

    setActionLoading(true);
    try {
      // Remove existing role if any
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      // Add new role if not "user" (default)
      if (selectedRole !== "none") {
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.id,
            role: selectedRole as "admin" | "moderator" | "user",
            granted_by: currentUser.id,
          });

        if (error) throw error;
      }

      toast.success(`Role updated for ${selectedUser.email}`);
      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const getUserRole = (userId: string): string => {
    const roles = userRoles.get(userId);
    if (!roles || roles.length === 0) return "user";
    if (roles.some((r) => r.role === "admin")) return "admin";
    if (roles.some((r) => r.role === "moderator")) return "moderator";
    return "user";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Moderator</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">User</Badge>;
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="User Directory"
          description="Manage global access controls, identity verification, and role assignments."
          icon={Users}
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </div>
          }
        />

        {/* Search & Bulk Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <Users className="w-4 h-4" />
            <span className="font-medium text-foreground">{users.length}</span> Total Users
          </div>
        </div>

        {/* Users List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 data-testid="loader" className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(getUserRole(user.id))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="user-actions-btn">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(getUserRole(user.id));
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to BAN ${user.name}? This cannot be undone from here.`)) {
                                try {
                                  const { error } = await supabase.rpc('admin_ban_user', { target_user_id: user.id });
                                  if (error) throw error;
                                  toast.success("User has been banned and hidden.");
                                  fetchUsers();
                                } catch (e: any) {
                                  toast.error(e.message);
                                }
                              }
                            }}
                          >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Ban User (God Mode)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-orange-500 focus:text-orange-500"
                            onClick={async () => {
                              if (confirm(`Deactivate ${user.name}? They will be hidden.`)) {
                                try {
                                  const { error } = await supabase.rpc('admin_deactivate_user', { target_user_id: user.id });
                                  if (error) throw error;
                                  toast.success("User deactivated.");
                                  fetchUsers();
                                } catch (e: any) {
                                  toast.error(e.message);
                                }
                              }
                            }}
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No special role</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRoleChange} disabled={actionLoading}>
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
