import { useState } from 'react';
import { useSafety } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, ShieldOff, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PanicButtonProps {
    variant?: 'floating' | 'inline';
    location?: { lat: number; lng: number };
}

export function PanicButton({ variant = 'inline', location }: PanicButtonProps) {
    const { panicActive, loading, triggerPanic, deactivatePanic } = useSafety();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handlePanic = async () => {
        await triggerPanic(location, { source: 'panic_button' });
        setConfirmOpen(false);
    };

    if (variant === 'floating') {
        return (
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="icon"
                        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-xl ${panicActive ? 'animate-pulse bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {panicActive ? <ShieldOff className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            {panicActive ? 'Deactivate Panic Mode?' : 'Activate Panic Mode?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {panicActive
                                ? 'This will restore your visibility and allow others to see your location again.'
                                : 'This will immediately hide your location from everyone and make you invisible on the map. Use this if you feel unsafe.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={panicActive ? deactivatePanic : handlePanic}
                            className={panicActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {panicActive ? 'Deactivate' : 'Activate Panic Mode'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Inline variant
    return (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={panicActive ? 'outline' : 'destructive'}
                    className={`gap-2 ${panicActive ? 'border-orange-500 text-orange-500' : ''}`}
                >
                    {panicActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    {panicActive ? 'Panic Mode Active' : 'Panic Button'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {panicActive ? 'Deactivate Panic Mode?' : 'Activate Panic Mode?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {panicActive
                            ? 'This will restore your visibility and allow others to see your location again.'
                            : 'This will immediately hide your location from everyone and make you invisible on the map. Use this if you feel unsafe.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={panicActive ? deactivatePanic : handlePanic}
                        className={panicActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {panicActive ? 'Deactivate' : 'Activate'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
