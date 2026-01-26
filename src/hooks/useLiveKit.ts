
import { useEffect, useState, useCallback } from 'react';
import { Room, RoomEvent, VideoPresets, Track, RemoteParticipant } from 'livekit-client';
import { toast } from 'sonner';

export type LiveKitState = {
    room: Room | null;
    isConnecting: boolean;
    error: Error | null;
    participants: RemoteParticipant[];
    localStream: MediaStream | null;
};

export function useLiveKit(url: string, token: string) {
    const [state, setState] = useState<LiveKitState>({
        room: null,
        isConnecting: false,
        error: null,
        participants: [],
        localStream: null
    });

    const handleError = useCallback((error: Error) => {
        console.error('LiveKit error:', error);
        toast.error(`LiveKit Error: ${error.message}`);
        setState(prev => ({ ...prev, error, isConnecting: false }));
    }, []);

    useEffect(() => {
        if (!url || !token) {
            if (state.room) {
                state.room.disconnect();
                setState(prev => ({
                    ...prev,
                    room: null,
                    participants: [],
                    localStream: null
                }));
            }
            return;
        }

        const room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: VideoPresets.h720.resolution,
            },
        });

        // Handle room events
        room.on(RoomEvent.ParticipantConnected, (participant) => {
            setState(prev => ({
                ...prev,
                participants: [...prev.participants, participant]
            }));
            toast.info(`${participant.identity} joined the room`);
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            setState(prev => ({
                ...prev,
                participants: prev.participants.filter(p => p.identity !== participant.identity)
            }));
            toast.info(`${participant.identity} left the room`);
        });

        room.on(RoomEvent.RoomDisconnected, (reason) => {
            console.log('Room disconnected:', reason);
            toast.warning('Disconnected from room');
            setState(prev => ({
                ...prev,
                room: null,
                participants: [],
                localStream: null,
                isConnecting: false
            }));
        });

        room.on(RoomEvent.Error, handleError);

        const connect = async () => {
            setState(prev => ({ ...prev, isConnecting: true, error: null }));
            try {
                await room.connect(url, token);
                setState(prev => ({ ...prev, room, isConnecting: false }));
                toast.success('Connected to room');
            } catch (e) {
                handleError(e as Error);
            }
        };

        connect();

        return () => {
            room.disconnect();
        };
    }, [url, token, handleError]);

    // Start local camera/microphone
    const startLocalStream = useCallback(async () => {
        if (!state.room) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setState(prev => ({ ...prev, localStream: stream }));
            toast.success('Camera and microphone activated');
        } catch (error) {
            handleError(error as Error);
        }
    }, [state.room, handleError]);

    // Stop local camera/microphone
    const stopLocalStream = useCallback(() => {
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
            setState(prev => ({ ...prev, localStream: null }));
        }
    }, [state.localStream]);

    // Publish local stream
    const publishStream = useCallback(async () => {
        if (!state.room || !state.localStream) return;

        try {
            // Publish video track
            const videoTrack = state.localStream.getVideoTracks()[0];
            if (videoTrack) {
                await state.room.localParticipant.publishTrack(videoTrack, {
                    name: 'camera',
                    videoSimulcastLayers: [VideoPresets.h720, VideoPresets.h540, VideoPresets.h360]
                });
            }

            // Publish audio track
            const audioTrack = state.localStream.getAudioTracks()[0];
            if (audioTrack) {
                await state.room.localParticipant.publishTrack(audioTrack, {
                    name: 'microphone'
                });
            }

            toast.success('Stream published');
        } catch (error) {
            handleError(error as Error);
        }
    }, [state.room, state.localStream, handleError]);

    // Unpublish local stream
    const unpublishStream = useCallback(() => {
        if (!state.room) return;

        try {
            state.room.localParticipant.unpublishAllTracks();
            toast.success('Stream unpublished');
        } catch (error) {
            handleError(error as Error);
        }
    }, [state.room, handleError]);

    return {
        ...state,
        startLocalStream,
        stopLocalStream,
        publishStream,
        unpublishStream
    };
}
