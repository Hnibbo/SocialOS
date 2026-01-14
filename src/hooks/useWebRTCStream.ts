import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface WebRTCStreamConfig {
    video: boolean;
    audio: boolean;
    videoConstraints?: MediaTrackConstraints;
    audioConstraints?: MediaTrackConstraints;
}

interface PeerConnection {
    id: string;
    connection: RTCPeerConnection;
    state: RTCPeerConnectionState;
    isRelay?: boolean; // Is this peer relaying to others?
}

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

// Mesh network configuration
const MAX_DIRECT_CONNECTIONS = 10; // Broadcaster connects to max 10 viewers directly
const RELAY_THRESHOLD = 5; // After 5 direct connections, start using relays

export function useWebRTCStream() {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [viewers, setViewers] = useState<PeerConnection[]>([]);
    const [totalViewers, setTotalViewers] = useState(0); // Including relay viewers
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const relayViewersRef = useRef<Set<string>>(new Set()); // Viewers who are relaying

    // Start local media stream (broadcaster)
    const startLocalStream = useCallback(async (config: WebRTCStreamConfig = { video: true, audio: true }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: config.video ? (config.videoConstraints || {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }) : false,
                audio: config.audio ? (config.audioConstraints || {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }) : false
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsStreaming(true);
            toast.success('Camera and microphone ready');
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            toast.error('Failed to access camera/microphone');
            throw error;
        }
    }, []);

    // Stop local stream
    const stopLocalStream = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
            setIsStreaming(false);
        }

        // Close all peer connections
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        relayViewersRef.current.clear();
        setViewers([]);
        setTotalViewers(0);
    }, []);

    // Determine if a new viewer should connect directly or via relay
    const shouldUseRelay = useCallback(() => {
        const directConnections = viewers.filter(v => !v.isRelay).length;
        return directConnections >= MAX_DIRECT_CONNECTIONS;
    }, [viewers]);

    // Get best relay peer for new viewer
    const getBestRelayPeer = useCallback(() => {
        // Find relay viewers with good connection state
        const activeRelays = viewers.filter(v =>
            v.isRelay &&
            v.state === 'connected'
        );

        if (activeRelays.length === 0) {
            // Promote a direct viewer to relay
            const directViewers = viewers.filter(v =>
                !v.isRelay &&
                v.state === 'connected'
            );
            if (directViewers.length > 0) {
                const promoted = directViewers[0];
                relayViewersRef.current.add(promoted.id);
                setViewers(prev => prev.map(v =>
                    v.id === promoted.id ? { ...v, isRelay: true } : v
                ));
                return promoted.id;
            }
        }

        // Return relay with fewest connections (load balancing)
        // For now, just return first available relay
        return activeRelays[0]?.id;
    }, [viewers]);

    // Create peer connection for a viewer
    const createPeerConnection = useCallback((
        viewerId: string,
        onIceCandidate: (candidate: RTCIceCandidate) => void,
        isRelay: boolean = false
    ) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local stream tracks to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                onIceCandidate(event.candidate);
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log(`Peer ${viewerId} state:`, pc.connectionState);
            setViewers(prev => prev.map(v =>
                v.id === viewerId ? { ...v, state: pc.connectionState } : v
            ));

            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                peersRef.current.delete(viewerId);
                relayViewersRef.current.delete(viewerId);
                setViewers(prev => prev.filter(v => v.id !== viewerId));
            }
        };

        peersRef.current.set(viewerId, pc);
        setViewers(prev => [...prev, {
            id: viewerId,
            connection: pc,
            state: pc.connectionState,
            isRelay
        }]);

        return pc;
    }, []);

    // Create offer for viewer
    const createOffer = useCallback(async (
        viewerId: string,
        onIceCandidate: (candidate: RTCIceCandidate) => void
    ) => {
        // Check if we should use relay
        const useRelay = shouldUseRelay();

        if (useRelay) {
            const relayPeerId = getBestRelayPeer();
            if (relayPeerId) {
                // Return relay instruction instead of direct offer
                return {
                    type: 'relay' as const,
                    relayPeerId,
                    message: 'Connect via relay peer'
                };
            }
        }

        // Create direct connection
        const pc = createPeerConnection(viewerId, onIceCandidate, false);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return {
            type: 'direct' as const,
            offer
        };
    }, [createPeerConnection, shouldUseRelay, getBestRelayPeer]);

    // Handle answer from viewer
    const handleAnswer = useCallback(async (viewerId: string, answer: RTCSessionDescriptionInit) => {
        const pc = peersRef.current.get(viewerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }, []);

    // Add ICE candidate
    const addIceCandidate = useCallback(async (viewerId: string, candidate: RTCIceCandidateInit) => {
        const pc = peersRef.current.get(viewerId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    // Remove viewer
    const removeViewer = useCallback((viewerId: string) => {
        const pc = peersRef.current.get(viewerId);
        if (pc) {
            pc.close();
            peersRef.current.delete(viewerId);
            relayViewersRef.current.delete(viewerId);
            setViewers(prev => prev.filter(v => v.id !== viewerId));
        }
    }, []);

    // Update total viewer count (including relay viewers)
    const updateTotalViewers = useCallback((count: number) => {
        setTotalViewers(count);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLocalStream();
        };
    }, [stopLocalStream]);

    return {
        localStream,
        isStreaming,
        viewers,
        directViewerCount: viewers.filter(v => !v.isRelay).length,
        relayViewerCount: viewers.filter(v => v.isRelay).length,
        totalViewers,
        startLocalStream,
        stopLocalStream,
        createOffer,
        handleAnswer,
        addIceCandidate,
        removeViewer,
        updateTotalViewers,
    };
}

// Hook for viewers to receive stream (supports relay)
export function useWebRTCViewer() {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    const [isRelaying, setIsRelaying] = useState(false);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const relayPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    const connectToStream = useCallback(async (
        offer: RTCSessionDescriptionInit,
        onAnswer: (answer: RTCSessionDescriptionInit) => void,
        onIceCandidate: (candidate: RTCIceCandidate) => void
    ) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        // Handle incoming stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            const stream = event.streams[0];
            setRemoteStream(stream);

            // Enable relaying for mesh network
            setIsRelaying(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                onIceCandidate(event.candidate);
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            setConnectionState(pc.connectionState);
        };

        // Set remote description and create answer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        onAnswer(answer);

        return pc;
    }, []);

    // Relay stream to another viewer (mesh network)
    const relayToViewer = useCallback(async (
        viewerId: string,
        onOffer: (offer: RTCSessionDescriptionInit) => void,
        onIceCandidate: (candidate: RTCIceCandidate) => void
    ) => {
        if (!remoteStream) return;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add remote stream tracks to relay connection
        remoteStream.getTracks().forEach(track => {
            pc.addTrack(track, remoteStream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                onIceCandidate(event.candidate);
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        onOffer(offer);

        relayPeersRef.current.set(viewerId, pc);
    }, [remoteStream]);

    const handleRelayAnswer = useCallback(async (viewerId: string, answer: RTCSessionDescriptionInit) => {
        const pc = relayPeersRef.current.get(viewerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }, []);

    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    const disconnect = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
            setRemoteStream(null);
            setConnectionState('closed');
        }

        // Close all relay connections
        relayPeersRef.current.forEach(pc => pc.close());
        relayPeersRef.current.clear();
        setIsRelaying(false);
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        remoteStream,
        connectionState,
        isRelaying,
        relayPeerCount: relayPeersRef.current.size,
        connectToStream,
        relayToViewer,
        handleRelayAnswer,
        addIceCandidate,
        disconnect,
    };
}
