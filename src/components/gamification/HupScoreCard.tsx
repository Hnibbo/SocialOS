
import { useEffect, useState } from "react";
import { getUserHupScore, HupScoreData } from "@/lib/hup-score";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HupScoreCard() {
    const { user } = useAuth();
    const [data, setData] = useState<HupScoreData | null>(null);

    useEffect(() => {
        if (!user) return;
        getUserHupScore(user.id).then(setData);
    }, [user]);

    if (!data) return <div className="text-white">Loading Score...</div>;

    const progress = Math.min(100, (data.score / data.nextLevelThreshold) * 100);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                            {data.score}
                            <span className="text-sm font-normal text-white/50">Hup Score</span>
                        </h2>
                        <p className="text-xs text-primary font-medium tracking-wider uppercase">Level {data.level} Citizen</p>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-white/50">
                        <span>Progress to Level {data.level + 1}</span>
                        <span>{data.score} / {data.nextLevelThreshold}</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-white/60">Activity</span>
                        </div>
                        <span className="text-lg font-bold text-white">{data.metrics.map_interaction || 0}</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Share2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-white/60">Invites</span>
                        </div>
                        <span className="text-lg font-bold text-white">{data.metrics.invites || 0}</span>
                    </div>
                </div>

                <Button className="w-full mt-6 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
                    Boost My Score
                </Button>
            </div>
        </div>
    );
}
