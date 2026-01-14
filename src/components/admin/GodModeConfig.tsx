import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Send, Cpu, ShieldAlert, Wifi, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
    id: string;
    type: "user" | "system" | "error" | "warning" | "success";
    content: string;
    timestamp: Date;
    data?: any;
}

export default function GodModeConfig() {
    const [input, setInput] = useState("");
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            id: "init",
            type: "system",
            content: "GOD MODE SYSTEM INITIALIZED... v2.0.4",
            timestamp: new Date(),
        },
        {
            id: "init-2",
            type: "system",
            content: "Connected to Neural Core. Waiting for command...",
            timestamp: new Date(),
        },
    ]);
    const [processing, setProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [logs]);

    const handleCommand = async () => {
        if (!input.trim()) return;

        const userCmd = input;
        setInput("");

        // Add User Command to Log
        addLog("user", `> ${userCmd}`);
        setProcessing(true);

        try {
            // Call the Edge Function
            const { data, error } = await supabase.functions.invoke('admin-agent', {
                body: { command: userCmd }
            });

            if (error) throw error;

            // Add System Response
            addLog(data.type || "success", data.message, data.data);

        } catch (err: any) {
            addLog("error", `EXECUTION FAILURE: ${err.message || "Unknown Error"}`);
        } finally {
            setProcessing(false);
        }
    };

    const addLog = (type: LogEntry["type"], content: string, data?: any) => {
        setLogs((prev) => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                type,
                content,
                timestamp: new Date(),
                data
            },
        ]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleCommand();
        }
    };

    return (
        <AdminLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <Terminal className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-foreground">God Mode Engine</h1>
                            <p className="text-muted-foreground text-sm">Direct Neural Interface to SocialOS Core</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-500 font-mono">
                            <Wifi className="w-3 h-3" />
                            ONLINE
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-500 font-mono">
                            <Cpu className="w-3 h-3" />
                            AI ACTIVE
                        </div>
                    </div>
                </div>

                {/* Terminal Window */}
                <Card className="flex-1 bg-black/90 border-primary/20 shadow-2xl shadow-primary/5 flex flex-col overflow-hidden font-mono relative">
                    {/* CRT Scanline Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10"></div>

                    {/* Output Area */}
                    <ScrollArea className="flex-1 p-6 z-0" ref={scrollRef}>
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className={`flex flex-col gap-1 animate-in slide-in-from-left-2 duration-300`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-xs text-muted-foreground mt-1 min-w-[60px]">
                                            {log.timestamp.toLocaleTimeString([], { hour12: false })}
                                        </span>
                                        <div className={`flex-1 break-words text-sm md:text-base ${log.type === "user" ? "text-primary font-bold" :
                                            log.type === "error" ? "text-red-500" :
                                                log.type === "warning" ? "text-yellow-500" :
                                                    "text-gray-300"
                                            }`}>
                                            {log.content}
                                        </div>
                                    </div>
                                    {/* Structured Data View */}
                                    {log.data && (
                                        <div className="ml-[72px] p-3 bg-white/5 border border-white/10 rounded-md text-xs text-green-400 overflow-x-auto">
                                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {processing && (
                                <div className="flex items-center gap-2 ml-[72px] text-primary animate-pulse">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs">PROCESSING INTENT...</span>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 bg-white/5 border-t border-white/10 flex gap-4 z-20">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">{">"}</span>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter command (e.g., 'find users', 'count profiles')..."
                                className="pl-8 bg-black/50 border-primary/30 text-primary placeholder:text-primary/30 font-mono focus-visible:ring-primary/50"
                                autoFocus
                            />
                        </div>
                        <Button
                            onClick={handleCommand}
                            disabled={processing || !input.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Quick Command Palette */}
                    <div className="p-3 bg-black/80 border-t border-white/10 flex gap-2 overflow-x-auto">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-mono"
                            onClick={() => setInput("nuke user <id>")}>
                            <ShieldAlert className="w-3 h-3 mr-1" /> NUKE
                        </Button>
                        <Button variant="ghost" size="sm" className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 text-xs font-mono"
                            onClick={() => setInput("broadcast 'System Alert: '")}>
                            <Wifi className="w-3 h-3 mr-1" /> BROADCAST
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400 hover:bg-green-500/10 text-xs font-mono"
                            onClick={() => setInput("mint 1000 hup to <id>")}>
                            <Zap className="w-3 h-3 mr-1" /> MINT HUP
                        </Button>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
