
import { useCallback } from 'react';

export function useHaptics() {
    const vibrate = useCallback((pattern: number | number[] = 10) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    const light = () => vibrate(5);
    const medium = () => vibrate(15);
    const heavy = () => vibrate(30);
    const success = () => vibrate([10, 50, 10]);
    const error = () => vibrate([50, 30, 50, 30, 50]);

    return { light, medium, heavy, success, error };
}
