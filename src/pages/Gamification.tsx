import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHupScore, HupScoreData, getLeaderboard, Badge, Achievement } from "@/lib/hup-score";
import { Trophy, Zap, Star, Medal, Users, TrendingUp, Award, Progress as ProgressIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function GamificationPage() {
    const { user } = useAuth();
    const [data, setData] = useState<HupScoreData | null>(null);
    const [leaderboard, setLeaderboard] = useState<{ userId: string; username: string; score: number; level: number; avatarUrl: string | null }[]>([]);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        if (!user) return;
        getUserHupScore(user.id).then(setData);
        getLeaderboard().then(setLeaderboard);
    }, [user]);

    if (!data) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading gamification data...</p>
                </div>
            </div>
        );
    }

    const xpProgress = Math.min(100, (data.xp / data.nextLevelThreshold) * 100);
    const unlockedBadges = data.badges.filter(b => b.unlockedAt);
    const lockedBadges = data.badges.filter(b => !b.unlockedAt);
    const completedAchievements = data.achievements.filter(a => a.completed);
    const inProgressAchievements = data.achievements.filter(a => !a.completed);

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Gamification Center</h1>
                    <p className="text-gray-400">Track your progress, unlock achievements, and compete with friends</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Profile Tab */}
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Trophy className="w-4 h-4 mr-2" />
                            My Profile
                        </TabsTrigger>
                        <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Award className="w-4 h-4 mr-2" />
                            Badges
                        </TabsTrigger>
                        <TabsTrigger value="achievements" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Star className="w-4 h-4 mr-2" />
                            Achievements
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Users className="w-4 h-4 mr-2" />
                            Leaderboard
                        </TabsTrigger>
                    </TabsList>

                    {/* My Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-white/60">Total Score</p>
                                        <h3 className="text-3xl font-bold text-white">{data.score}</h3>
                                    </div>
                                    <Trophy className="w-12 h-12 text-primary" />
                                </div>
                                <Progress value={(data.score / 10000) * 100} className="h-2 bg-white/10" />
                            </Card>

                            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-white/60">Current Level</p>
                                        <h3 className="text-3xl font-bold text-white">{data.level}</h3>
                                    </div>
                                    <Star className="w-12 h-12 text-yellow-400" />
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-white/60">Total XP</p>
                                        <h3 className="text-3xl font-bold text-white">{data.xp}</h3>
                                    </div>
                                    <Zap className="w-12 h-12 text-emerald-400" />
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-white/60">Badges Unlocked</p>
                                        <h3 className="text-3xl font-bold text-white">{unlockedBadges.length}</h3>
                                    </div>
                                    <Medal className="w-12 h-12 text-purple-400" />
                                </div>
                            </Card>
                        </div>

                        {/* Level Progress */}
                        <Card className="bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">Level {data.level} Progress</h3>
                                <span className="text-sm text-white/60">
                                    {data.xp} / {data.nextLevelThreshold} XP
                                </span>
                            </div>
                            <Progress value={xpProgress} className="h-4 bg-white/10" />
                            <div className="mt-2 text-sm text-white/60">
                                {Math.round(data.nextLevelThreshold - data.xp)} XP needed to reach Level {data.level + 1}
                            </div>
                        </Card>

                        {/* Activity Metrics */}
                        <Card className="bg-white/5 border border-white/10 p-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Activity Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-white/60">Logins</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{data.metrics.logins}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-green-400" />
                                        <span className="text-xs text-white/60">Invites</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{data.metrics.invites}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs text-white/60">Matches</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{data.metrics.matches}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-white/60">Content Created</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{data.metrics.content_created}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="w-4 h-4 text-red-400" />
                                        <span className="text-xs text-white/60">Map Interactions</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{data.metrics.map_interaction}</span>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Badges Tab */}
                    <TabsContent value="badges" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Your Badges</h3>
                            <span className="text-sm text-white/60">
                                {unlockedBadges.length} of {data.badges.length} unlocked
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {data.badges.map(badge => (
                                <BadgeCard key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </TabsContent>

                    {/* Achievements Tab */}
                    <TabsContent value="achievements" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Your Achievements</h3>
                            <span className="text-sm text-white/60">
                                {completedAchievements.length} of {data.achievements.length} completed
                            </span>
                        </div>

                        <div className="space-y-4">
                            {data.achievements.map(achievement => (
                                <AchievementCard key={achievement.id} achievement={achievement} />
                            ))}
                        </div>
                    </TabsContent>

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Global Leaderboard</h3>
                            <span className="text-sm text-white/60">Top 100 users</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {leaderboard.map((entry, index) => (
                                        <tr key={entry.userId} className="hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                                                        index === 0 ? 'bg-yellow-500 text-black' :
                                                        index === 1 ? 'bg-gray-300 text-black' :
                                                        index === 2 ? 'bg-amber-600 text-white' :
                                                        'bg-white/10 text-white'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        src={entry.avatarUrl || 'https://picsum.photos/200'}
                                                        alt={entry.username}
                                                        className="w-8 h-8 rounded-full mr-3"
                                                    />
                                                    <div className="text-sm font-medium text-white">{entry.username}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{entry.level}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{entry.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function BadgeCard({ badge }: { badge: Badge }) {
    return (
        <Card className={`p-6 transition-all duration-300 ${
            badge.unlockedAt ? 'bg-white/5 border border-white/10' : 'bg-white/2 border border-white/5 opacity-60'
        } hover:scale-105`}>
            <div className="text-center">
                <div className={`text-4xl mb-3 ${
                    badge.rarity === 'common' ? 'text-gray-400' :
                    badge.rarity === 'uncommon' ? 'text-green-400' :
                    badge.rarity === 'rare' ? 'text-blue-400' :
                    badge.rarity === 'epic' ? 'text-purple-400' :
                    'text-yellow-400'
                }`}>
                    {badge.icon}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{badge.name}</h4>
                <p className="text-xs text-white/60 mb-2">{badge.description}</p>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    badge.rarity === 'common' ? 'bg-gray-400/20 text-gray-400' :
                    badge.rarity === 'uncommon' ? 'bg-green-400/20 text-green-400' :
                    badge.rarity === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                    badge.rarity === 'epic' ? 'bg-purple-400/20 text-purple-400' :
                    'bg-yellow-400/20 text-yellow-400'
                }`}>
                    {badge.rarity}
                </div>
                {!badge.unlockedAt && (
                    <p className="text-xs text-red-400 mt-2">Locked</p>
                )}
            </div>
        </Card>
    );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
    const progressPercent = (achievement.progress / achievement.total) * 100;

    return (
        <Card className="bg-white/5 border border-white/10 p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{achievement.title}</h4>
                    <p className="text-sm text-white/60">{achievement.description}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-white/60 mb-1">{achievement.xpReward} XP</div>
                    <div className="text-xs text-white/50">{achievement.progress} / {achievement.total}</div>
                </div>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/10" />
            {achievement.completed && (
                <div className="mt-2 flex items-center text-sm text-green-400">
                    <Star className="w-4 h-4 mr-2" />
                    Completed
                </div>
            )}
        </Card>
    );
}
