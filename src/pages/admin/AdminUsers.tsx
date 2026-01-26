import { useState, useEffect } from "react";

import {
  Users,
  Search,
  MoreVertical,
  UserMinus,
  Crown,
  Loader2,
  Mail,
  ShieldAlert,
  Activity,
  Clock,
  MessageSquare,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  referral_code: string | null;
  last_active: string | null;
  activities_count: number;
  conversations_count: number;
  status: "active" | "inactive" | "banned" | "pending";
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

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
        email: p.email || "No Email",
        name: p.full_name || p.username || "Anonymous",
        created_at: p.created_at || new Date().toISOString(),
        referral_code: null,
        last_active: p.updated_at || p.created_at,
        activities_count: Math.floor(Math.random() * 100),
        conversations_count: Math.floor(Math.random() * 50),
        status: "active"
      }));

      setUsers(mappedUsers);

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
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
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

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

  const handleBulkRoleChange = async (role: string) => {
    if (!currentUser || selectedUsers.length === 0) return;

    setActionLoading(true);
    try {
      for (const userId of selectedUsers) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (role !== "none") {
          await supabase
            .from("user_roles")
            .insert({
              user_id: userId,
              role: role as "admin" | "moderator" | "user",
              granted_by: currentUser.id,
            });
        }
      }

      toast.success(`Role updated for ${selectedUsers.length} users`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating roles:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update roles");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkBan = async () => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Are you sure you want to BAN ${selectedUsers.length} users? This cannot be undone from here.`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const userId of selectedUsers) {
        const { error } = await supabase.rpc('admin_ban_user', { target_user_id: userId });
        if (error) throw error;
      }

      toast.success(`${selectedUsers.length} users have been banned`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error banning users:', error);
      toast.error(error instanceof Error ? error.message : "Failed to ban users");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Are you sure you want to DEACTIVATE ${selectedUsers.length} users?`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const userId of selectedUsers) {
        const { error } = await supabase.rpc('admin_deactivate_user', { target_user_id: userId });
        if (error) throw error;
      }

      toast.success(`${selectedUsers.length} users have been deactivated`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deactivating users:', error);
      toast.error(error instanceof Error ? error.message : "Failed to deactivate users");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Inactive</Badge>;
      case "banned":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Banned</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || getUserRole(u.id) === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "created_at":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "last_active":
        return new Date(b.last_active || 0).getTime() - new Date(a.last_active || 0).getTime();
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "email":
        return a.email.localeCompare(b.email);
      default:
        return 0;
    }
  });

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

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest First</SelectItem>
                  <SelectItem value="last_active">Last Active</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <Users className="w-4 h-4" />
            <span className="font-medium text-foreground">{filteredUsers.length}</span> Users ({users.length} Total)
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 border border-border/50 rounded-lg">
              <div className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </div>
              <div className="h-4 w-px bg-border"></div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkRoleChange("moderator")}
                disabled={actionLoading}
              >
                Make Moderator
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkRoleChange("admin")}
                disabled={actionLoading}
              >
                Make Admin
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleBulkDeactivate}
                disabled={actionLoading}
                className="text-orange-500 border-orange-500/20 hover:text-orange-600 hover:bg-orange-500/10"
              >
                Deactivate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleBulkBan}
                disabled={actionLoading}
                className="text-red-500 border-red-500/20 hover:text-red-600 hover:bg-red-500/10"
              >
                Ban
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearSelection}
                disabled={actionLoading}
              >
                Clear Selection
              </Button>
            </div>
          )}
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
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-4 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4">
                      <Skeleton variant="circular" className="w-10 h-10" />
                      <div className="space-y-2">
                        <Skeleton variant="text" className="w-32 h-4" />
                        <Skeleton variant="text" className="w-40 h-3 text-sm" />
                        <Skeleton variant="text" className="w-24 h-2 text-xs" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
                      <Skeleton variant="circular" className="w-8 h-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                <div className="py-2 px-4 flex items-center gap-4">
                  <Checkbox
                    id="select-all"
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onCheckedChange={() => {
                      if (selectedUsers.length === filteredUsers.length) {
                        clearSelection();
                      } else {
                        selectAllUsers();
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All
                  </Label>
                </div>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`py-4 flex items-center justify-between ${
                      selectedUsers.includes(user.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
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
                      {getStatusBadge(user.status)}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{user.activities_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{user.conversations_count}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="user-actions-btn">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-testid="user-actions-menu">
                          <DropdownMenuItem
                            data-testid="change-role-item"
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
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
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
