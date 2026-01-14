import { useState, useRef, useEffect } from 'react';
import { useRandomChat } from '@/hooks/useRandomChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, User, Send, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RandomChat() {
    const {
        inQueue,
        chatId,
        messages,
        joinQueue,
        leaveQueue,
        sendMessage,
        leaveChat
    } = useRandomChat();

    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="w-full max-w-md mx-auto h-[600px] relative">
            <AnimatePresence mode="wait">
                {!chatId && !inQueue && (
                    <motion.div
                        key="start"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center h-full text-center space-y-6"
                    >
                        <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full mb-4 ring-1 ring-white/10">
                            <MessageCircle className="w-16 h-16 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Random Chat</h2>
                            <p className="text-gray-400 max-w-xs">Connect instantly with someone nearby or around the world. Anonymous and safe.</p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                                onClick={() => joinQueue(['general'])}
                            >
                                Start Chat
                            </Button>
                        </div>
                    </motion.div>
                )}

                {inQueue && !chatId && (
                    <motion.div
                        key="queue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-full space-y-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
                            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Finding a match...</h3>
                        <p className="text-gray-400 text-sm">Searching for people with similar interests</p>
                        <Button variant="outline" onClick={leaveQueue} className="mt-8 border-red-500/50 text-red-400 hover:bg-red-950/30 hover:text-red-300">
                            Cancel
                        </Button>
                    </motion.div>
                )}

                {chatId && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="h-full flex flex-col bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Anonymous User</h3>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-500/50 text-green-400">Online</Badge>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={leaveChat} className="text-gray-500 hover:text-red-400">
                                <XCircle className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 text-sm my-8">
                                    Say hello! 👋
                                </div>
                            )}
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.is_me
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-gray-800 text-gray-200 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-gray-900/80 border-t border-gray-800 flex gap-2">
                            <Input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-indigo-500"
                            />
                            <Button onClick={handleSend} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
