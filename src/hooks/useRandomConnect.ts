import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RandomChatMatch {
    id: string;
    peer_id: string;
    is_initiator: boolean;
}

export function useRandomConnect() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched' | 'connected'>('idle');
    const [match, setMatch] = useState<RandomChatMatch | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const signalingChannelRef = useRef<any>(null);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (signalingChannelRef.current) {
            supabase.removeChannel(signalingChannelRef.current);
            signalingChannelRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
        setStatus('idle');
        setMatch(null);
    }, [localStream]);

    const startSearch = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setStatus('searching');

        try {
            // Start local video early
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            const { data, error } = await supabase.rpc('join_random_chat_queue', {
                p_user_id: user.id
            });

            if (error) throw error;

            if (data.status === 'matched') {
                setMatch({
                    id: data.chat_id,
                    peer_id: data.peer_id,
                    is_initiator: true
                });
                setStatus('matched');
            } else {
                // Wait for someone to match with us
                const channel = supabase
                    .channel('random_chat_matches')
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'random_chats',
                        filter: `user2_id=eq.${user.id}`
                    }, (payload) => {
                        setMatch({
                            id: payload.new.id,
                            peer_id: payload.new.user1_id,
                            is_initiator: false
                        });
                        setStatus('matched');
                        supabase.removeChannel(channel);
                    })
                    .subscribe();
            }
        } catch (err) {
            console.error('Random connect error:', err);
            toast.error('Failed to start search');
            cleanup();
        }
    }, [cleanup]);

    const setupSignaling = useCallback(async () => {
        if (!match || !localStream) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const channel = supabase.channel(`chat:${match.id}`);
        signalingChannelRef.current = channel;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => setRemoteStream(event.streams[0]);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', from: user.id, data: event.candidate }
                });
            }
        };

        channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
            if (payload.from === user.id) return;

            if (payload.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'answer', from: user.id, data: answer }
                });
                setStatus('connected');
            } else if (payload.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
                setStatus('connected');
            } else if (payload.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(payload.data));
            }
        });

        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && match.is_initiator) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'offer', from: user.id, data: offer }
                });
            }
        });
    }, [match, localStream]);

    useEffect(() => {
        if (status === 'matched' && match) {
            setupSignaling();
        }
    }, [status, match, setupSignaling]);

    return {
        status,
        match,
        localStream,
        remoteStream,
        startSearch,
        next: () => {
            cleanup();
            startSearch();
        },
        stop: cleanup
    };
}
