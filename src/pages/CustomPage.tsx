import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Sparkles, Zap, TrendingUp, Layout, Type, Image as ImageIcon, Columns, MousePointer2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

interface ContentBlock {
    id: string;
    type: 'hero' | 'text' | 'image' | 'features' | 'cta' | 'stats' | 'ai_widget';
    data: any;
}

interface PageData {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: ContentBlock[];
}

export default function CustomPage() {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('platform_pages')
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

            if (!error && data) {
                setPage(data);
            }
            setLoading(false);
        };

        fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark pt-24 px-4 flex flex-col items-center">
                <Skeleton className="w-64 h-12 mb-8 bg-white/5" />
                <Skeleton className="w-full max-w-4xl h-96 bg-white/5 rounded-3xl" />
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-dark pt-24 px-4 flex flex-col items-center justify-center text-center">
                <Layout className="w-20 h-20 mb-6 text-primary opacity-20" />
                <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Node Disconnected</h1>
                <p className="text-muted-foreground mb-8">The requested page matrix does not exist in the current OS version.</p>
                <ElectricButton onClick={() => window.location.href = '/'}>Return to Source</ElectricButton>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark pt-20 pb-20">
            <Helmet>
                <title>{page.title} | Social OS</title>
                <meta name="description" content={page.description || "The first Social Operating System."} />
            </Helmet>

            <div className="max-w-6xl mx-auto px-4 space-y-12">
                {page.content.map((block) => (
                    <div key={block.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {renderBlock(block)}
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderBlock(block: ContentBlock) {
    const { type, data } = block;

    switch (type) {
        case 'hero':
            return (
                <div className="text-center space-y-6 py-20 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                        {data.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto border-l-2 border-primary/40 pl-6 text-left md:text-center md:border-l-0 md:pl-0">
                        {data.subtitle}
                    </p>
                    <div className="pt-8">
                        <ElectricButton size="lg">{data.cta_text || 'Enter Matrix'}</ElectricButton>
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="prose prose-invert max-w-3xl mx-auto">
                    <p className="text-lg leading-relaxed font-medium opacity-80">
                        {data.body}
                    </p>
                </div>
            );

        case 'features':
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.items?.map((item: any, i: number) => (
                        <GlassCard key={i} className="p-8 hover:border-primary/40 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                        </GlassCard>
                    ))}
                </div>
            );

        case 'stats':
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.items?.map((item: any, i: number) => (
                        <div key={i} className="p-6 border-l-2 border-primary/20 bg-primary/5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">{item.label}</p>
                            <p className="text-3xl font-black italic tracking-tighter">{item.value}</p>
                        </div>
                    ))}
                </div>
            );

        case 'cta':
            return (
                <GlassCard className="p-12 text-center bg-primary/5 border-primary/20">
                    <h2 className="text-4xl font-black uppercase tracking-tight mb-6">{data.text}</h2>
                    <ElectricButton size="lg">{data.button_label}</ElectricButton>
                </GlassCard>
            );

        case 'image':
            return (
                <div className="rounded-3xl overflow-hidden border border-white/10 group">
                    <img src={data.url || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'} className="w-full aspect-[21/9] object-cover group-hover:scale-105 transition-transform duration-1000" />
                    {data.caption && <p className="p-4 text-xs font-bold uppercase tracking-widest opacity-50 text-center">{data.caption}</p>}
                </div>
            );

        case 'ai_widget':
            return (
                <GlassCard className="p-8 border-primary/20 bg-black/40">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight">Neural Interface</h3>
                            <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Active Status: Optimal</p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 h-32 flex items-center justify-center italic text-muted-foreground text-sm">
                        {data.prompt_hint}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-primary/50" placeholder="Type command..." />
                        <ElectricButton>Send</ElectricButton>
                    </div>
                </GlassCard>
            );

        default:
            return null;
    }
}
