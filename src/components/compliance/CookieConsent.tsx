import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONSENT_KEY = 'hup_cookie_consent';

interface ConsentState {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: string;
}

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [consent, setConsent] = useState<ConsentState>({
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: '',
    });

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) {
            setShowBanner(true);
        }
    }, []);

    const saveConsent = (state: ConsentState) => {
        const newState = { ...state, timestamp: new Date().toISOString() };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(newState));
        setShowBanner(false);
    };

    const acceptAll = () => {
        saveConsent({ essential: true, analytics: true, marketing: true, timestamp: '' });
    };

    const acceptEssential = () => {
        saveConsent({ essential: true, analytics: false, marketing: false, timestamp: '' });
    };

    const saveCustom = () => {
        saveConsent(consent);
    };

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-4"
            >
                <Card className="max-w-2xl mx-auto bg-background/95 backdrop-blur border-border/50 shadow-2xl">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <Cookie className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Cookie Preferences</h3>
                                    <p className="text-sm text-muted-foreground">
                                        We use cookies to enhance your experience. Some are essential, others help us improve our service.
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={acceptEssential} className="shrink-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {showDetails && (
                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">Essential</p>
                                        <p className="text-xs text-muted-foreground">Required for the app to work</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Always on</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">Analytics</p>
                                        <p className="text-xs text-muted-foreground">Help us understand usage</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={consent.analytics}
                                        onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                                        className="accent-primary"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">Marketing</p>
                                        <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={consent.marketing}
                                        onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                                        className="accent-primary"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setShowDetails(!showDetails)} className="gap-2">
                                <Settings2 className="w-4 h-4" />
                                {showDetails ? 'Hide' : 'Customize'}
                            </Button>
                            <Button variant="outline" onClick={acceptEssential}>
                                Essential Only
                            </Button>
                            {showDetails ? (
                                <Button onClick={saveCustom}>Save Preferences</Button>
                            ) : (
                                <Button onClick={acceptAll}>Accept All</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
