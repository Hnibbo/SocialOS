import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2, UserPlus, Search, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    role: string;
}

interface OrgMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organization: { id: string; name: string } | null;
}

export default function OrgMembersDialog({
    open,
    onOpenChange,
    organization,
}: OrgMembersDialogProps) {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!organization) return;
        setLoading(true);
        try {
            // Fetch users with their organization roles
            const { data: users, error: userError } = await supabase
                .from("users")
                .select("id, email, full_name, avatar_url, created_at")
                .eq("organization_id", organization.id);

            if (userError) throw userError;

            // Fetch organization roles for these users
            const userIds = (users || []).map(user => user.id);
            const { data: roles, error: roleError } = await supabase
                .from("organization_roles")
                .select("user_id, role")
                .eq("organization_id", organization.id)
                .in("user_id", userIds);

            if (roleError) throw roleError;

            // Combine users with their roles
            const membersWithRoles = (users || []).map(user => {
                const userRole = roles?.find(role => role.user_id === user.id);
                return {
                    ...user,
                    role: userRole?.role || "member"
                };
            });

            setMembers(membersWithRoles);
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to load organization members");
        } finally {
            setLoading(false);
        }
    }, [organization]);

    useEffect(() => {
        if (open && organization) {
            fetchMembers();
        }
    }, [open, organization, fetchMembers]);

    const removeMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user from the organization?")) return;

        try {
            // Remove from organization_roles table
            const { error: roleError } = await supabase
                .from("organization_roles")
                .delete()
                .eq("organization_id", organization?.id)
                .eq("user_id", userId);

            if (roleError) throw roleError;

            // Update user's organization_id
            const { error: userError } = await supabase
                .from("users")
                .update({ organization_id: null })
                .eq("id", userId);

            if (userError) throw userError;

            setMembers(members.filter(m => m.id !== userId));
            toast.success("User removed from organization");
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Failed to remove member");
        }
    };

    const updateMemberRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from("organization_roles")
                .upsert({
                    organization_id: organization?.id,
                    user_id: userId,
                    role: newRole
                });

            if (error) throw error;

            setMembers(members.map(member => 
                member.id === userId ? { ...member, role: newRole } : member
            ));
            toast.success("Role updated successfully");
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const inviteMember = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            // First check if user exists
            const { data: user, error: fetchError } = await supabase
                .from("users")
                .select("id, organization_id")
                .eq("email", inviteEmail)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (!user) {
                toast.error("User not found via email. They must sign up first.");
                return;
            }

            if (user.organization_id === organization?.id) {
                toast.error("User is already in this organization");
                return;
            }

            if (user.organization_id) {
                if (!confirm("This user belongs to another organization. Do you want to move them?")) return;
            }

            // Add to org
            const { error: updateError } = await supabase
                .from("users")
                .update({ organization_id: organization?.id })
                .eq("id", user.id);

            if (updateError) throw updateError;

            // Create a role entry for the user
            await supabase
                .from("organization_roles")
                .upsert({
                    organization_id: organization?.id,
                    user_id: user.id,
                    role: "member"
                });

            toast.success("User added to organization");
            setInviteEmail("");
            fetchMembers();
        } catch (error: unknown) {
            console.error("Error inviting member:", error);
            const message = error instanceof Error ? error.message : "Failed to add member";
            toast.error(message);
        } finally {
            setInviting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Members</DialogTitle>
                    <DialogDescription>
                        Users in <span className="font-semibold text-foreground">{organization?.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Add Member */}
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Enter user email to add..."
                                className="pl-10 h-10 transition-all focus:ring-2 focus:ring-primary/20 border-border/50"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && inviteMember()}
                            />
                        </div>
                        <Button
                            onClick={inviteMember}
                            disabled={inviting || !inviteEmail}
                            className="h-10 px-6 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-none border border-primary/20"
                        >
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                            Add User
                        </Button>
                    </div>

                    {/* Members List */}
                    <div className="border rounded-xl divide-y overflow-hidden max-h-[400px] overflow-y-auto bg-muted/20 border-border/50">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                                <p className="text-sm text-muted-foreground animate-pulse">Fetching members...</p>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <h4 className="font-medium mb-1">No members found</h4>
                                <p className="text-sm text-muted-foreground">Invite users via email to get started.</p>
                            </div>
                        ) : (
                            members.map((member, index) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                                            <AvatarImage src={member.avatar_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {member.email?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm leading-none">{member.full_name || 'Unnamed User'}</p>
                                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 opacity-50" />
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Select 
                                            value={member.role} 
                                            onValueChange={(value) => updateMemberRole(member.id, value)}
                                        >
                                            <SelectTrigger className="w-28 h-8 text-xs">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="owner">Owner</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                                            onClick={() => removeMember(member.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
