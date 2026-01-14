import { useState, useEffect } from "react";
import {
    DollarSign,
    Clock,
    XCircle,
    Loader2,
    ExternalLink,
    ArrowUpRight,
    Search,
    RefreshCw,
    ArrowRightLeft,
    Banknote
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";

interface Withdrawal {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    stripe_transfer_id: string | null;
    created_at: string;
    name?: string | null;
    email?: string;
    stripe_connect_id?: string | null;
}


export default function AdminPayouts() {
    const [loading, setLoading] = useState(true);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("withdrawals")
                .select(`
                    *,
                    user_profiles (
                        email,
                        full_name,
                        stripe_connect_accounts (
                            stripe_account_id
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const transformed = (data || []).map((w: any) => ({
                ...w,
                name: w.user_profiles?.full_name,
                email: w.user_profiles?.email,
                stripe_connect_id: w.user_profiles?.stripe_connect_accounts?.[0]?.stripe_account_id
            }));

            setWithdrawals(transformed as Withdrawal[]);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast.error("Failed to load withdrawals");
        } finally {
            setLoading(false);
        }
    };


    const handleProcessPayout = async (withdrawal: Withdrawal) => {
        if (!withdrawal.stripe_connect_id) {
            toast.error("User has no connected Stripe account");
            return;
        }

        if (!confirm(`Process payout of ${withdrawal.amount} ${withdrawal.currency.toUpperCase()} to ${withdrawal.email}?`)) return;

        setProcessingId(withdrawal.id);
        const loadingToast = toast.loading("Executing secure transfer...");
        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                body: {
                    action: 'process-payout',
                    withdrawalId: withdrawal.id,
                    amount: withdrawal.amount,
                    destinationAccountId: withdrawal.stripe_connect_id,
                    currency: withdrawal.currency
                }
            });

            if (error) throw error;

            toast.success("Payout processed successfully", { id: loadingToast });
            fetchWithdrawals();
        } catch (error: unknown) {
            console.error("Payout error:", error);
            const message = error instanceof Error ? error.message : "Failed to process payout";
            toast.error(message, { id: loadingToast });
        } finally {
            setProcessingId(null);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w =>
        w.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.id.includes(searchQuery)
    );


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const stats = {
        pending: withdrawals.filter(w => w.status === 'pending').length,
        totalAmount: withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount), 0),
        pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 space-y-8">
                <AdminPageHeader
                    title="Financial Orchestration"
                    description="Orchestrate developer capital lifecycles, global transfers, and liquidity settlement."
                    icon={DollarSign}
                    actions={
                        <Button variant="outline" onClick={fetchWithdrawals} className="border-border/50 hover:bg-muted/50 rounded-xl">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Sync Ledger
                        </Button>
                    }
                />

                {/* Financial Intelligence Feed */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard
                        label="Pending Requests"
                        value={stats.pending}
                        icon={Clock}
                        color="text-amber-500"
                        gradient="from-amber-500/10 to-transparent"
                        delay={0}
                    />
                    <StatusCard
                        label="In-Flight Capital"
                        value={`$${stats.pendingAmount.toFixed(2)}`}
                        icon={ArrowRightLeft}
                        color="text-blue-500"
                        gradient="from-blue-500/10 to-transparent"
                        delay={0.05}
                    />
                    <StatusCard
                        label="Settled Volume"
                        value={`$${stats.totalAmount.toFixed(2)}`}
                        icon={Banknote}
                        color="text-emerald-500"
                        gradient="from-emerald-500/10 to-transparent"
                        delay={0.1}
                    />
                </div>

                {/* Search & Filter */}
                <Card className="bg-gradient-card border-border/50">
                    <CardHeader className="pb-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by email or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-muted/30 border-border/50"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Requested Date</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Stripe Account</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-50" />
                                                <p className="mt-2 text-muted-foreground">Loading withdrawals...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredWithdrawals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                No withdrawal requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredWithdrawals.map((withdrawal) => (
                                            <TableRow key={withdrawal.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="font-medium">
                                                    {format(new Date(withdrawal.created_at), "MMM d, yyyy HH:mm")}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{withdrawal.name || "No name"}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{withdrawal.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-lg">${Number(withdrawal.amount).toFixed(2)}</span>
                                                    <span className="ml-1 text-xs text-muted-foreground uppercase">{withdrawal.currency}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(withdrawal.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {withdrawal.stripe_connect_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">
                                                                {withdrawal.stripe_connect_id}
                                                            </Badge>
                                                            <a
                                                                href={`https://dashboard.stripe.com/connect/accounts/${withdrawal.stripe_connect_id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:text-primary/80 transition-colors"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-destructive flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" /> No account linked
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {withdrawal.status === 'pending' ? (
                                                        <Button
                                                            size="sm"
                                                            disabled={processingId === withdrawal.id || !withdrawal.stripe_connect_id}
                                                            onClick={() => handleProcessPayout(withdrawal)}
                                                            className="group"
                                                        >
                                                            {processingId === withdrawal.id ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <ArrowUpRight className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                                            )}
                                                            Process Payout
                                                        </Button>
                                                    ) : withdrawal.stripe_transfer_id ? (
                                                        <a
                                                            href={`https://dashboard.stripe.com/transfers/${withdrawal.stripe_transfer_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary hover:underline flex items-center justify-end gap-1"
                                                        >
                                                            View Transfer <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">--</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
