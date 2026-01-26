
import { useViralReferrals } from "@/hooks/useViralReferrals";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface InviteGateProps {
    children: React.ReactNode;
    requiredInvites: number;
    title?: string;
}

export default function InviteGate({ children, requiredInvites, title = "Locked Feature" }: InviteGateProps) {
    const { user } = useAuth();
    const { inviteCount, inviteCode, copyInviteLink, loading } = useViralReferrals(user?.id || '');
    const [copied, setCopied] = useState(false);

    if (loading) return <div className="text-white/50 animate-pulse">Checking access...</div>;

    if (inviteCount >= requiredInvites) {
        return <>{children}</>;
    }

    const handleCopy = () => {
        copyInviteLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative w-full h-full min-h-[300px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden group">

            {/* Blurred Background Hint */}
            <div className="absolute inset-0 opacity-10 blur-sm pointer-events-none grayscale">
                {/* Provide a hint of what's behind without showing it fully. */}
                {children}
            </div>

            <div className="bg-black/60 p-4 rounded-full border border-white/10 mb-4 shadow-2xl relative z-10">
                <Lock className="w-8 h-8 text-primary" />
            </div>

            <h3 className="text-2xl font-display font-bold text-white mb-2 relative z-10">{title}</h3>
            <p className="text-white/60 mb-6 max-w-sm relative z-10">
                This feature is exclusive to active citizens. Invite <span className="text-primary font-bold">{requiredInvites - inviteCount} more friends</span> to unlock.
            </p>

            <div className="flex items-center gap-2 w-full max-w-xs relative z-10">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/50 font-mono truncate">
                    hup.social/join?c={inviteCode}
                </div>
                <Button size="icon" onClick={handleCopy} className="bg-primary hover:bg-primary/90">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            <div className="mt-8 relative z-10 w-full max-w-xs">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                    <span>Progress</span>
                    <span>{inviteCount} / {requiredInvites} Invites</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(inviteCount / requiredInvites) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
