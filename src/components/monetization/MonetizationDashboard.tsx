import { useMonetization } from '@/hooks/useMonetization';
import { StripeConnectButton } from './StripeConnectButton';
import { SubscriptionCard } from './SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, DollarSign, Wallet, CreditCard } from 'lucide-react';

export function MonetizationDashboard() {
    const {
        subscription,
        plans,
        connectId,
        loading,
        balance,
        transactions
    } = useMonetization();

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Monetization & Billing</h2>
                <p className="text-muted-foreground">Manage your subscription and payout settings.</p>
            </div>

            <Tabs defaultValue="subscription" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="subscription">My Plan</TabsTrigger>
                    <TabsTrigger value="earnings">Creator Earnings</TabsTrigger>
                    <TabsTrigger value="billing">Billing History</TabsTrigger>
                </TabsList>

                <TabsContent value="subscription" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {plans.map(plan => (
                            <SubscriptionCard
                                key={plan.id}
                                plan={plan}
                                currentPlanId={subscription?.plan_id}
                                onSubscribe={() => { /* handled inside */ }}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Account</CardTitle>
                            <CardDescription>
                                Connect your Stripe account to receive payouts from flexible earnings, tips, and sales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                <div className="space-y-1">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-primary" />
                                        Stripe Connect Status
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {connectId ? 'Your account is connected and ready for payouts.' : 'Link your bank account to start earning.'}
                                    </p>
                                </div>
                                <StripeConnectButton connectedId={connectId} />
                            </div>

                            {connectId && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Available to Payout</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">${balance.available.toFixed(2)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-muted-foreground">${balance.pending.toFixed(2)}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>View your past transactions and payment history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    transaction.amount > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                }`}>
                                                    {transaction.amount > 0 ? '+' : '-'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{transaction.description || transaction.type}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(transaction.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`font-medium ${
                                                transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
