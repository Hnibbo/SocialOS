import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Heart, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TipButtonProps {
  recipientId: string;
  recipientName?: string;
  className?: string;
}

export function TipButton({ recipientId, recipientName = "this creator", className }: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate amount
      const tipAmount = customAmount ? parseFloat(customAmount) : amount;
      if (tipAmount <= 0) throw new Error('Amount must be greater than 0');

      // Call Stripe integration to create a tip payment
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create-tip',
          recipientId,
          amount: tipAmount
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success(`Successfully tipped ${recipientName} $${tipAmount.toFixed(2)}!`);
        setIsOpen(false);
        setCustomAmount("");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [5, 10, 20, 50, 100];

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <Heart className="w-4 h-4 mr-2" />
        Tip
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send a Tip</DialogTitle>
            <DialogDescription>
              Support {recipientName} with a one-time tip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Tip Amount</Label>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset && !customAmount ? "default" : "outline"}
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                    className="flex-1"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Custom Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Custom amount"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10"
                    onFocus={() => setAmount(0)}
                  />
                </div>
              </div>
              {customAmount && (
                <div className="text-sm text-muted-foreground">
                  Tip amount: ${parseFloat(customAmount).toFixed(2)}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTip}
              disabled={loading || (customAmount && parseFloat(customAmount) <= 0)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Send Tip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
