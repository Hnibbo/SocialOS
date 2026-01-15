import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Plus,
    Save,
    Layout,
    Type,
    Image as ImageIcon,
    Columns,
    MousePointer2,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    Globe,
    Settings2,
    Layers,
    Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentBlock {
    id: string;
    type: 'hero' | 'text' | 'image' | 'features' | 'cta' | 'stats' | 'ai_widget';
    data: any;
}

interface Page {
    id: string;
    slug: string;
    title: string;
    is_published: boolean;
    content: ContentBlock[];
    description?: string;
    metadata?: any;
}

const BLOCK_TEMPLATES: Record<ContentBlock['type'], any> = {
    hero: { title: 'Elevate Your Reality', subtitle: 'The first Social Operating System.', cta_text: 'Get Started', bg_image: '' },
    text: { body: 'Start typing your story here...' },
    image: { url: '', caption: 'New OS Artifact' },
    features: { items: [{ icon: 'Zap', title: 'Speed', description: 'Faster than thought.' }] },
    cta: { text: 'Join the Revolution', button_label: 'Connect Now' },
    stats: { items: [{ label: 'Nodes', value: '1M+' }] },
    ai_widget: { prompt_hint: 'Ask the OS anything...', feature_ref: 'support_bot' }
};

export default function AdminContentBuilder() {
    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        const { data, error } = await supabase
            .from('platform_pages')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) toast.error('Failed to load pages');
        else setPages(data || []);
        setLoading(false);
    };

    const addPage = async () => {
        const newPage = {
            slug: `new-page-${Date.now()}`,
            title: 'Untitled Page',
            content: [] as ContentBlock[],
            is_published: false
        };

        const { data, error } = await supabase
            .from('platform_pages')
            .insert(newPage)
            .select()
            .single();

        if (error) toast.error('Failed to create page');
        else {
            setPages([data, ...pages]);
            setSelectedPage(data);
        }
    };

    const deletePage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Permanent deletion of this page protocol?')) return;

        const { error } = await supabase
            .from('platform_pages')
            .delete()
            .eq('id', id);

        if (error) toast.error('Deletion failed');
        else {
            toast.success('Page purged from network');
            if (selectedPage?.id === id) setSelectedPage(null);
            fetchPages();
        }
    };

    const savePage = async () => {
        if (!selectedPage) return;
        setSaving(true);

        const { error } = await supabase
            .from('platform_pages')
            .update({
                title: selectedPage.title,
                slug: selectedPage.slug,
                content: selectedPage.content,
                description: selectedPage.description,
                is_published: selectedPage.is_published,
                metadata: selectedPage.metadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedPage.id);

        if (error) toast.error('Failed to save page');
        else {
            toast.success('Page deployed successfully');
            fetchPages();
        }
        setSaving(false);
    };

    const addBlock = (type: ContentBlock['type']) => {
        if (!selectedPage) return;
        const newBlock: ContentBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            data: { ...BLOCK_TEMPLATES[type] }
        };
        setSelectedPage({
            ...selectedPage,
            content: [...selectedPage.content, newBlock]
        });
    };

    const updateBlockData = (blockId: string, newData: any) => {
        if (!selectedPage) return;
        setSelectedPage({
            ...selectedPage,
            content: selectedPage.content.map(b => b.id === blockId ? { ...b, data: { ...b.data, ...newData } } : b)
        });
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (!selectedPage) return;
        const newContent = [...selectedPage.content];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newContent.length) return;
        [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
        setSelectedPage({ ...selectedPage, content: newContent });
    };

    const removeBlock = (index: number) => {
        if (!selectedPage) return;
        const newContent = [...selectedPage.content];
        newContent.splice(index, 1);
        setSelectedPage({ ...selectedPage, content: newContent });
    };

    if (loading) return <div className="p-8 text-center">Inhaling page matrix...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar: Page List */}
            <div className="w-full lg:w-64 space-y-4">
                <Button onClick={addPage} className="w-full justify-start gap-2 shadow-lg shadow-primary/10">
                    <Plus className="w-4 h-4" /> New Page
                </Button>
                <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2">
                    {pages.map(page => (
                        <Card
                            key={page.id}
                            className={cn(
                                "cursor-pointer hover:border-primary/50 transition-all",
                                selectedPage?.id === page.id ? "border-primary bg-primary/5" : "border-white/5"
                            )}
                            onClick={() => setSelectedPage(page)}
                        >
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold truncate max-w-[120px]">{page.title}</span>
                                    <div className="flex items-center gap-1">
                                        <Badge variant={page.is_published ? "default" : "outline"} className="text-[8px] h-4">
                                            {page.is_published ? 'Live' : 'Draft'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500/50 hover:text-red-500" onClick={(e) => deletePage(page.id, e)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <code className="text-[10px] text-muted-foreground">/p/{page.slug}</code>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Main Area: Builder */}
            {selectedPage ? (
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-4">
                            <Input
                                value={selectedPage.title}
                                onChange={e => setSelectedPage({ ...selectedPage, title: e.target.value })}
                                className="text-2xl font-black bg-transparent border-none p-0 focus-visible:ring-0 w-auto min-w-[200px]"
                            />
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">/p/</span>
                                <input
                                    value={selectedPage.slug}
                                    onChange={e => setSelectedPage({ ...selectedPage, slug: e.target.value })}
                                    className="bg-transparent border-none text-[10px] font-mono outline-none w-32"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 mr-4">
                                <Label className="text-xs">Published</Label>
                                <input
                                    type="checkbox"
                                    checked={selectedPage.is_published}
                                    onChange={e => setSelectedPage({ ...selectedPage, is_published: e.target.checked })}
                                    className="w-4 h-4 accent-primary"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.open(`/p/${selectedPage.slug}`, '_blank')}>
                                <Eye className="w-4 h-4 mr-2" /> Preview
                            </Button>
                            <Button size="sm" onClick={savePage} disabled={saving}>
                                <Save className="w-4 h-4 mr-2" /> {saving ? 'Deploying...' : 'Deploy OS Page'}
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="bg-white/5 p-1 mb-4 self-start rounded-xl border border-white/5">
                            <TabsTrigger value="content" className="text-[10px] font-black uppercase tracking-widest px-4">OS Content</TabsTrigger>
                            <TabsTrigger value="metadata" className="text-[10px] font-black uppercase tracking-widest px-4">SEO & Metadata</TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                                {/* Editor Canvas */}
                                <div className="lg:col-span-3 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                    {selectedPage.content.length === 0 ? (
                                        <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-20">
                                            <Layout className="w-12 h-12 mb-4" />
                                            <p className="font-black uppercase tracking-widest text-xs">Page Matrix Empty. Add blocks to initialize.</p>
                                        </div>
                                    ) : (
                                        selectedPage.content.map((block, index) => (
                                            <GlassCard key={block.id} className="relative group p-0 overflow-hidden border-white/5 hover:border-primary/20 transition-all">
                                                <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Layers className="w-3 h-3 text-primary" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{block.type} Block</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(index, 'up')}><ChevronUp className="w-3 h-3" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(index, 'down')}><ChevronDown className="w-3 h-3" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-500/10" onClick={() => removeBlock(index)}><Trash2 className="w-3 h-3" /></Button>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    {/* Dynamic Block Form */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {Object.entries(block.data).map(([key, val]: [string, any]) => (
                                                            <div key={key} className={cn("space-y-2", Array.isArray(val) && "col-span-2")}>
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{key.replace('_', ' ')}</Label>
                                                                {typeof val === 'string' ? (
                                                                    <Input
                                                                        value={val}
                                                                        onChange={e => updateBlockData(block.id, { [key]: e.target.value })}
                                                                        className="h-8 text-xs bg-white/5 border-white/10"
                                                                    />
                                                                ) : Array.isArray(val) ? (
                                                                    <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                                                        {val.map((item, i) => (
                                                                            <div key={i} className="flex gap-4 items-end border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                                                                {Object.entries(item).map(([iKey, iVal]: [string, any]) => (
                                                                                    <div key={iKey} className="flex-1 space-y-1">
                                                                                        <Label className="text-[8px] font-bold uppercase opacity-50">{iKey}</Label>
                                                                                        <Input
                                                                                            value={iVal}
                                                                                            onChange={e => {
                                                                                                const newArray = [...val];
                                                                                                newArray[i] = { ...item, [iKey]: e.target.value };
                                                                                                updateBlockData(block.id, { [key]: newArray });
                                                                                            }}
                                                                                            className="h-7 text-[10px] bg-white/5 border-white/5"
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-red-500"
                                                                                    onClick={() => {
                                                                                        const newArray = val.filter((_, idx) => idx !== i);
                                                                                        updateBlockData(block.id, { [key]: newArray });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="w-full h-8 text-[10px] border-dashed border-white/10"
                                                                            onClick={() => {
                                                                                const template = val[0] ? { ...val[0] } : { title: '', description: '' };
                                                                                Object.keys(template).forEach(k => template[k] = '');
                                                                                updateBlockData(block.id, { [key]: [...val, template] });
                                                                            }}
                                                                        >
                                                                            <Plus className="w-3 h-3 mr-2" /> Add Item
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-2 bg-white/5 rounded-lg text-xs opacity-50 italic">Object Editing Not Yet Implemented</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        ))
                                    )}
                                </div>

                                {/* Block Toolbox */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Block Library</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'hero', icon: Layout, label: 'Hero Header' },
                                            { id: 'text', icon: Type, label: 'Rich Text' },
                                            { id: 'image', icon: ImageIcon, label: 'OS Artifact (Image)' },
                                            { id: 'features', icon: Columns, label: 'Feature Grid' },
                                            { id: 'cta', icon: MousePointer2, label: 'Call to Action' },
                                            { id: 'stats', icon: Settings2, label: 'Live Stats' },
                                            { id: 'ai_widget', icon: Bot, label: 'AI Interface' },
                                        ].map(t => (
                                            <Button
                                                key={t.id}
                                                variant="outline"
                                                className="justify-start gap-3 h-12 border-white/5 bg-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold text-xs"
                                                onClick={() => addBlock(t.id as any)}
                                            >
                                                <t.icon className="w-4 h-4 text-primary" />
                                                {t.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                    </TabsContent>

                    <TabsContent value="metadata">
                        <Card className="glass-panel border-white/5 max-w-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Network Node Metadata</CardTitle>
                                <CardDescription>Optimize this page for neural indexing and social sharing.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase opacity-50">Page Description</Label>
                                    <textarea
                                        value={selectedPage.description || ''}
                                        onChange={e => setSelectedPage({ ...selectedPage, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary transition-all min-h-[100px]"
                                        placeholder="Enter a brief summary for search engines..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase opacity-50">Theme Aura</Label>
                                        <Input
                                            value={selectedPage.metadata?.aura || ''}
                                            onChange={e => setSelectedPage({ ...selectedPage, metadata: { ...selectedPage.metadata, aura: e.target.value } })}
                                            placeholder="e.g., electric-violet"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase opacity-50">Social Media Asset (URL)</Label>
                                        <Input
                                            value={selectedPage.metadata?.image || ''}
                                            onChange={e => setSelectedPage({ ...selectedPage, metadata: { ...selectedPage.metadata, image: e.target.value } })}
                                            placeholder="https://..."
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <Layout className="w-20 h-20 mb-6" />
                <p className="text-xl font-black italic uppercase tracking-tighter">Initialize Page Protocol</p>
                <p className="text-sm mt-2">Select a page or create a new one to begin designing.</p>
            </div>
        )}
    </div>
    );
}

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl", className)}>
        {children}
    </div>
);
