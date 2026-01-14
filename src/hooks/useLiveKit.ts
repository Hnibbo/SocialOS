
import { useEffect, useState } from 'react';
import { Room, RoomEvent, VideoPresets, Track } from 'livekit-client';

export type LiveKitState = {
    room: Room | null;
    isConnecting: boolean;
    error: Error | null;
    participants: any[]; // refine type later
};

export function useLiveKit(url: string, token: string) {
    const [state, setState] = useState<LiveKitState>({
        room: null,
        isConnecting: false,
        error: null,
        participants: []
    });

    useEffect(() => {
        if (!url || !token) return;

        const room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: VideoPresets.h720.resolution,
            },
        });

        const connect = async () => {
            setState(prev => ({ ...prev, isConnecting: true, error: null }));
            try {
                await room.connect(url, token);
                setState(prev => ({ ...prev, room, isConnecting: false }));
            } catch (e) {
                setState(prev => ({ ...prev, isConnecting: false, error: e as Error }));
            }
        };

        connect();

        return () => {
            room.disconnect();
        };
    }, [url, token]);

    return state;
}
