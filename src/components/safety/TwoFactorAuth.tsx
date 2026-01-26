import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Switch } from '@/components/ui/switch';
import { Shield, Smartphone, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TwoFactorAuth() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    const check2FAStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('two_factor_enabled')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsEnabled(data.two_factor_enabled || false);
      } catch (error) {
        console.error('Failed to check 2FA status:', error);
      }
    };

    check2FAStatus();
  }, [user]);

  const handleEnable2FA = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // In a real implementation, you would generate a secret and QR code using a library like speakeasy
      // For this example, we'll simulate it with dummy data
      const dummySecret = 'JBSWY3DPEHPK3PXP';
      const dummyQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAgAElEQVR4Ae2dB5QURfX3...';

      setSecret(dummySecret);
      setQrCode(dummyQRCode);
    } catch (error) {
      toast.error('Failed to enable 2FA');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!user || !otp) return;

    setIsVerifying(true);
    try {
      // In a real implementation, you would verify the OTP against the secret
      // For this example, we'll just simulate a successful verification
      if (otp.length === 6) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ two_factor_enabled: true })
          .eq('id', user.id);

        if (error) throw error;

        setIsEnabled(true);
        setOtp('');
        setQrCode(null);
        setSecret(null);
        toast.success('Two-factor authentication enabled successfully');
      } else {
        toast.error('Please enter a valid 6-digit OTP');
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ two_factor_enabled: false })
        .eq('id', user.id);

      if (error) throw error;

      setIsEnabled(false);
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error('Failed to disable 2FA');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => {
            if (checked) {
              handleEnable2FA();
            } else {
              handleDisable2FA();
            }
          }}
          disabled={isLoading || isVerifying}
        />
      </div>

      {qrCode && !isEnabled && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="font-medium mb-2">Scan QR Code</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app (e.g., Google Authenticator)
              </p>
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" className="w-full h-full" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  )}
                </div>
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                Or enter this code manually: {secret}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter OTP</label>
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify and Enable'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQrCode(null);
                  setSecret(null);
                  setOtp('');
                }}
                disabled={isVerifying}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isEnabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-500">Two-factor authentication is enabled</p>
              <p className="text-sm text-green-500/80">Your account is protected by 2FA</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Recovery Codes</h4>
            <p className="text-sm text-muted-foreground">
              Save these recovery codes in a safe place. They can be used to access your account if you lose your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['ABCD-1234', 'EFGH-5678', 'IJKL-9012', 'MNOP-3456'].map((code, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isEnabled && !qrCode && (
        <div className="p-6 rounded-lg bg-muted/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Two-factor authentication not enabled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enable 2FA to add an extra layer of security to your account. You'll be required to enter a verification code from your authenticator app when logging in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
