import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeConnectButtonProps {
    connectedId: string | null;
    onConnect?: () => void;
}

export function StripeConnectButton({ connectedId, onConnect }: StripeConnectButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                body: { action: 'connect_account' }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url; // Redirect to Stripe Onboarding
            }
        } catch (error: any) {
            console.error('Stripe connect error:', error);
            toast.error('Failed to initiate Stripe connection');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                body: { action: 'login_link' }
            });

            if (error) throw error;
            if (data?.url) {
                window.open(data.url, '_blank');
            }
        } catch (error: any) {
            toast.error('Failed to access Stripe dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (connectedId) {
        return (
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 py-1.5 px-3">
                    <CheckCircle className="w-3 h-3 mr-1.5" />
                    Payouts Enabled
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLogin} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Stripe Dashboard
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-[#635BFF] hover:bg-[#5851E3] text-white"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                // Stripe 'S' icon SVG
                <svg viewBox="0 0 32 32" className="w-4 h-4 mr-2 fill-white">
                    <path d="M14.2 27.2v-8.8C10 18 8 16.5 8 13.9c0-3.3 3.6-4.6 9-4.7l.4-3.4C11.9 6.2 9.5 7.1 7.6 8.3L6 3.9C9.2 2.3 12.5 1.7 16 1.7c7 0 10.9 3.5 10.9 9 0 6.6-9.1 7.5-9.1 10.5 0 1.2 1.3 1.9 3.7 1.8 2.5-.1 4.7-.8 6.6-2l1.6 4.3c-2.8 1.4-6.3 2-9.7 2-7.2-.1-11.2-3.8-11.2-9.1 0-5.8 8.9-7.1 8.9-10.2 0-1-.9-1.5-2.9-1.4-2.2 0-4.1.5-5.3 1.2l-.3 3.5c-4 0-6.9 1.9-6.9 4.8 0 3 2.5 4.9 6.7 4.9v6.2c-4.9.9-8 4.2-8 8.6 0 5.4 4.5 9 13 9 7.7 0 12.6-3 12.6-9.1 0-3.4-1.9-6.3-5-7.9l-1.4 4.1c1.8 1 2.8 2.5 2.8 4.3 0 3.2-2.7 4.9-8.7 4.9-3.9 0-6.4-1.5-6.4-4 0-1.8 1.4-3.4 3.7-3.9z" />
                </svg>
            )}
            Connect with Stripe
        </Button>
    );
}
