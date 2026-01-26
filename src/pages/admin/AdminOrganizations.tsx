import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Plus,
  Shield
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import OrganizationFormDialog from "@/components/admin/OrganizationFormDialog";
import OrgMembersDialog from "@/components/admin/OrgMembersDialog";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminOrganizations() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Fetch organizations error:", error);
        toast.error("Failed to fetch organizations");
      } else {
        setOrganizations((data as any) || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("A system error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete ${org.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      setOrganizations(organizations.filter(o => o.id !== org.id));
      toast.success("Organization deleted");
    } catch (error) {
      toast.error("Failed to delete organization");
      console.error(error);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormDialogOpen(true);
  };

  const handleViewMembers = (org: Organization) => {
    setSelectedOrg(org);
    setMembersDialogOpen(true);
  };

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.custom_domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <AdminPageHeader
          title="Organizations"
          description="Manage multi-tenant organizations and their settings."
          icon={Building2}
          actions={
            <Button onClick={() => setFormDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          }
        />

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl bg-background/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <Building2 className="w-4 h-4" />
            <span className="font-medium text-foreground">{organizations.length}</span> Total Organizations
          </div>
        </div>

        <Card className="bg-gradient-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.slug}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {org.custom_domain || "Not configured"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.is_active ? 'default' : 'destructive'} className={
                        org.is_active ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' :
                        'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      }>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(org)}>
                            <Edit className="w-4 h-4 mr-2 text-blue-500" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewMembers(org)}>
                            <Users className="w-4 h-4 mr-2 text-green-500" />
                            Manage Members
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(org)}>
                            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No organizations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Forms */}
        <OrganizationFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          initialData={editingOrg}
          onSuccess={() => {
            fetchOrganizations();
            setEditingOrg(null);
          }}
        />

        <OrgMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          organization={selectedOrg}
        />
      </div>
    </AdminLayout>
  );
}
