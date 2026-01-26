import { useState, useEffect } from "react";
import {
    Building2,
    Search,
    MoreHorizontal,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink
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

interface Business {
    id: string;
    name: string;
    description: string;
    category: string;
    location: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    created_at: string;
    owner?: { email: string };
}

export default function AdminBusinesses() {
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*, owner:user_profiles!businesses_owner_id_fkey(email)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Fetch businesses error:", error);
                toast.error("Failed to fetch businesses");
            } else {
                setBusinesses((data as any) || []);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("A system error occurred");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setBusinesses(businesses.map(b => b.id === id ? { ...b, status: status as any } : b));
            toast.success(`Business ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
            console.error(error);
        }
    };

    const filtered = businesses.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 space-y-8">
                <AdminPageHeader
                    title="Business Registry"
                    description="Verify and manage business entities on the Social App map."
                    icon={Building2}
                />

                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                        <Input
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 rounded-xl bg-background/50 border-border/50"
                        />
                    </div>
                </div>

                <Card className="bg-gradient-card">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((business) => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{business.name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{business.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{business.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {business.location || "Online"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{business.owner?.email || "Unknown"}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                business.status === 'approved' ? 'default' :
                                                    business.status === 'rejected' ? 'destructive' :
                                                        'secondary'
                                            } className={
                                                business.status === 'approved' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' :
                                                    business.status === 'pending' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : ''
                                            }>
                                                {business.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(business.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => updateStatus(business.id, 'approved')}>
                                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus(business.id, 'rejected')}>
                                                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus(business.id, 'suspended')}>
                                                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                                                        Suspend
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No businesses found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
