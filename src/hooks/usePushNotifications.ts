// Hup - Push Notifications Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        // Check if push notifications are supported
        setIsSupported('Notification' in window && 'serviceWorker' in navigator);
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            toast.error('Push notifications are not supported in your browser');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                await registerPushToken();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const registerPushToken = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;

            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });

            setSubscription(sub);

            // Store token in database
            const token = JSON.stringify(sub);
            const { error } = await supabase.from('push_tokens').upsert({
                token,
                platform: 'web',
                device_id: navigator.userAgent.substring(0, 100),
            }, {
                onConflict: 'user_id, token'
            });

            if (error) throw error;
            toast.success('Push notifications enabled!');
        } catch (error) {
            console.error('Error registering push token:', error);
            toast.error('Failed to enable push notifications');
        }
    };

    const unregisterPushToken = async () => {
        try {
            if (subscription) {
                await subscription.unsubscribe();
            }

            // Remove from database
            const { error } = await supabase.from('push_tokens')
                .delete()
                .eq('platform', 'web');

            if (error) throw error;
            setSubscription(null);
            toast.success('Push notifications disabled');
        } catch (error) {
            console.error('Error unregistering push token:', error);
        }
    };

    const sendTestNotification = () => {
        if (permission !== 'granted') {
            toast.error('Please enable notifications first');
            return;
        }

        new Notification('Hup', {
            body: 'Test notification - everything is working!',
            icon: '/icons/icon-192.png',
            badge: '/icons/badge.png',
        });
    };

    return {
        isSupported,
        permission,
        subscription,
        requestPermission,
        unregisterPushToken,
        sendTestNotification,
    };
}
