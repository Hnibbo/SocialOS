import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWebRTCStream, useWebRTCViewer } from './useWebRTCStream';

export interface LiveStream {
    id: string;
    host_id: string;
    title: string;
    description: string | null;
    room_name: string;
    is_active: boolean;
    is_public: boolean;
    viewer_count: number;
    started_at: string;
    thumbnail_url: string | null;
    tags: string[];
    host?: {
        full_name: string;
        username: string;
        avatar_url: string;
    };
}

interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'viewer-join' | 'relay-request' | 'relay-offer' | 'relay-answer' | 'viewer-count';
    from: string;
    to?: string;
    relayPeerId?: string; // For relay connections
    viewerCount?: number; // Total viewer count including relays
    data: any;
}

export function useStreaming() {
    const [streams, setStreams] = useState<LiveStream[]>([]);
    const [loading, setLoading] = useState(false);
    const [myStream, setMyStream] = useState<LiveStream | null>(null);
    const [signalingChannel, setSignalingChannel] = useState<any>(null);

    const webrtc = useWebRTCStream();

    const fetchActiveStreams = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('live_streams')
                .select(`
                    *,
                    host:user_profiles!host_id (
                        full_name,
                        username,
                        avatar_url
                    )
                `)
                .eq('is_active', true)
                .eq('is_public', true)
                .order('started_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setStreams(data || []);
        } catch (error) {
            console.error('Error fetching streams:', error);
            toast.error('Failed to load streams');
        } finally {
            setLoading(false);
        }
    }, []);

    const createStream = useCallback(async (title: string, description?: string, isPublic = true) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('You must be logged in to create a stream');
            return null;
        }

        try {
            const roomName = `stream_${user.id}_${Date.now()}`;

            const { data, error } = await supabase
                .from('live_streams')
                .insert({
                    host_id: user.id,
                    title,
                    description,
                    room_name: roomName,
                    is_public: isPublic,
                })
                .select()
                .single();

            if (error) throw error;

            setMyStream(data);
            toast.success('Stream created!');
            return data;
        } catch (error) {
            console.error('Error creating stream:', error);
            toast.error('Failed to create stream');
            return null;
        }
    }, []);

    const endStream = useCallback(async (streamId: string) => {
        try {
            const { error } = await supabase
                .from('live_streams')
                .update({
                    is_active: false,
                    ended_at: new Date().toISOString(),
                })
                .eq('id', streamId);

            if (error) throw error;

            // Stop WebRTC stream
            webrtc.stopLocalStream();

            // Leave signaling channel
            if (signalingChannel) {
                await supabase.removeChannel(signalingChannel);
                setSignalingChannel(null);
            }

            setMyStream(null);
            toast.success('Stream ended');
        } catch (error) {
            console.error('Error ending stream:', error);
            toast.error('Failed to end stream');
        }
    }, [webrtc, signalingChannel]);

    const startBroadcast = useCallback(async (title: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        try {
            // Start local media stream
            await webrtc.startLocalStream();

            // Create stream record
            const stream = await createStream(title);
            if (!stream) {
                webrtc.stopLocalStream();
                return null;
            }

            // Setup signaling channel
            const channel = supabase.channel(`stream:${stream.id}`, {
                config: { broadcast: { self: true } }
            });

            // Handle signaling messages
            channel.on('broadcast', { event: 'webrtc-signal' }, async (payload: { payload: SignalingMessage }) => {
                const message = payload.payload;

                if (message.type === 'viewer-join' && message.from) {
                    // Create offer for new viewer (may be direct or relay)
                    const offerResult = await webrtc.createOffer(message.from, (candidate) => {
                        channel.send({
                            type: 'broadcast',
                            event: 'webrtc-signal',
                            payload: {
                                type: 'ice-candidate',
                                from: user.id,
                                to: message.from,
                                data: candidate
                            }
                        });
                    });

                    // Check if viewer should use relay
                    if (offerResult.type === 'relay') {
                        // Instruct viewer to connect via relay peer
                        channel.send({
                            type: 'broadcast',
                            event: 'webrtc-signal',
                            payload: {
                                type: 'relay-request',
                                from: user.id,
                                to: message.from,
                                relayPeerId: offerResult.relayPeerId
                            }
                        });
                    } else {
                        // Send direct offer to viewer
                        channel.send({
                            type: 'broadcast',
                            event: 'webrtc-signal',
                            payload: {
                                type: 'offer',
                                from: user.id,
                                to: message.from,
                                data: offerResult.offer
                            }
                        });
                    }
                } else if (message.type === 'answer' && message.to === user.id) {
                    // Handle answer from viewer
                    await webrtc.handleAnswer(message.from, message.data);
                } else if (message.type === 'ice-candidate' && message.to === user.id) {
                    // Handle ICE candidate from viewer
                    await webrtc.addIceCandidate(message.from, message.data);
                } else if (message.type === 'viewer-count') {
                    // Update total viewer count from relay network
                    webrtc.updateTotalViewers(message.viewerCount || 0);
                }
            });

            await channel.subscribe();
            setSignalingChannel(channel);

            // Update viewer count periodically
            const interval = setInterval(async () => {
                const totalCount = webrtc.totalViewers || webrtc.directViewerCount;
                await supabase
                    .from('live_streams')
                    .update({ viewer_count: totalCount })
                    .eq('id', stream.id);
            }, 5000);

            // Cleanup on unmount
            return {
                stream,
                cleanup: () => {
                    clearInterval(interval);
                    endStream(stream.id);
                }
            };
        } catch (error) {
            console.error('Error starting broadcast:', error);
            toast.error('Failed to start broadcast');
            return null;
        }
    }, [webrtc, createStream, endStream]);

    useEffect(() => {
        fetchActiveStreams();

        // Subscribe to stream changes
        const channel = supabase
            .channel('live_streams_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_streams',
            }, () => {
                fetchActiveStreams();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchActiveStreams]);

    return {
        streams,
        loading,
        myStream,
        createStream,
        startBroadcast,
        endStream,
        refreshStreams: fetchActiveStreams,
        webrtc, // Expose WebRTC controls
    };
}

export function useStreamViewer(streamId: string) {
    const viewer = useWebRTCViewer();
    const [signalingChannel, setSignalingChannel] = useState<any>(null);
    const [relayIntervalId, setRelayIntervalId] = useState<NodeJS.Timeout | null>(null);

    const joinStream = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Setup signaling channel
            const channel = supabase.channel(`stream:${streamId}`, {
                config: { broadcast: { self: false } }
            });

            // Handle signaling messages
            channel.on('broadcast', { event: 'webrtc-signal' }, async (payload: { payload: SignalingMessage }) => {
                const message = payload.payload;

                if (message.type === 'offer' && message.to === user.id) {
                    // Received direct offer from broadcaster
                    await viewer.connectToStream(
                        message.data,
                        (answer) => {
                            // Send answer back
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'answer',
                                    from: user.id,
                                    to: message.from,
                                    data: answer
                                }
                            });
                        },
                        (candidate) => {
                            // Send ICE candidate
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'ice-candidate',
                                    from: user.id,
                                    to: message.from,
                                    data: candidate
                                }
                            });
                        }
                    );
                } else if (message.type === 'relay-request' && message.to === user.id && message.relayPeerId) {
                    // Broadcaster wants us to connect via relay peer
                    toast.info('Connecting via relay peer...');

                    // Request relay connection from relay peer
                    channel.send({
                        type: 'broadcast',
                        event: 'webrtc-signal',
                        payload: {
                            type: 'relay-request',
                            from: user.id,
                            to: message.relayPeerId
                        }
                    });
                } else if (message.type === 'relay-request' && message.to === user.id && viewer.isRelaying) {
                    // Another viewer wants to connect through us (we're a relay)
                    await viewer.relayToViewer(
                        message.from,
                        (offer) => {
                            // Send relay offer
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'relay-offer',
                                    from: user.id,
                                    to: message.from,
                                    data: offer
                                }
                            });
                        },
                        (candidate) => {
                            // Send ICE candidate for relay connection
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'ice-candidate',
                                    from: user.id,
                                    to: message.from,
                                    data: candidate
                                }
                            });
                        }
                    );
                } else if (message.type === 'relay-offer' && message.to === user.id) {
                    // Received offer from relay peer
                    await viewer.connectToStream(
                        message.data,
                        (answer) => {
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'relay-answer',
                                    from: user.id,
                                    to: message.from,
                                    data: answer
                                }
                            });
                        },
                        (candidate) => {
                            channel.send({
                                type: 'broadcast',
                                event: 'webrtc-signal',
                                payload: {
                                    type: 'ice-candidate',
                                    from: user.id,
                                    to: message.from,
                                    data: candidate
                                }
                            });
                        }
                    );
                } else if (message.type === 'relay-answer' && message.to === user.id) {
                    // Relay viewer answered our offer
                    await viewer.handleRelayAnswer(message.from, message.data);
                } else if (message.type === 'ice-candidate' && message.to === user.id) {
                    // Handle ICE candidate
                    await viewer.addIceCandidate(message.data);
                }
            });

            await channel.subscribe();
            setSignalingChannel(channel);

            // Announce presence to broadcaster
            channel.send({
                type: 'broadcast',
                event: 'webrtc-signal',
                payload: {
                    type: 'viewer-join',
                    from: user.id
                }
            });

            // Increment viewer count
            await supabase.rpc('increment_stream_viewers', { stream_id: streamId });

            // Periodically report relay viewer count if we're relaying
            const interval = setInterval(() => {
                if (viewer.isRelaying && viewer.relayPeerCount > 0) {
                    channel.send({
                        type: 'broadcast',
                        event: 'webrtc-signal',
                        payload: {
                            type: 'viewer-count',
                            from: user.id,
                            viewerCount: 1 + viewer.relayPeerCount // Us + our relay viewers
                        }
                    });
                }
            }, 5000);

            setRelayIntervalId(interval);

            toast.success('Connected to stream');
        } catch (error) {
            console.error('Error joining stream:', error);
            toast.error('Failed to join stream');
        }
    }, [streamId, viewer]);

    const leaveStream = useCallback(async () => {
        viewer.disconnect();

        if (relayIntervalId) {
            clearInterval(relayIntervalId);
            setRelayIntervalId(null);
        }

        if (signalingChannel) {
            await supabase.removeChannel(signalingChannel);
            setSignalingChannel(null);
        }

        // Decrement viewer count
        await supabase.rpc('decrement_stream_viewers', { stream_id: streamId });
    }, [streamId, viewer, signalingChannel, relayIntervalId]);

    useEffect(() => {
        return () => {
            leaveStream();
        };
    }, [leaveStream]);

    return {
        ...viewer,
        joinStream,
        leaveStream,
    };
}
