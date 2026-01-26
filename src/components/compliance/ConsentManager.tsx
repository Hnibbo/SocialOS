import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Settings, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import { gdprConfig } from '@/lib/security/config';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_KEY = 'hup_consent';
const CONSENT_VERSION = '2.0';

export function ConsentManager() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentState>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
    timestamp: '',
    version: CONSENT_VERSION,
  });
  
  const [showBanner, setShowBanner] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [hasConsentBeenGiven, setHasConsentBeenGiven] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if consent has been given previously
  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      // Check if consent version matches
      if (parsed.version === CONSENT_VERSION) {
        setConsent(parsed);
        setHasConsentBeenGiven(true);
      } else {
        // Show banner if consent version is outdated
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  // Save consent to localStorage and database
  const saveConsent = async (newConsent: ConsentState) => {
    setIsSaving(true);
    try {
      const consentWithTimestamp = { 
        ...newConsent, 
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION
      };
      setConsent(consentWithTimestamp);
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentWithTimestamp));
      setHasConsentBeenGiven(true);
      setShowBanner(false);
      
      // Fire consent analytics event
      if (typeof window !== 'undefined' && 'gtag' in window) {
        window.gtag('consent', 'update', {
          analytics_storage: newConsent.analytics ? 'granted' : 'denied',
          ad_storage: newConsent.marketing ? 'granted' : 'denied',
          functionality_storage: newConsent.functional ? 'granted' : 'denied',
        });
      }

      // Send consent data to database for audit purposes
      if (user) {
        await supabase
          .from('user_consents')
          .insert({
            user_id: user.id,
            consent_type: 'full',
            consent_version: CONSENT_VERSION,
            granted: true,
            consent_data: consentWithTimestamp,
            ip_address: null, // Would be set from server side
            user_agent: navigator.userAgent
          });
      }
    } catch (error) {
      console.error('Failed to save consent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptAll = () => {
    const newConsent = {
      ...consent,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(newConsent);
  };

  const handleRejectAll = () => {
    const newConsent = {
      ...consent,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(newConsent);
  };

  const handleToggleCategory = (category: keyof ConsentState, value: boolean) => {
    if (category === 'essential') return; // Essential cannot be disabled
    
    const newConsent = {
      ...consent,
      [category]: value,
    };
    saveConsent(newConsent);
  };

  if (hasConsentBeenGiven) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && (
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
                      <h3 className="font-semibold">Privacy Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        We use cookies to enhance your experience. Some are essential, others help us improve our service.
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRejectAll} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowDialog(true)} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Customize
                  </Button>
                  <Button variant="outline" onClick={handleRejectAll}>
                    Essential Only
                  </Button>
                  <Button onClick={handleAcceptAll} disabled={isSaving}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Accept All'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consent Settings Dialog */}
      <AnimatePresence>
        {showDialog && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="bg-background/95 backdrop-blur-md border border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  Privacy Preferences
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  Manage your cookie and tracking preferences. Essential cookies are required for the 
                  website to function properly and cannot be disabled.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {gdprConfig.consent.categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{category.name}</h4>
                        <p className="text-sm text-white/60">{category.description}</p>
                      </div>
                      <Switch 
                        checked={consent[category.id as keyof ConsentState]}
                        onCheckedChange={(checked) => handleToggleCategory(category.id as keyof ConsentState, checked)}
                        disabled={category.required || isSaving}
                      />
                    </div>
                    
                    {category.cookies.length > 0 && (
                      <div className="text-xs text-white/40 pl-2">
                        Cookies: {category.cookies.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 text-xs text-white/40 pt-4 border-t border-white/10">
                <p>
                  For more information, please see our{' '}
                  <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a> and{' '}
                  <a href="/terms" className="underline hover:text-primary">Terms of Service</a>.
                </p>
                <p>
                  You can change your preferences at any time by visiting the Privacy Settings page.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleRejectAll} disabled={isSaving}>
                  Reject All Non-Essential
                </Button>
                <Button onClick={handleAcceptAll} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Accept All'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
